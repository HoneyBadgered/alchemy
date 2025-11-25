'use client';

/**
 * Admin Ingredients Management Page
 * 
 * Allows admins to configure baseAmount and incrementAmount for tea blend add-ins
 */

import { useEffect, useState } from 'react';

interface Ingredient {
  id: string;
  name: string;
  category: string;
  description?: string;
  tags?: string[];
  badges?: string[];
  emoji?: string;
  isBase?: boolean;
  baseAmount?: number;
  incrementAmount?: number;
}

interface Defaults {
  baseAmount: number;
  incrementAmount: number;
}

export default function AdminIngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [defaults, setDefaults] = useState<Defaults>({ baseAmount: 5, incrementAmount: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ baseAmount: '', incrementAmount: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/admin/ingredients/add-ins', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }

      const data = await response.json();
      setIngredients(data.ingredients || []);
      setDefaults(data.defaults || { baseAmount: 5, incrementAmount: 1 });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient.id);
    setEditForm({
      baseAmount: (ingredient.baseAmount ?? defaults.baseAmount).toString(),
      incrementAmount: (ingredient.incrementAmount ?? ingredient.baseAmount ?? defaults.incrementAmount).toString(),
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ baseAmount: '', incrementAmount: '' });
  };

  const handleSave = async (id: string) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:3000/admin/ingredients/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseAmount: parseFloat(editForm.baseAmount),
          incrementAmount: parseFloat(editForm.incrementAmount),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update ingredient');
      }

      await fetchIngredients();
      setEditingId(null);
      setEditForm({ baseAmount: '', incrementAmount: '' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (id: string) => {
    if (!confirm('Reset this ingredient to default values?')) {
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:3000/admin/ingredients/${id}/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset ingredient');
      }

      await fetchIngredients();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const categories = [...new Set(ingredients.map(i => i.category))].sort();

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = !searchTerm || 
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || ingredient.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading ingredients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ingredients</h1>
        <p className="text-gray-600 mt-1">
          Configure base amounts and increment values for tea blend add-ins
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-sm text-red-600 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-2">💡 About Add-in Configuration</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li><strong>Base Amount:</strong> The starting quantity (in grams) when a customer selects an add-in</li>
          <li><strong>Increment Amount:</strong> How much the slider increases/decreases per step</li>
          <li><strong>Pricing:</strong> Customers pay a base price per add-in, plus extra for each increment above base amount</li>
        </ul>
        <p className="text-sm text-purple-700 mt-2">
          Defaults: {defaults.baseAmount}g base, {defaults.incrementAmount}g increment
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
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
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingredient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Amount (g)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Increment (g)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No ingredients found
                  </td>
                </tr>
              ) : (
                filteredIngredients.map((ingredient) => (
                  <tr key={ingredient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{ingredient.emoji}</span>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {ingredient.name}
                            {ingredient.badges?.map(badge => (
                              <span
                                key={badge}
                                className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                          {ingredient.description && (
                            <div className="text-sm text-gray-500">{ingredient.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded capitalize">
                        {ingredient.category}
                      </span>
                    </td>
                    {editingId === ingredient.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={editForm.baseAmount}
                            onChange={(e) => setEditForm(prev => ({ ...prev, baseAmount: e.target.value }))}
                            min="0.1"
                            step="0.1"
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={editForm.incrementAmount}
                            onChange={(e) => setEditForm(prev => ({ ...prev, incrementAmount: e.target.value }))}
                            min="0.1"
                            step="0.1"
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => handleSave(ingredient.id)}
                            disabled={saving}
                            className="text-green-600 hover:text-green-900 font-medium disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {ingredient.baseAmount ?? defaults.baseAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {ingredient.incrementAmount ?? ingredient.baseAmount ?? defaults.incrementAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => handleEdit(ingredient)}
                            className="text-purple-600 hover:text-purple-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleReset(ingredient.id)}
                            className="text-gray-500 hover:text-gray-700 font-medium"
                          >
                            Reset
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredIngredients.length} of {ingredients.length} add-ins
      </div>
    </div>
  );
}
