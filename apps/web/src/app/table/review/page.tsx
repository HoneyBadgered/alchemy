'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { getBlendingIngredientById } from '@/components/blending/mockData';
import type { ExtendedBlendState } from '@/components/blending/types';
import { useBlendPricing } from '@/components/blending/useBlendPricing';
import BottomNavigation from '@/components/BottomNavigation';

// Default empty blend state for pricing calculation
const EMPTY_BLEND_STATE: ExtendedBlendState = {
  baseTeaId: undefined,
  addIns: [],
  blendName: '',
  size: 2,
};

export default function BlendReviewPage() {
  const router = useRouter();
  const { addBlendToCart, isLoading } = useCart();
  const [blendState, setBlendState] = useState<ExtendedBlendState | null>(null);
  const [blendName, setBlendName] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse blend state from sessionStorage
  useEffect(() => {
    const storedBlend = sessionStorage.getItem('pendingBlend');
    if (storedBlend) {
      try {
        const parsed = JSON.parse(storedBlend);
        setBlendState(parsed);
        setBlendName(parsed.blendName || '');
      } catch (e) {
        console.error('Failed to parse blend state:', e);
        setError('Invalid blend data. Please try creating your blend again.');
      }
    } else {
      setError('No blend found. Please create a blend first.');
    }
  }, []);

  const pricing = useBlendPricing(blendState || EMPTY_BLEND_STATE);

  const baseTea = blendState?.baseTeaId ? getBlendingIngredientById(blendState.baseTeaId) : null;

  const handleAddToCart = async () => {
    if (!blendState?.baseTeaId) {
      setError('No base tea selected');
      return;
    }

    if (!blendName.trim()) {
      setError('Please name your blend');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      // baseTeaId is guaranteed to be defined after the guard above
      await addBlendToCart(blendState.baseTeaId, blendState.addIns, blendName);
      // Clear the pending blend from storage
      sessionStorage.removeItem('pendingBlend');
      // Navigate to cart
      router.push('/cart');
    } catch (e) {
      console.error('Failed to add blend to cart:', e);
      setError('Failed to add blend to cart. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditBlend = () => {
    // Update blend state in storage with the current blend name before going back
    if (blendState) {
      const updatedBlend = { ...blendState, blendName };
      sessionStorage.setItem('pendingBlend', JSON.stringify(updatedBlend));
    }
    router.push('/table');
  };

  if (error && !blendState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 pb-20">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
            <button
              onClick={() => router.push('/table')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Create a Blend
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!blendState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-purple-900 text-lg">Loading blend...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-pink-100 to-orange-100 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur shadow-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleEditBlend}
              className="text-purple-600 hover:text-purple-800"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-purple-900">Review Your Blend</h1>
              <p className="text-sm text-gray-600">Confirm your creation before adding to cart</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Blend Name Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center space-y-3">
              <input
                type="text"
                value={blendName}
                onChange={(e) => setBlendName(e.target.value)}
                placeholder="Name your blend…"
                className="w-full text-3xl font-bold text-purple-900 text-center bg-transparent border-b-2 border-purple-200 focus:border-purple-400 outline-none pb-2 placeholder-purple-300"
                maxLength={50}
              />
              <p className="text-gray-500">{blendState.size} oz blend</p>
            </div>
          </div>

          {/* Base Tea */}
          {baseTea && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Base Tea</h3>
              <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4">
                <span className="text-4xl">{baseTea.emoji}</span>
                <div>
                  <div className="text-lg font-bold text-emerald-900">{baseTea.name}</div>
                  <div className="text-sm text-emerald-700">{baseTea.description}</div>
                </div>
              </div>
            </div>
          )}

          {/* Add-ins */}
          {blendState.addIns.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Ingredients ({blendState.addIns.length})
              </h3>
              <div className="space-y-3">
                {blendState.addIns.map((addIn) => {
                  const ingredient = getBlendingIngredientById(addIn.ingredientId);
                  if (!ingredient) return null;
                  return (
                    <div
                      key={addIn.ingredientId}
                      className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                    >
                      <span className="text-2xl">{ingredient.emoji}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{ingredient.name}</div>
                        <div className="text-xs text-gray-500">{ingredient.description}</div>
                      </div>
                      <div className="text-sm font-semibold text-purple-600">
                        {addIn.quantity.toFixed(2)} oz
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-semibold uppercase mb-3 text-white/80">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-white/80">
                <span>Blend Size</span>
                <span>{blendState.size} oz</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Ingredients</span>
                <span>{blendState.addIns.length} add-ins</span>
              </div>
              <div className="border-t border-white/20 my-3"></div>
              <div className="flex justify-between text-xl font-bold">
                <span>Estimated Total</span>
                <span>${pricing.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || isLoading}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-900 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isAdding ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding to Cart...
                </span>
              ) : (
                '✨ Add to Cart'
              )}
            </button>

            <button
              onClick={handleEditBlend}
              className="w-full bg-white hover:bg-gray-50 text-purple-600 py-4 rounded-xl font-semibold transition-colors border border-purple-200"
            >
              ← Edit Blend
            </button>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
