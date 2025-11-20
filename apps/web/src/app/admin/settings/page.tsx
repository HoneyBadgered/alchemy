'use client';

/**
 * Admin Settings Page
 */

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure site settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">🚚 Shipping Methods</h3>
          <p className="text-sm text-gray-600">Configure shipping options and pricing</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 Tax Rates</h3>
          <p className="text-sm text-gray-600">Manage tax rates by region</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">🎫 Discount Codes</h3>
          <p className="text-sm text-gray-600">Create and manage promotional codes</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📧 Email Templates</h3>
          <p className="text-sm text-gray-600">Customize email communications</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">🌐 Site Content</h3>
          <p className="text-sm text-gray-600">Edit global content and messaging</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">⚙️ General</h3>
          <p className="text-sm text-gray-600">General site configuration</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
        <p className="text-sm">
          💡 Settings management interface coming soon. Backend APIs are ready and waiting.
        </p>
      </div>
    </div>
  );
}
