'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import ImageUpload from '@/components/admin/ImageUpload';

interface Ingredient {
  id: string;
  name: string;
  role: string;
  category: string;
  costPerGram: number | null;
  inventoryAmount: number;
}

interface BlendIngredient {
  ingredientId: string;
  quantity: number;
}

interface CostBreakdown {
  totalCost: number;
  suggestedPrice: number;
  breakdown: Array<{
    ingredientId: string;
    name: string;
    quantity: number;
    costPerGram: number | null;
    cost: number;
  }>;
}

interface BlendDetail {
  id: string;
  name: string | null;
  baseTeaId: string;
  addIns: Array<{ ingredientId: string; quantity: number }>;
  productId: string | null;
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string | null;
    tags: string[];
    imageUrl: string | null;
    zones: string[];
    isActive: boolean;
  } | null;
}

export default function EditBlendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blend, setBlend] = useState<BlendDetail | null>(null);
  const [baseTeas, setBaseTeas] = useState<Ingredient[]>([]);
  const [addIns, setAddIns] = useState<Ingredient[]>([]);
  const [selectedBaseTea, setSelectedBaseTea] = useState('');
  const [selectedAddIns, setSelectedAddIns] = useState<BlendIngredient[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  
  // Product details
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('Custom Blends');
  const [tags, setTags] = useState('custom,blend');
  const [imageUrl, setImageUrl] = useState('');
  const [zones, setZones] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (accessToken && id) {
      fetchBlend();
      fetchIngredients();
    }
  }, [accessToken, id]);

  const fetchBlend = async () => {
    try {
      const response = await fetch(`http://localhost:3000/admin/blends/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch blend');

      const data: BlendDetail = await response.json();
      setBlend(data);
      
      // Populate form with blend data
      setSelectedBaseTea(data.baseTeaId);
      setSelectedAddIns(data.addIns);
      
      // If product exists, populate product fields
      if (data.products) {
        setProductName(data.products.name);
        setDescription(data.products.description);
        setPrice(data.products.price.toString());
        setStock(data.products.stock.toString());
        setCategory(data.products.category || 'Custom Blends');
        setTags((data.products.tags || []).join(','));
        setImageUrl(data.products.imageUrl || '');
        setZones(data.products.zones || []);
        setIsActive(data.products.isActive);
      } else if (data.name) {
        setProductName(data.name);
      }
    } catch (error) {
      console.error('Error fetching blend:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/ingredients?perPage=100', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }
      
      const data = await response.json();
      const bases = data.ingredients.filter((i: Ingredient) => i.role === 'base');
      const adds = data.ingredients.filter((i: Ingredient) => i.role === 'addIn');
      
      setBaseTeas(bases);
      setAddIns(adds);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const calculateCost = async () => {
    if (!selectedBaseTea || selectedAddIns.length === 0) {
      setCostBreakdown(null);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/admin/blends/calculate-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          baseTeaId: selectedBaseTea,
          addIns: selectedAddIns,
        }),
      });

      if (!response.ok) throw new Error('Failed to calculate cost');
      
      const data = await response.json();
      setCostBreakdown(data);
    } catch (error) {
      console.error('Error calculating cost:', error);
    }
  };

  useEffect(() => {
    if (selectedBaseTea && selectedAddIns.length > 0) {
      calculateCost();
    }
  }, [selectedBaseTea, selectedAddIns]);

  const addIngredient = (ingredientId: string) => {
    if (!selectedAddIns.find(a => a.ingredientId === ingredientId)) {
      setSelectedAddIns([...selectedAddIns, { ingredientId, quantity: 1 }]);
    }
  };

  const removeIngredient = (ingredientId: string) => {
    setSelectedAddIns(selectedAddIns.filter(a => a.ingredientId !== ingredientId));
  };

  const updateQuantity = (ingredientId: string, quantity: number) => {
    setSelectedAddIns(
      selectedAddIns.map(a =>
        a.ingredientId === ingredientId ? { ...a, quantity } : a
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!blend?.productId) {
        alert('This blend has not been converted to a product yet.');
        return;
      }

      // Update the product
      const productResponse = await fetch(`http://localhost:3000/admin/products/${blend.productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: productName,
          description,
          price: parseFloat(price),
          stock: parseInt(stock),
          category,
          zones: zones.length > 0 ? zones : undefined,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          imageUrl: imageUrl || undefined,
          isActive: isActive,
        }),
      });

      if (!productResponse.ok) {
        const error = await productResponse.json();
        throw new Error(error.message || 'Failed to update product');
      }

      // Update the blend composition
      const blendResponse = await fetch(`http://localhost:3000/admin/blends/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          baseTeaId: selectedBaseTea,
          addIns: selectedAddIns,
          name: productName,
        }),
      });

      if (!blendResponse.ok) {
        const error = await blendResponse.json();
        throw new Error(error.message || 'Failed to update blend');
      }

      // Redirect to the products list page
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating blend:', error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const getIngredientName = (id: string) => {
    const ingredient = [...baseTeas, ...addIns].find(i => i.id === id);
    return ingredient?.name || 'Unknown';
  };

  if (loading) {
    return <div className="p-6">Loading blend...</div>;
  }

  if (!blend) {
    return <div className="p-6">Blend not found</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Blend Product</h1>
        <p className="text-gray-600 mt-1">
          Update blend composition and product details
        </p>
      </div>

      {!blend.productId && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            This blend hasn't been converted to a product yet. Please convert it first from the blend list.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Blend Composition */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Blend Composition</h2>
          
          {/* Base Tea Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Tea *
            </label>
            <select
              value={selectedBaseTea}
              onChange={(e) => setSelectedBaseTea(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a base tea...</option>
              {baseTeas.map((tea) => (
                <option key={tea.id} value={tea.id}>
                  {tea.name} ({tea.category}) - {tea.inventoryAmount}g available
                </option>
              ))}
            </select>
          </div>

          {/* Add-Ins Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add-Ins *
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addIngredient(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Add an ingredient...</option>
              {addIns
                .filter(a => !selectedAddIns.find(s => s.ingredientId === a.id))
                .map((addIn) => (
                  <option key={addIn.id} value={addIn.id}>
                    {addIn.name} ({addIn.category}) - {addIn.inventoryAmount}g available
                  </option>
                ))}
            </select>

            {/* Selected Add-Ins */}
            {selectedAddIns.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedAddIns.map((addIn) => (
                  <div
                    key={addIn.ingredientId}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{getIngredientName(addIn.ingredientId)}</span>
                    </div>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={addIn.quantity}
                      onChange={(e) =>
                        updateQuantity(addIn.ingredientId, parseFloat(e.target.value))
                      }
                      className="w-20 px-2 py-1 border rounded"
                    />
                    <span className="text-sm text-gray-500">grams</span>
                    <button
                      type="button"
                      onClick={() => removeIngredient(addIn.ingredientId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        {costBreakdown && (
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Cost Analysis</h2>
            <div className="space-y-2 mb-4">
              {costBreakdown.breakdown.map((item) => (
                <div key={item.ingredientId} className="flex justify-between text-sm">
                  <span>
                    {item.name} ({item.quantity}g)
                  </span>
                  <span>${item.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Total Cost:</span>
                <span>${costBreakdown.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Suggested Price (3x markup):</span>
                <span>${costBreakdown.suggestedPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Product Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Lavender Dreams Blend"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the blend..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Image
              </label>
              <ImageUpload
                onUploadComplete={(url) => setImageUrl(url)}
                onError={(error) => console.error('Image upload error:', error)}
                currentImage={imageUrl}
                accessToken={accessToken || ''}
                type="product"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zones (select all that apply)
              </label>
              <div className="space-y-2">
                {[
                  { value: 'The Hearthhouse', label: 'The Hearthhouse - dark and smoky' },
                  { value: 'The Conservatory', label: 'The Conservatory - light, floral, restorative' },
                  { value: 'The East Pavilion', label: 'The East Pavilion - mornings, greens, clarity' },
                  { value: 'The Observatory', label: 'The Observatory - night, quiet, contemplation' },
                  { value: 'The Liminal Tent', label: 'The Liminal Tent - seasonal and limited finds' },
                ].map((zoneOption) => (
                  <label key={zoneOption.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={zones.includes(zoneOption.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setZones([...zones, zoneOption.value]);
                        } else {
                          setZones(zones.filter(z => z !== zoneOption.value));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{zoneOption.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="custom, blend, relaxing"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active (uncheck to save as draft)
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !selectedBaseTea || selectedAddIns.length === 0 || !blend.productId}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Update Blend & Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
