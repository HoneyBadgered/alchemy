'use client';

/**
 * Admin Ingredients Management Page
 * 
 * Full ingredient management with filtering, sorting, inventory tracking,
 * and CRUD operations for tea blend ingredients.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

interface Ingredient {
  id: string;
  name: string;
  role: string;
  category: string;
  descriptionShort?: string;
  descriptionLong?: string;
  image?: string;
  flavorNotes?: string[];
  cutOrGrade?: string;
  recommendedUsageMin?: number;
  recommendedUsageMax?: number;
  steepTemperature?: number;
  steepTimeMin?: number;
  steepTimeMax?: number;
  brewNotes?: string;
  supplierId?: string;
  supplier?: { id: string; name: string };
  costPerOunce?: number;
  costPerGram?: number;
  inventoryAmount?: number;
  minimumStockLevel?: number;
  status: string;
  caffeineLevel: string;
  allergens?: string[];
  internalNotes?: string;
  emoji?: string;
  tags?: string[];
  badges?: string[];
  isBase?: boolean;
  baseAmount?: number;
  incrementAmount?: number;
  pairings?: { id: string; name: string; category: string; emoji?: string }[];
  createdAt?: string;
  updatedAt?: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Defaults {
  baseAmount: number;
  incrementAmount: number;
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

type SortField = 'name' | 'category' | 'stock' | 'cost' | 'createdAt' | 'updatedAt';

export default function AdminIngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [defaults, setDefaults] = useState<Defaults>({ baseAmount: 5, incrementAmount: 1 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, perPage: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCaffeine, setFilterCaffeine] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterSupplierId, setFilterSupplierId] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Ingredient>>({});
  
  const { accessToken, hasHydrated } = useAuthStore();

  const fetchIngredients = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        perPage: pagination.perPage.toString(),
        sortBy,
        sortOrder,
      });
      
      if (searchTerm) params.set('search', searchTerm);
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);
      if (filterCaffeine) params.set('caffeineLevel', filterCaffeine);
      if (filterLowStock) params.set('lowStock', 'true');
      if (filterSupplierId) params.set('supplierId', filterSupplierId);
      
      const response = await fetch(`http://localhost:3000/admin/ingredients?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }

      const data = await response.json();
      setIngredients(data.ingredients || []);
      setDefaults(data.defaults || { baseAmount: 5, incrementAmount: 1 });
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, pagination.page, pagination.perPage, searchTerm, filterCategory, filterStatus, filterCaffeine, filterLowStock, filterSupplierId, sortBy, sortOrder]);

  const fetchCategories = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch('http://localhost:3000/admin/ingredients/categories', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch {
      // Silent fail
    }
  }, [accessToken]);

  const fetchSuppliers = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch('http://localhost:3000/admin/ingredients/suppliers', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || []);
      }
    } catch {
      // Silent fail
    }
  }, [accessToken]);

  useEffect(() => {
    if (hasHydrated && accessToken) {
      fetchIngredients();
      fetchCategories();
      fetchSuppliers();
    }
  }, [hasHydrated, accessToken, fetchIngredients, fetchCategories, fetchSuppliers]);

  const handleCreate = async () => {
    if (!formData.name || !formData.category) {
      setError('Name and category are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('http://localhost:3000/admin/ingredients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create ingredient');
      }

      setSuccess('Ingredient created successfully');
      setShowCreateModal(false);
      setFormData({});
      fetchIngredients();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedIngredient) return;

    try {
      setSaving(true);
      const response = await fetch(`http://localhost:3000/admin/ingredients/${selectedIngredient.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update ingredient');
      }

      setSuccess('Ingredient updated successfully');
      setShowEditModal(false);
      setSelectedIngredient(null);
      setFormData({});
      fetchIngredients();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this ingredient? It can be restored later.')) return;

    try {
      const response = await fetch(`http://localhost:3000/admin/ingredients/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!response.ok) throw new Error('Failed to archive ingredient');

      setSuccess('Ingredient archived');
      fetchIngredients();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/admin/ingredients/${id}/unarchive`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!response.ok) throw new Error('Failed to unarchive ingredient');

      setSuccess('Ingredient restored');
      fetchIngredients();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const openEditModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      role: ingredient.role,
      category: ingredient.category,
      descriptionShort: ingredient.descriptionShort,
      descriptionLong: ingredient.descriptionLong,
      image: ingredient.image,
      flavorNotes: ingredient.flavorNotes,
      cutOrGrade: ingredient.cutOrGrade,
      recommendedUsageMin: ingredient.recommendedUsageMin,
      recommendedUsageMax: ingredient.recommendedUsageMax,
      steepTemperature: ingredient.steepTemperature,
      steepTimeMin: ingredient.steepTimeMin,
      steepTimeMax: ingredient.steepTimeMax,
      brewNotes: ingredient.brewNotes,
      supplierId: ingredient.supplierId,
      costPerOunce: ingredient.costPerOunce,
      inventoryAmount: ingredient.inventoryAmount,
      minimumStockLevel: ingredient.minimumStockLevel,
      status: ingredient.status,
      caffeineLevel: ingredient.caffeineLevel,
      allergens: ingredient.allergens,
      internalNotes: ingredient.internalNotes,
      emoji: ingredient.emoji,
      tags: ingredient.tags,
      badges: ingredient.badges,
      isBase: ingredient.isBase,
      baseAmount: ingredient.baseAmount,
      incrementAmount: ingredient.incrementAmount,
    });
    setShowEditModal(true);
  };

  const openDetailModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setShowDetailModal(true);
  };

  const getStatusBadge = (ingredient: Ingredient) => {
    const badges = [];
    
    if (ingredient.status === 'archived') {
      badges.push(<span key="archived" className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">Archived</span>);
    } else if (ingredient.status === 'outOfStock' || (ingredient.inventoryAmount !== undefined && ingredient.inventoryAmount <= 0)) {
      badges.push(<span key="oos" className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">Out of Stock</span>);
    } else if (ingredient.inventoryAmount !== undefined && ingredient.minimumStockLevel !== undefined && ingredient.inventoryAmount <= ingredient.minimumStockLevel) {
      badges.push(<span key="low" className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">Low Stock</span>);
    }
    
    return badges;
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterCaffeine('');
    setFilterLowStock(false);
    setFilterSupplierId('');
    setSortBy('name');
    setSortOrder('asc');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && ingredients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading ingredients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ingredients Management</h1>
          <p className="text-gray-600 mt-1">
            Manage ingredient data, inventory, and configurations
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ status: 'active', caffeineLevel: 'none', role: 'addIn' });
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Ingredient
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">✕</button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <p>{success}</p>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caffeine Level</label>
            <select
              value={filterCaffeine}
              onChange={(e) => setFilterCaffeine(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Any</option>
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Show only low stock</span>
          </label>
          {suppliers.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Supplier:</label>
              <select
                value={filterSupplierId}
                onChange={(e) => setFilterSupplierId(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Ingredient {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}
                >
                  Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('stock')}
                >
                  Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('cost')}
                >
                  Cost/oz {sortBy === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage Range
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ingredients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No ingredients found. <button onClick={() => setShowCreateModal(true)} className="text-purple-600 hover:underline">Create one</button>
                  </td>
                </tr>
              ) : (
                ingredients.map((ingredient) => (
                  <tr key={ingredient.id} className={`hover:bg-gray-50 ${ingredient.status === 'archived' ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{ingredient.emoji || '🌿'}</span>
                        <div>
                          <button 
                            onClick={() => openDetailModal(ingredient)}
                            className="font-medium text-gray-900 hover:text-purple-600 flex items-center gap-2"
                          >
                            {ingredient.name}
                            {ingredient.badges?.map(badge => (
                              <span key={badge} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                {badge}
                              </span>
                            ))}
                          </button>
                          {ingredient.descriptionShort && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{ingredient.descriptionShort}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded capitalize">
                        {ingredient.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {getStatusBadge(ingredient)}
                        {getStatusBadge(ingredient).length === 0 && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {ingredient.inventoryAmount !== undefined ? (
                        <span className={ingredient.inventoryAmount <= (ingredient.minimumStockLevel || 0) ? 'text-red-600 font-medium' : ''}>
                          {ingredient.inventoryAmount}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {ingredient.costPerOunce !== undefined ? `$${Number(ingredient.costPerOunce).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {ingredient.recommendedUsageMin !== undefined && ingredient.recommendedUsageMax !== undefined
                        ? `${ingredient.recommendedUsageMin}% - ${ingredient.recommendedUsageMax}%`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => openEditModal(ingredient)}
                        className="text-purple-600 hover:text-purple-900 font-medium"
                      >
                        Edit
                      </button>
                      {ingredient.status === 'archived' ? (
                        <button
                          onClick={() => handleUnarchive(ingredient.id)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(ingredient.id)}
                          className="text-gray-500 hover:text-gray-700 font-medium"
                        >
                          Archive
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.perPage) + 1} to {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} ingredients
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <IngredientModal
          title="Create New Ingredient"
          formData={formData}
          setFormData={setFormData}
          onSave={handleCreate}
          onCancel={() => { setShowCreateModal(false); setFormData({}); }}
          saving={saving}
          categories={categories}
          suppliers={suppliers}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedIngredient && (
        <IngredientModal
          title={`Edit ${selectedIngredient.name}`}
          formData={formData}
          setFormData={setFormData}
          onSave={handleUpdate}
          onCancel={() => { setShowEditModal(false); setSelectedIngredient(null); setFormData({}); }}
          saving={saving}
          categories={categories}
          suppliers={suppliers}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedIngredient && (
        <IngredientDetailModal
          ingredient={selectedIngredient}
          onClose={() => { setShowDetailModal(false); setSelectedIngredient(null); }}
          onEdit={() => { setShowDetailModal(false); openEditModal(selectedIngredient); }}
        />
      )}
    </div>
  );
}

// Ingredient Form Modal Component
function IngredientModal({
  title,
  formData,
  setFormData,
  onSave,
  onCancel,
  saving,
  categories,
  suppliers,
}: {
  title: string;
  formData: Partial<Ingredient>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Ingredient>>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  categories: string[];
  suppliers: Supplier[];
}) {
  const [activeTab, setActiveTab] = useState<'general' | 'flavor' | 'brewing' | 'inventory' | 'safety'>('general');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b px-6">
          {(['general', 'flavor', 'brewing', 'inventory', 'safety'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize ${activeTab === tab ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role || 'addIn'}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="base">Base</option>
                    <option value="addIn">Add-In</option>
                    <option value="either">Either</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                  <input
                    type="text"
                    value={formData.emoji || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    maxLength={4}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <input
                  type="text"
                  value={formData.descriptionShort || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionShort: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
                <textarea
                  value={formData.descriptionLong || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, descriptionLong: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
          
          {activeTab === 'flavor' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flavor Notes (comma separated)</label>
                <input
                  type="text"
                  value={(formData.flavorNotes || []).join(', ')}
                  onChange={(e) => setFormData(prev => ({ ...prev, flavorNotes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="floral, sweet, citrus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cut or Grade</label>
                <select
                  value={formData.cutOrGrade || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cutOrGrade: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select...</option>
                  <option value="whole leaf">Whole Leaf</option>
                  <option value="pieces">Pieces</option>
                  <option value="powder">Powder</option>
                  <option value="crystals">Crystals</option>
                  <option value="cut and sift">Cut and Sift</option>
                  <option value="ground">Ground</option>
                  <option value="whole">Whole</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Usage Min (%)</label>
                  <input
                    type="number"
                    value={formData.recommendedUsageMin ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, recommendedUsageMin: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Usage Max (%)</label>
                  <input
                    type="number"
                    value={formData.recommendedUsageMax ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, recommendedUsageMax: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Amount (g)</label>
                  <input
                    type="number"
                    value={formData.baseAmount ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0.1"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Increment Amount (g)</label>
                  <input
                    type="number"
                    value={formData.incrementAmount ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, incrementAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0.1"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'brewing' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Steep Temperature (°F)</label>
                <input
                  type="number"
                  value={formData.steepTemperature ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, steepTemperature: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  min="100"
                  max="212"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Steep Time Min (seconds)</label>
                  <input
                    type="number"
                    value={formData.steepTimeMin ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, steepTimeMin: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Steep Time Max (seconds)</label>
                  <input
                    type="number"
                    value={formData.steepTimeMax ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, steepTimeMax: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brew Notes</label>
                <textarea
                  value={formData.brewNotes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, brewNotes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="outOfStock">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select
                    value={formData.supplierId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value || undefined }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">No supplier</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Ounce ($)</label>
                  <input
                    type="number"
                    value={formData.costPerOunce ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, costPerOunce: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="0.01"
                  />
                  {formData.costPerOunce && (
                    <p className="text-sm text-gray-500 mt-1">
                      ≈ ${(formData.costPerOunce / 28.3495).toFixed(4)}/gram
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Amount</label>
                  <input
                    type="number"
                    value={formData.inventoryAmount ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, inventoryAmount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
                <input
                  type="number"
                  value={formData.minimumStockLevel ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumStockLevel: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  min="0"
                  step="0.01"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Low stock warning will show when inventory is at or below this level
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caffeine Level</label>
                <select
                  value={formData.caffeineLevel || 'none'}
                  onChange={(e) => setFormData(prev => ({ ...prev, caffeineLevel: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergens (comma separated)</label>
                <input
                  type="text"
                  value={(formData.allergens || []).join(', ')}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergens: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="nuts, dairy, gluten"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                <textarea
                  value={formData.internalNotes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={4}
                  placeholder="Notes visible only to admins..."
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Ingredient Detail Modal Component
function IngredientDetailModal({
  ingredient,
  onClose,
  onEdit,
}: {
  ingredient: Ingredient;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{ingredient.emoji || '🌿'}</span>
            <div>
              <h2 className="text-xl font-semibold">{ingredient.name}</h2>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded capitalize">{ingredient.category}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* General Info */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">General Info</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="capitalize">{ingredient.role}</span>
              </div>
              {ingredient.descriptionShort && (
                <div>
                  <span className="text-gray-600">Description:</span>
                  <p className="mt-1">{ingredient.descriptionShort}</p>
                </div>
              )}
              {ingredient.descriptionLong && (
                <p className="text-sm text-gray-600 mt-2">{ingredient.descriptionLong}</p>
              )}
            </div>
          </section>

          {/* Flavor & Use */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Flavor & Use</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {ingredient.flavorNotes && ingredient.flavorNotes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ingredient.flavorNotes.map((note, i) => (
                    <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">{note}</span>
                  ))}
                </div>
              )}
              {ingredient.cutOrGrade && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cut/Grade:</span>
                  <span className="capitalize">{ingredient.cutOrGrade}</span>
                </div>
              )}
              {ingredient.recommendedUsageMin !== undefined && ingredient.recommendedUsageMax !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Recommended Usage:</span>
                  <span>{ingredient.recommendedUsageMin}% - {ingredient.recommendedUsageMax}%</span>
                </div>
              )}
              {ingredient.pairings && ingredient.pairings.length > 0 && (
                <div>
                  <span className="text-gray-600">Pairs well with:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ingredient.pairings.map((p) => (
                      <span key={p.id} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {p.emoji} {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Brewing */}
          {(ingredient.steepTemperature || ingredient.steepTimeMin || ingredient.brewNotes) && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-2">Brewing Profile</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {ingredient.steepTemperature && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temperature:</span>
                    <span>{ingredient.steepTemperature}°F</span>
                  </div>
                )}
                {(ingredient.steepTimeMin || ingredient.steepTimeMax) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Steep Time:</span>
                    <span>
                      {ingredient.steepTimeMin ? `${Math.floor(ingredient.steepTimeMin / 60)}:${(ingredient.steepTimeMin % 60).toString().padStart(2, '0')}` : ''}
                      {ingredient.steepTimeMax ? ` - ${Math.floor(ingredient.steepTimeMax / 60)}:${(ingredient.steepTimeMax % 60).toString().padStart(2, '0')}` : ''}
                    </span>
                  </div>
                )}
                {ingredient.brewNotes && <p className="text-sm text-gray-600">{ingredient.brewNotes}</p>}
              </div>
            </section>
          )}

          {/* Inventory */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Inventory</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-sm ${
                  ingredient.status === 'active' ? 'bg-green-100 text-green-800' :
                  ingredient.status === 'archived' ? 'bg-gray-200 text-gray-700' :
                  'bg-red-100 text-red-800'
                }`}>{ingredient.status}</span>
              </div>
              {ingredient.inventoryAmount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">In Stock:</span>
                  <span className={ingredient.inventoryAmount <= (ingredient.minimumStockLevel || 0) ? 'text-red-600 font-medium' : ''}>
                    {ingredient.inventoryAmount}
                  </span>
                </div>
              )}
              {ingredient.minimumStockLevel !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Min Stock Level:</span>
                  <span>{ingredient.minimumStockLevel}</span>
                </div>
              )}
              {ingredient.costPerOunce !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span>${Number(ingredient.costPerOunce).toFixed(2)}/oz (${Number(ingredient.costPerGram || 0).toFixed(4)}/g)</span>
                </div>
              )}
              {ingredient.supplier && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier:</span>
                  <span>{ingredient.supplier.name}</span>
                </div>
              )}
            </div>
          </section>

          {/* Safety */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Safety</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Caffeine Level:</span>
                <span className="capitalize">{ingredient.caffeineLevel}</span>
              </div>
              {ingredient.allergens && ingredient.allergens.length > 0 && (
                <div>
                  <span className="text-gray-600">Allergens:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ingredient.allergens.map((a, i) => (
                      <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Internal Notes */}
          {ingredient.internalNotes && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-2">Internal Notes</h3>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{ingredient.internalNotes}</p>
              </div>
            </section>
          )}
        </div>
        
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
