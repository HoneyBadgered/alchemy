'use client';

/**
 * Bulk Product Import Page
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

export default function BulkImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
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
      const response = await fetch('http://localhost:3000/admin/products/import/template', {
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
      a.download = 'product-import-template.csv';
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

      const response = await fetch('http://localhost:3000/admin/products/import/validate', {
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
    if (!file || !hasHydrated || !accessToken) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3000/admin/products/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success && data.imported > 0) {
        setTimeout(() => {
          router.push('/admin/products');
        }, 3000);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Product Import</h1>
          <p className="text-gray-600 mt-1">Import multiple products from CSV file</p>
        </div>
        <Link
          href="/admin/products"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
        >
          Back to Products
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
            <p>✓ Successfully imported: {result.imported} products</p>
            {result.failed > 0 && <p>✗ Failed: {result.failed} products</p>}
          </div>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold text-sm mb-2">Errors:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.errors.map((err, idx) => (
                  <p key={idx} className="text-xs">
                    Row {err.row}: {err.error}
                  </p>
                ))}
              </div>
            </div>
          )}
          {result.success && result.imported > 0 && (
            <p className="text-sm mt-3 font-medium">Redirecting to products list...</p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">How to Import Products</h2>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Download the CSV template below</li>
          <li>Fill in your product data following the example format</li>
          <li>Upload the completed CSV file</li>
          <li>Optionally validate the file before importing</li>
          <li>Click "Import Products" to complete the import</li>
        </ol>

        <div className="mt-4">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
          >
            📥 Download CSV Template
          </button>
        </div>
      </div>

      {/* File Upload */}
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
              {importing ? 'Importing...' : 'Import Products'}
            </button>
          </div>
        )}
      </div>

      {/* CSV Format Reference */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">CSV Format Reference</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Column</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Required</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 font-mono text-xs">name</td>
                <td className="px-4 py-2 text-red-600">Yes</td>
                <td className="px-4 py-2">Product name</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">description</td>
                <td className="px-4 py-2 text-red-600">Yes</td>
                <td className="px-4 py-2">Product description</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">price</td>
                <td className="px-4 py-2 text-red-600">Yes</td>
                <td className="px-4 py-2">Price (e.g., 19.99)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">stock</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Stock quantity (default: 0)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">category</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Product category</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">imageUrl</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Main image URL</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">images</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Additional images (comma-separated URLs)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">tags</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Tags (comma-separated)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">isActive</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">true or false (default: true)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">compareAtPrice</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Original price for sale items</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-xs">lowStockThreshold</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Low stock warning level (default: 5)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
