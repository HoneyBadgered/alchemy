'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface BlendDetail {
  id: string;
  name: string | null;
  baseTeaId: string;
  addIns: Array<{ ingredientId: string; quantity: number }>;
  baseTea: {
    id: string;
    name: string;
    category: string;
  };
  addInsWithDetails: Array<{
    ingredientId: string;
    quantity: number;
    ingredient: {
      id: string;
      name: string;
      category: string;
      costPerGram: number | null;
    };
  }>;
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

export default function ConvertBlendPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken } = useAuthStore();
  const blendId = params.id as string;
  
  const [blend, setBlend] = useState<BlendDetail | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Product details
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('Custom Blends');
  const [tags, setTags] = useState('custom,blend');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (blendId) {
      fetchBlendDetails();
    }
  }, [blendId]);

  const fetchBlendDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3000/admin/blends/${blendId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch blend details');

      const data: BlendDetail = await response.json();
      setBlend(data);
      
      // Pre-fill product name
      if (data.name) {
        setProductName(data.name);
      }

      // Calculate cost
      const costResponse = await fetch('http://localhost:3000/admin/blends/calculate-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          baseTeaId: data.baseTeaId,
          addIns: data.addIns,
        }),
      });

      if (costResponse.ok) {
        const costData = await costResponse.json();
        setCostBreakdown(costData);
        setPrice(costData.suggestedPrice.toFixed(2));
      }
    } catch (error) {
      console.error('Error fetching blend details:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3000/admin/blends/${blendId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          blendId,
          price: parseFloat(price),
          name: productName,
          description,
          stock: parseInt(stock),
          category,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          imageUrl: imageUrl || undefined,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to convert blend');
      }

      const data = await response.json();
      router.push(`/admin/products/${data.product.id}`);
    } catch (error) {
      console.error('Error converting blend:', error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!blend) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Convert Blend to Product</h1>
        <p className="text-gray-600 mt-1">
          {blend.name || 'Unnamed Blend'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Blend Composition (Read-Only) */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Blend Composition</h2>
          
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-500 mb-2">Base Tea</div>
            <div className="p-3 bg-white rounded-lg">
              {blend.baseTea.name} ({blend.baseTea.category})
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500 mb-2">Add-Ins</div>
            <div className="space-y-2">
              {blend.addInsWithDetails.map((addIn) => (
                <div
                  key={addIn.ingredientId}
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <span>
                    {addIn.ingredient.name} ({addIn.ingredient.category})
                  </span>
                  <span className="font-medium">{addIn.quantity}g</span>
                </div>
              ))}
            </div>
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
                  Initial Stock
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
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
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Converting...' : 'Convert to Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
