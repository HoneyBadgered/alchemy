'use client';

/**
 * Bulk Ingredient Import Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  errors: string[];
}

export default function BulkIngredientImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [importMode, setImportMode] = useState<'csv' | 'json'>('csv');
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, hasHydrated } = useAuthStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!hasHydrated || !accessToken) return;

    try {
      const response = await fetch(`${API_URL}/admin/ingredients/import/template`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ingredients-import-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleValidate = async () => {
    if (!file || !hasHydrated || !accessToken) return;

    setValidating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/admin/ingredients/import/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!data.valid) {
        setError(`Validation failed: ${data.errors.join(', ')}`);
      } else {
        alert('✓ CSV file is valid and ready to import');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (importMode === 'csv') {
      await handleCSVImport();
    } else {
      await handleJSONImport();
    }
  };

  const handleCSVImport = async () => {
    if (!file || !hasHydrated || !accessToken) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/admin/ingredients/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success && (data.imported > 0 || data.updated > 0)) {
        setTimeout(() => {
          router.push('/admin/ingredients');
        }, 3000);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const handleJSONImport = async () => {
    if (!jsonInput.trim() || !hasHydrated || !accessToken) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const ingredients = JSON.parse(jsonInput);

      const response = await fetch(`${API_URL}/admin/ingredients/import/json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredients),
      });

      const data = await response.json();
      setResult(data);

      if (data.success && (data.imported > 0 || data.updated > 0)) {
        setTimeout(() => {
          router.push('/admin/ingredients');
        }, 3000);
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your input.');
      } else {
        setError((err as Error).message);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Ingredient Import</h1>
          <p className="text-gray-600 mt-1">Import multiple ingredients from CSV file</p>
        </div>
        <Link
          href="/admin/ingredients"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
        >
          Back to Ingredients
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className={`border px-4 py-3 rounded-lg ${
          result.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <p className="font-semibold">Import Results</p>
          <div className="text-sm mt-2 space-y-1">
            {result.imported > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>{result.imported} ingredient{result.imported !== 1 ? 's' : ''} created</span>
              </div>
            )}
            {result.updated > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-blue-600">⟳</span>
                <span>{result.updated} ingredient{result.updated !== 1 ? 's' : ''} updated</span>
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-red-600">Errors:</p>
                <ul className="list-disc list-inside ml-2">
                  {result.errors.map((err, i) => (
                    <li key={i} className="text-red-700">{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {result.success && (result.imported > 0 || result.updated > 0) && (
            <p className="text-sm mt-3 font-medium">Redirecting to ingredients list...</p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">How to Import Ingredients</h2>
        
        {/* Mode Toggle */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => {
              setImportMode('csv');
              setJsonInput('');
              setResult(null);
              setError(null);
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              importMode === 'csv'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 border border-blue-600'
            }`}
          >
            CSV Upload
          </button>
          <button
            onClick={() => {
              setImportMode('json');
              setFile(null);
              setResult(null);
              setError(null);
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              importMode === 'json'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 border border-blue-600'
            }`}
          >
            JSON Paste
          </button>
        </div>

        {importMode === 'csv' ? (
          <>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Download the CSV template below</li>
              <li>Fill in your ingredient data following the example format</li>
              <li>Upload the completed CSV file</li>
              <li>Optionally validate the file before importing</li>
              <li>Click "Import Ingredients" to complete the import</li>
            </ol>

            <div className="mt-4">
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
              >
                📥 Download CSV Template
              </button>
            </div>
          </>
        ) : (
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Prepare your ingredients as a JSON array</li>
            <li>Paste the JSON into the text area below</li>
            <li>Click "Import Ingredients" to process</li>
            <li>Existing ingredients (matched by name) will be updated</li>
            <li>New ingredients will be created</li>
          </ol>
        )}
      </div>

      {/* File Upload or JSON Input */}
      {importMode === 'csv' ? (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Upload CSV File</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="space-y-2">
                <div className="text-4xl">📄</div>
                <p className="text-gray-700 font-medium">
                  {file ? file.name : 'Click to select CSV file'}
                </p>
                <p className="text-sm text-gray-500">
                  or drag and drop
                </p>
              </div>
            </label>
          </div>

          {file && (
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleValidate}
                disabled={validating}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? 'Validating...' : 'Validate File'}
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import Ingredients'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Paste JSON Data</h2>
          
          <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <details className="cursor-pointer">
              <summary className="font-medium text-gray-700 select-none">
                📋 View Complete JSON Format Example
              </summary>
              <div className="mt-3 overflow-x-auto">
                <pre className="text-xs bg-white p-3 rounded border border-gray-300 overflow-x-auto">
{`[
  {
    "ingredientKey": "chamomile",
    "name": "Chamomile Flowers",
    "role": "addIn",
    "category": "flowers",
    "teaType": "tisane",
    "descriptionShort": "Calming floral tea with sweet apple notes",
    "descriptionLong": "Premium Egyptian chamomile flowers...",
    "image": "https://example.com/images/chamomile.jpg",
    "latinName": "Matricaria chamomilla",
    "flavorNotes": ["sweet", "floral", "apple", "honey"],
    "cutOrGrade": "whole flowers",
    "recommendedUsageMin": 5,
    "recommendedUsageMax": 10,
    "steepTemperature": 212,
    "steepTimeMin": 5,
    "steepTimeMax": 7,
    "brewNotes": "Best steeped covered to preserve oils",
    "supplierId": null,
    "costPerOunce": 2.50,
    "inventoryAmount": 500,
    "minimumStockLevel": 100,
    "status": "active",
    "caffeineLevel": "none",
    "allergens": ["ragweed"],
    "internalNotes": "Store in cool, dry place",
    "emoji": "🌼",
    "tags": ["relaxing", "bedtime", "organic"],
    "badges": ["organic", "premium"],
    "adminTags": null
  },
  {
    "ingredientKey": "earl_grey",
    "name": "Earl Grey Black Tea",
    "role": "base",
    "category": "base",
    "teaType": "black",
    "descriptionShort": "Classic bergamot-infused black tea",
    "descriptionLong": "Premium Ceylon black tea...",
    "image": "https://example.com/images/earl-grey.jpg",
    "latinName": "Camellia sinensis",
    "flavorNotes": ["citrus", "bergamot", "malty"],
    "cutOrGrade": "FBOP",
    "recommendedUsageMin": 2,
    "recommendedUsageMax": 3,
    "steepTemperature": 212,
    "steepTimeMin": 3,
    "steepTimeMax": 5,
    "brewNotes": "Use boiling water. Do not over-steep.",
    "supplierId": null,
    "costPerOunce": 1.25,
    "inventoryAmount": 2000,
    "minimumStockLevel": 400,
    "status": "active",
    "caffeineLevel": "high",
    "allergens": [],
    "internalNotes": "Popular base tea",
    "emoji": "☕",
    "tags": ["classic", "morning", "caffeinated"],
    "badges": ["bestseller", "fair-trade"],
    "adminTags": {
      "supplier": "Ceylon Tea Co",
      "origin": "Sri Lanka"
    }
  }
]`}
                </pre>
                <div className="mt-3 text-xs text-gray-600">
                  <p className="font-semibold mb-1">Required Fields:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li><code className="bg-gray-100 px-1 rounded">ingredientKey</code> (string) - Unique stable identifier (lowercase, hyphens/underscores)</li>
                    <li><code className="bg-gray-100 px-1 rounded">name</code> (string) - Ingredient name</li>
                    <li><code className="bg-gray-100 px-1 rounded">category</code> (enum) - base | flowers | herbs | fruit | spice | sweet | essence | specialty</li>
                  </ul>
                  <p className="font-semibold mt-2 mb-1">Key Optional Fields:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li><code className="bg-gray-100 px-1 rounded">role</code> - base | addIn | either (default: addIn)</li>
                    <li><code className="bg-gray-100 px-1 rounded">teaType</code> - black | green | oolong | white | tisane | null</li>
                    <li><code className="bg-gray-100 px-1 rounded">flavorNotes</code> - Array of flavor descriptors</li>
                    <li><code className="bg-gray-100 px-1 rounded">caffeineLevel</code> - none | low | medium | high (default: none)</li>
                    <li><code className="bg-gray-100 px-1 rounded">status</code> - active | archived | outOfStock (default: active)</li>
                    <li><code className="bg-gray-100 px-1 rounded">tags</code>, <code className="bg-gray-100 px-1 rounded">badges</code>, <code className="bg-gray-100 px-1 rounded">allergens</code> - Arrays</li>
                  </ul>
                  <p className="mt-2 text-gray-500 italic">Note: costPerGram is auto-calculated from costPerOunce</p>
                </div>
              </div>
            </details>
          </div>
          
          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setResult(null);
              setError(null);
            }}
            placeholder={`[\n  {\n    "ingredientKey": "chamomile",\n    "name": "Chamomile Flowers",\n    "role": "addIn",\n    "category": "flowers",\n    "teaType": "tisane",\n    "flavorNotes": ["sweet", "floral", "apple"],\n    "caffeineLevel": "none",\n    "tags": ["relaxing", "bedtime"]\n  }\n]`}
            className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />

          {jsonInput.trim() && (
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import Ingredients'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Field Reference */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Field Reference (CSV & JSON)</h2>
        <p className="text-sm text-gray-600 mb-4">
          All fields are available in both CSV and JSON formats. For CSV, use comma-separated values for arrays.
          For JSON, use proper array syntax.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Field</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Required</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 font-mono text-xs">ingredientKey</td>
                <td className="px-4 py-2 text-red-600">Yes</td>
                <td className="px-4 py-2 text-gray-600">string</td>
                <td className="px-4 py-2">Unique stable identifier (lowercase, hyphens/underscores only, e.g., "chamomile", "earl_grey")</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">name</td>
                <td className="px-4 py-2 text-red-600">Yes</td>
                <td className="px-4 py-2 text-gray-600">string</td>
                <td className="px-4 py-2">Display name of the ingredient</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">role</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">enum</td>
                <td className="px-4 py-2">base | addIn | either (default: addIn)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">category</td>
                <td className="px-4 py-2 text-red-600">Yes</td>
                <td className="px-4 py-2 text-gray-600">enum</td>
                <td className="px-4 py-2">base | flowers | herbs | fruit | spice | sweet | essence | specialty</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">teaType</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">enum</td>
                <td className="px-4 py-2">black | green | oolong | white | tisane (for base teas)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">descriptionShort</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">string</td>
                <td className="px-4 py-2">Brief one-line description</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">descriptionLong</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">string</td>
                <td className="px-4 py-2">Detailed multi-line description</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">image</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">string</td>
                <td className="px-4 py-2">Image URL</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">latinName</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">string</td>
                <td className="px-4 py-2">Scientific/botanical name</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">flavorNotes</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">array</td>
                <td className="px-4 py-2">CSV: comma-separated (sweet,floral,apple) | JSON: array format</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">cutOrGrade</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">string</td>
                <td className="px-4 py-2">Cut or grade (e.g., "whole flowers", "FBOP", "fannings")</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">recommendedUsageMin</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">number</td>
                <td className="px-4 py-2">Minimum recommended usage percentage (0-100)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">recommendedUsageMax</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">number</td>
                <td className="px-4 py-2">Maximum recommended usage percentage (0-100)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">steepTemperature</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">number</td>
                <td className="px-4 py-2">Steeping temperature in Fahrenheit (e.g., 212)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">steepTimeMin</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">number</td>
                <td className="px-4 py-2">Minimum steep time in minutes</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">steepTimeMax</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">number</td>
                <td className="px-4 py-2">Maximum steep time in minutes</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">brewNotes</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">string</td>
                <td className="px-4 py-2">Brewing instructions and tips</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">supplierId</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">string</td>
                <td className="px-4 py-2">Supplier ID (from database)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">costPerOunce</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">number</td>
                <td className="px-4 py-2">Cost per ounce (e.g., 2.50) - costPerGram is auto-calculated</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">inventoryAmount</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">number</td>
                <td className="px-4 py-2">Current inventory in grams (default: 0)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">minimumStockLevel</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">number</td>
                <td className="px-4 py-2">Low stock threshold in grams (default: 0)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">status</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">enum</td>
                <td className="px-4 py-2">active | archived | outOfStock (default: active)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">caffeineLevel</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">enum</td>
                <td className="px-4 py-2">none | low | medium | high (default: none)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">allergens</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">array</td>
                <td className="px-4 py-2">CSV: comma-separated | JSON: array format</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">internalNotes</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">string</td>
                <td className="px-4 py-2">Internal notes (not visible to customers)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">emoji</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">string</td>
                <td className="px-4 py-2">Emoji icon (e.g., 🌼)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">tags</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">array</td>
                <td className="px-4 py-2">CSV: comma-separated (relaxing,bedtime) | JSON: array format</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">badges</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2 text-gray-600">array</td>
                <td className="px-4 py-2">CSV: comma-separated (organic,premium) | JSON: array format</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Important Notes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Duplicate Detection:</strong> Ingredients are identified by <code className="bg-blue-100 px-1 rounded">ingredientKey</code> + <code className="bg-blue-100 px-1 rounded">role</code> combination</li>
            <li><strong>Same Ingredient, Multiple Roles:</strong> You can have the same ingredientKey with different roles (e.g., "chamomile" as both base and addIn)</li>
            <li><strong>CSV Arrays:</strong> Use comma-separated values without spaces (e.g., sweet,floral,apple)</li>
            <li><strong>JSON Arrays:</strong> Use proper JSON array syntax (e.g., ["sweet", "floral", "apple"])</li>
            <li><strong>Auto-calculated:</strong> costPerGram is automatically calculated from costPerOunce</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
