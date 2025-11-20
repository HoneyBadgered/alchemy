'use client';

/**
 * Admin Themes Management Page
 */

export default function AdminThemesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Themes</h1>
        <p className="text-gray-600 mt-1">Manage visual themes and table skins</p>
      </div>

      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Theme Management</h2>
        <p className="text-gray-600 mb-4">
          Create and manage visual themes for The Alchemist Table
        </p>
        <p className="text-sm text-gray-500">
          Coming soon: Grid display, add/edit forms, and image upload
        </p>
      </div>
    </div>
  );
}
