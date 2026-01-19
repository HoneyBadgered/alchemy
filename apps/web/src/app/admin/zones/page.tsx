'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface Zone {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  theme: string;
  gradient: string;
  bgGradient: string;
  accentColor: string;
  heroImageUrl: string | null;
  buttonImageUrl: string | null;
  defaultFilters: {
    flavorProfile: string[];
    caffeineLevel: string[];
  };
  subTabs: Array<{
    id: string;
    label: string;
    bias: string[] | null;
  }>;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminZonesPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    theme: '',
    gradient: '',
    bgGradient: '',
    accentColor: '',
    heroImageUrl: '',
    buttonImageUrl: '',
    defaultFilters: { flavorProfile: [], caffeineLevel: [] },
    subTabs: [{ id: 'all', label: 'All', bias: null }],
    sortOrder: 0,
    isActive: true,
  });

  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [buttonImageFile, setButtonImageFile] = useState<File | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingButton, setUploadingButton] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await fetch('http://localhost:3000/zones', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setZones(data.zones.sort((a: Zone, b: Zone) => a.sortOrder - b.sortOrder));
      }
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadHeroImage = async () => {
    if (!heroImageFile) return;
    
    setUploadingHero(true);
    const formData = new FormData();
    formData.append('file', heroImageFile);

    try {
      const response = await fetch('http://localhost:3000/upload/zone-hero-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, heroImageUrl: data.url }));
        setHeroImageFile(null);
      }
    } catch (error) {
      console.error('Failed to upload hero image:', error);
    } finally {
      setUploadingHero(false);
    }
  };

  const handleUploadButtonImage = async () => {
    if (!buttonImageFile) return;
    
    setUploadingButton(true);
    const formData = new FormData();
    formData.append('file', buttonImageFile);

    try {
      const response = await fetch('http://localhost:3000/upload/zone-button-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, buttonImageUrl: data.url }));
        setButtonImageFile(null);
      }
    } catch (error) {
      console.error('Failed to upload button image:', error);
    } finally {
      setUploadingButton(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingZone
      ? `http://localhost:3000/admin/zones/${editingZone.id}`
      : 'http://localhost:3000/admin/zones';
    const method = editingZone ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchZones();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Failed to save zone:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this zone?')) return;

    try {
      const response = await fetch(`http://localhost:3000/admin/zones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        await fetchZones();
      }
    } catch (error) {
      console.error('Failed to delete zone:', error);
    }
  };

  const handleReorder = async (zoneId: string, direction: 'up' | 'down') => {
    const currentIndex = zones.findIndex(z => z.id === zoneId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === zones.length - 1)
    ) {
      return;
    }

    const newZones = [...zones];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newZones[currentIndex], newZones[targetIndex]] = [newZones[targetIndex], newZones[currentIndex]];

    try {
      const response = await fetch('http://localhost:3000/admin/zones/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ zoneIds: newZones.map(z => z.id) }),
      });

      if (response.ok) {
        await fetchZones();
      }
    } catch (error) {
      console.error('Failed to reorder zones:', error);
    }
  };

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      slug: zone.slug,
      tagline: zone.tagline,
      theme: zone.theme,
      gradient: zone.gradient,
      bgGradient: zone.bgGradient,
      accentColor: zone.accentColor,
      heroImageUrl: zone.heroImageUrl || '',
      buttonImageUrl: zone.buttonImageUrl || '',
      defaultFilters: zone.defaultFilters,
      subTabs: zone.subTabs,
      sortOrder: zone.sortOrder,
      isActive: zone.isActive,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingZone(null);
    setFormData({
      name: '',
      slug: '',
      tagline: '',
      theme: '',
      gradient: '',
      bgGradient: '',
      accentColor: '',
      heroImageUrl: '',
      buttonImageUrl: '',
      defaultFilters: { flavorProfile: [], caffeineLevel: [] },
      subTabs: [{ id: 'all', label: 'All', bias: null }],
      sortOrder: zones.length,
      isActive: true,
    });
    setHeroImageFile(null);
    setButtonImageFile(null);
  };

  if (loading) {
    return <div className="p-8">Loading zones...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin')}
              className="text-purple-600 hover:text-purple-700 font-medium mb-2"
            >
              ← Back to Admin
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Zone Management</h1>
            <p className="text-gray-600 mt-2">Manage shop zones, images, and configurations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkImport(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Bulk Import
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              + Create Zone
            </button>
          </div>
        </div>

        {/* Zones List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Images
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {zones.map((zone, index) => (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleReorder(zone.id, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleReorder(zone.id, 'down')}
                        disabled={index === zones.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{zone.name}</div>
                      <div className="text-sm text-gray-500">{zone.tagline}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{zone.slug}</code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 text-xs">
                      <span className={zone.heroImageUrl ? 'text-green-600' : 'text-gray-400'}>
                        Hero: {zone.heroImageUrl ? '✓' : '✗'}
                      </span>
                      <span className={zone.buttonImageUrl ? 'text-green-600' : 'text-gray-400'}>
                        Button: {zone.buttonImageUrl ? '✓' : '✗'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        zone.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(zone)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingZone ? 'Edit Zone' : 'Create New Zone'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zone Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug * (URL-safe)
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingZone}
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                      placeholder="e-g-hearthhouse"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagline *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Styling */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gradient Classes *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.gradient}
                      onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="from-blue-500 to-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      BG Gradient Classes *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.bgGradient}
                      onChange={(e) => setFormData({ ...formData, bgGradient: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="from-blue-950 to-purple-950"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accent Color *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="cyan"
                    />
                  </div>
                </div>

                {/* Image Uploads */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hero Image (Page Background)
                    </label>
                    {formData.heroImageUrl && (
                      <img src={formData.heroImageUrl} alt="Hero" className="w-full h-32 object-cover rounded mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setHeroImageFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {heroImageFile && (
                      <button
                        type="button"
                        onClick={handleUploadHeroImage}
                        disabled={uploadingHero}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {uploadingHero ? 'Uploading...' : 'Upload Hero Image'}
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Image (Zone Selector)
                    </label>
                    {formData.buttonImageUrl && (
                      <img src={formData.buttonImageUrl} alt="Button" className="w-full h-32 object-cover rounded mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setButtonImageFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {buttonImageFile && (
                      <button
                        type="button"
                        onClick={handleUploadButtonImage}
                        disabled={uploadingButton}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {uploadingButton ? 'Uploading...' : 'Upload Button Image'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Zone is Active
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {editingZone ? 'Update Zone' : 'Create Zone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showBulkImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Bulk Import Zones</h2>
              <p className="text-gray-600 mb-4">
                Feature coming soon! Use the CSV/JSON import similar to ingredients.
              </p>
              <button
                onClick={() => setShowBulkImport(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
