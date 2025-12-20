
'use client';

import { useEffect, useState } from 'react';
import { fetchSiteSettings, updateSiteSetting, SiteSetting } from '../../../lib/settings-api';
import { useAuthStore } from '@/store/authStore';

/**
 * Admin Settings Page
 */




const SECTIONS = [
  { label: 'General', value: 'general' },
  { label: 'Shipping', value: 'shipping' },
  { label: 'Tax', value: 'tax' },
  { label: 'Discounts', value: 'discounts' },
  { label: 'Email', value: 'email' },
  { label: 'Content', value: 'content' },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('general');
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetchSiteSettings(accessToken)
      .then(setSettings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const startEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
    setError(null);
    setSuccess(null);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
    setError(null);
    setSuccess(null);
  };

  const saveEdit = async (key: string) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateSiteSetting(key, editValue, accessToken);
      setSettings((prev) => prev.map((s) => (s.key === key ? updated : s)));
      setSuccess('Setting updated!');
      setEditingKey(null);
      setEditValue('');
    } catch (e: any) {
      setError(e.message || 'Failed to update setting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure site settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b mb-4">
        {SECTIONS.map((section) => (
          <button
            key={section.value}
            className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 ${
              activeSection === section.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-blue-600'
            }`}
            onClick={() => setActiveSection(section.value)}
            disabled={loading}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{SECTIONS.find(s => s.value === activeSection)?.label} Settings</h2>
        {loading && <div className="text-blue-600">Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {settings.filter((setting) => setting.category.toLowerCase() === activeSection).map((setting) => (
                <tr key={setting.key} className="border-b">
                  <td className="px-4 py-2 font-mono text-sm">{setting.key}</td>
                  <td className="px-4 py-2">
                    {editingKey === setting.key ? (
                      <input
                        className="border rounded px-2 py-1 w-full"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        disabled={loading}
                      />
                    ) : (
                      <span>{setting.value}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{setting.description || ''}</td>
                  <td className="px-4 py-2">
                    {editingKey === setting.key ? (
                      <>
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded mr-2"
                          onClick={() => saveEdit(setting.key)}
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          className="bg-gray-300 text-gray-800 px-3 py-1 rounded"
                          onClick={cancelEdit}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                        onClick={() => startEdit(setting.key, setting.value)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
