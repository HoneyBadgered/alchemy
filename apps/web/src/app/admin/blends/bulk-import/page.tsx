'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface BulkBlendData {
  name: string;
  description: string;
  price: number;
  baseTea: string;
  baseAmount: number;
  additions: Array<{
    ingredientId?: string;
    ingredientName?: string;
    amount: number;
  }>;
  zones?: string[];
  isActive?: boolean;
  caffeineLevel?: string;
  flavorNotes?: string[];
  occasion?: string[];
}

interface Ingredient {
  id: string;
  name: string;
}

export default function BulkBlendImportPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [importMode, setImportMode] = useState<'csv' | 'json'>('json');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Fetch ingredients on mount
  useState(() => {
    const fetchIngredients = async () => {
      try {
        const response = await fetch('http://localhost:3000/ingredients', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setIngredients(data);
        }
      } catch (error) {
        console.error('Failed to fetch ingredients:', error);
      }
    };
    fetchIngredients();
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (csvText: string): BulkBlendData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const blend: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        
        if (header === 'price' || header === 'baseAmount') {
          blend[header] = parseFloat(value);
        } else if (header === 'zones' || header === 'flavorNotes' || header === 'occasion') {
          blend[header] = value ? value.split(';').map(v => v.trim()) : [];
        } else if (header === 'additions') {
          // Format: name:amount;name:amount OR ingredientId:amount;ingredientId:amount
          blend[header] = value ? value.split(';').map(item => {
            const [nameOrId, amount] = item.split(':');
            const trimmed = nameOrId.trim();
            
            // Check if it's a UUID (ingredientId) or a name
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
            
            return isUUID
              ? { ingredientId: trimmed, amount: parseFloat(amount) }
              : { ingredientName: trimmed, amount: parseFloat(amount) };
          }) : [];
        } else if (header === 'isActive') {
          blend[header] = value.toLowerCase() === 'true';
        } else {
          blend[header] = value;
        }
      });
      
      return blend;
    });
  };

  const resolveIngredientIds = (blend: BulkBlendData): { blend: BulkBlendData; errors: string[] } => {
    const errors: string[] = [];
    const resolvedAdditions = blend.additions.map(addition => {
      // If ingredientId is already provided, use it
      if (addition.ingredientId) {
        return addition;
      }
      
      // Otherwise, look up by name
      if (addition.ingredientName) {
        const ingredient = ingredients.find(
          ing => ing.name.toLowerCase() === addition.ingredientName!.toLowerCase()
        );
        
        if (ingredient) {
          return {
            ingredientId: ingredient.id,
            amount: addition.amount,
          };
        } else {
          errors.push(`Ingredient not found: "${addition.ingredientName}"`);
          return addition;
        }
      }
      
      errors.push('Addition missing both ingredientId and ingredientName');
      return addition;
    });

    return {
      blend: {
        ...blend,
        additions: resolvedAdditions.filter(a => a.ingredientId) as Array<{
          ingredientId: string;
          amount: number;
        }>,
      },
      errors,
    };
  };

  const handleImport = async () => {
    setImporting(true);
    setResults(null);

    try {
      let blendsData: BulkBlendData[] = [];

      if (importMode === 'csv' && file) {
        const text = await file.text();
        blendsData = parseCSV(text);
      } else if (importMode === 'json') {
        blendsData = JSON.parse(jsonInput);
        if (!Array.isArray(blendsData)) {
          blendsData = [blendsData];
        }
      }

      const errors: string[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < blendsData.length; i++) {
        const blend = blendsData[i];
        
        try {
          // Resolve ingredient names to IDs
          const { blend: resolvedBlend, errors: resolveErrors } = resolveIngredientIds(blend);
          
          if (resolveErrors.length > 0) {
            errors.push(`Blend ${i + 1} (${blend.name}): ${resolveErrors.join(', ')}`);
            failedCount++;
            continue;
          }

          const response = await fetch('http://localhost:3000/admin/blends', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(resolvedBlend),
          });

          if (!response.ok) {
            const error = await response.json();
            errors.push(`Blend ${i + 1} (${blend.name}): ${error.message || 'Failed to create'}`);
            failedCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          errors.push(`Blend ${i + 1} (${blend.name}): ${error instanceof Error ? error.message : 'Unknown error'}`);
          failedCount++;
        }
      }

      setResults({
        success: successCount,
        failed: failedCount,
        errors,
      });
    } catch (error) {
      setResults({
        success: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Failed to parse file'],
      });
    } finally {
      setImporting(false);
    }
  };

  const exampleJSON = `[
  {
    "name": "Morning Clarity",
    "description": "A bright green tea blend to start your day",
    "price": 18.99,
    "baseTea": "green",
    "baseAmount": 50,
    "additions": [
      { "ingredientName": "Peppermint", "amount": 10 },
      { "ingredientName": "Lemon Verbena", "amount": 5 }
    ],
    "zones": ["The East Pavilion"],
    "isActive": true,
    "caffeineLevel": "medium",
    "flavorNotes": ["bright", "refreshing", "citrus"],
    "occasion": ["morning", "energizing"]
  }
]`;

  const exampleCSV = `name,description,price,baseTea,baseAmount,additions,zones,isActive,caffeineLevel,flavorNotes,occasion
Morning Clarity,A bright green tea blend,18.99,green,50,Peppermint:10;Lemon Verbena:5,The East Pavilion,true,medium,bright;refreshing;citrus,morning;energizing
Evening Calm,Relaxing herbal blend,16.99,tisane,60,Chamomile:15;Lavender:10,The Observatory,true,none,calming;floral;soothing,evening;relaxing`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Admin
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bulk Blend Import
          </h1>
          <p className="text-gray-600 mb-8">
            Import multiple blends at once using JSON or CSV format
          </p>

          {/* Import Mode Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setImportMode('json')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                importMode === 'json'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              JSON Import
            </button>
            <button
              onClick={() => setImportMode('csv')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                importMode === 'csv'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              CSV Import
            </button>
          </div>

          {/* JSON Input */}
          {importMode === 'json' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JSON Data
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="Paste your JSON data here..."
              />
              <details className="mt-2">
                <summary className="text-sm text-purple-600 cursor-pointer hover:text-purple-700">
                  Show example JSON format
                </summary>
                <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                  {exampleJSON}
                </pre>
              </details>
            </div>
          )}

          {/* CSV Upload */}
          {importMode === 'csv' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name}
                </p>
              )}
              <details className="mt-2">
                <summary className="text-sm text-purple-600 cursor-pointer hover:text-purple-700">
                  Show example CSV format
                </summary>
                <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                  {exampleCSV}
                </pre>
              </details>
            </div>
          )}

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={importing || (importMode === 'json' && !jsonInput) || (importMode === 'csv' && !file)}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {importing ? 'Importing...' : 'Import Blends'}
          </button>

          {/* Results */}
          {results && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Import Results
              </h2>
              <div className="space-y-2 mb-4">
                <p className="text-green-600 font-medium">
                  ✓ Successfully imported: {results.success}
                </p>
                {results.failed > 0 && (
                  <p className="text-red-600 font-medium">
                    ✗ Failed: {results.failed}
                  </p>
                )}
              </div>

              {results.errors.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Errors:</h3>
                  <ul className="space-y-1">
                    {results.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-600">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.success > 0 && (
                <button
                  onClick={() => router.push('/admin/blends')}
                  className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                >
                  View Blends →
                </button>
              )}
            </div>
          )}

          {/* Format Guide */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Field Guide</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><strong>name:</strong> Blend name (required)</li>
              <li><strong>description:</strong> Blend description (required)</li>
              <li><strong>price:</strong> Price in dollars (required)</li>
              <li><strong>baseTea:</strong> Base tea type: black, green, white, oolong, tisane (required)</li>
              <li><strong>baseAmount:</strong> Base tea amount in grams (required)</li>
              <li><strong>additions:</strong> Array of ingredient objects with <code>ingredientName</code> (or <code>ingredientId</code>) and <code>amount</code></li>
              <li><strong>zones:</strong> Array of zone names (optional)</li>
              <li><strong>isActive:</strong> Published status, true/false (optional, default: false)</li>
              <li><strong>caffeineLevel:</strong> none, low, medium, or high (optional)</li>
              <li><strong>flavorNotes:</strong> Array of flavor descriptors (optional)</li>
              <li><strong>occasion:</strong> Array of occasions/times (optional)</li>
            </ul>
            <div className="mt-4 p-3 bg-blue-100 rounded">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> You can use ingredient names (e.g., "Peppermint") instead of IDs. 
                The system will automatically look up and match them. Names are case-insensitive.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
