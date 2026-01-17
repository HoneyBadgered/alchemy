/**
 * Blend Detail Page
 * Shows details of a custom blend from the cart with descriptive sliders
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { IngredientSlider } from '@/components/blending/IngredientSlider';
import { gramsToSlider } from '@/components/blending/sliderUtils';

interface BlendDetails {
  cartItemId: string;
  blendId: string;
  productId: string;
  variantId: string | null;
  name: string;
  size: number;
  quantity: number;
  price: string | number;
  baseTea: {
    id: string;
    name: string;
    category: string;
    quantity: number;
  };
  addIns: Array<{
    ingredientId: string;
    quantity: number;
    name: string;
    category: string;
  }>;
  recipe: {
    totalGrams: number;
    baseTeaQuantity: number;
    addInsTotal: number;
  };
  createdAt: string;
}

export default function BlendDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { updateCartItem, removeFromCart } = useCart();
  const [blend, setBlend] = useState<BlendDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const cartItemId = params.id as string;

  useEffect(() => {
    async function fetchBlendDetails() {
      try {
        const sessionId = localStorage.getItem('sessionId');
        const response = await fetch(`/api/cart/blends/${cartItemId}`, {
          headers: {
            'x-session-id': sessionId || '',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load blend details');
        }

        const data = await response.json();
        setBlend(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blend');
      } finally {
        setLoading(false);
      }
    }

    fetchBlendDetails();
  }, [cartItemId]);

  const handleQuantityChange = async (newQuantity: number) => {
    if (!blend || newQuantity < 1) return;

    setUpdating(true);
    try {
      await updateCartItem(blend.productId, newQuantity);
      setBlend({ ...blend, quantity: newQuantity });
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!blend) return;

    setUpdating(true);
    try {
      await removeFromCart(blend.productId);
      router.push('/cart');
    } catch (err) {
      console.error('Failed to remove from cart:', err);
      setUpdating(false);
    }
  };

  const handleEdit = () => {
    router.push(`/table?editBlend=${cartItemId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-lg">Loading blend details...</div>
      </div>
    );
  }

  if (error || !blend) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
        <div className="text-red-600 mb-4">{error || 'Blend not found'}</div>
        <button
          onClick={() => router.push('/cart')}
          className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
        >
          Back to Cart
        </button>
      </div>
    );
  }

  const totalPrice = Number(blend.price) * blend.quantity;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/cart')}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2"
          >
            ← Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{blend.name}</h1>
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span>{blend.size}oz ({blend.recipe.totalGrams}g)</span>
            <span>•</span>
            <span>${Number(blend.price).toFixed(2)} each</span>
          </div>
        </div>

        {/* Recipe Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Blend</h2>
          
          {/* Base Tea */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <div>
                <div className="font-medium text-gray-900">{blend.baseTea.name}</div>
                <div className="text-sm text-gray-500 capitalize">{blend.baseTea.category} · Base Tea</div>
              </div>
            </div>
          </div>

          {/* Add-ins with Sliders */}
          {blend.addIns.length > 0 && (
            <div className="space-y-6">
              <div className="text-sm font-medium text-gray-700 mb-3">Blended With</div>
              {blend.addIns.map((addIn) => {
                // Convert grams to slider position for display
                const sliderValue = gramsToSlider(
                  addIn.quantity,
                  { 
                    id: addIn.ingredientId,
                    name: addIn.name,
                    category: addIn.category as any,
                  },
                  blend.size
                );
                
                return (
                  <div key={addIn.ingredientId} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                      <div>
                        <div className="text-gray-900">{addIn.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{addIn.category}</div>
                      </div>
                    </div>
                    <IngredientSlider
                      value={sliderValue}
                      onChange={() => {}} // Read-only on detail page
                      category={addIn.category}
                      name={addIn.name}
                      disabled={true}
                      showHelper={false}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            {blend.size}oz blend · Made fresh to order
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Quantity</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleQuantityChange(blend.quantity - 1)}
                disabled={blend.quantity <= 1 || updating}
                className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl font-semibold"
              >
                −
              </button>
              <span className="text-2xl font-semibold text-gray-900 w-12 text-center">
                {blend.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(blend.quantity + 1)}
                disabled={updating}
                className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl font-semibold"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold text-purple-600">
                ${totalPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleEdit}
            disabled={updating}
            className="w-full py-4 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ✨ Edit Blend
          </button>
          <button
            onClick={handleRemove}
            disabled={updating}
            className="w-full py-4 bg-white text-red-600 border-2 border-red-600 rounded-full font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Remove from Cart
          </button>
        </div>
      </div>
    </div>
  );
}
