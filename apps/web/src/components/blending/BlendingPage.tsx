/**
 * BlendingPage Component
 * 
 * Main page component for the immersive blending experience
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { ExtendedBlendState, BlendSize } from './types';
import { MOCK_BASES, getBlendingIngredientById } from './mockData';
import { useBlendPricing } from './useBlendPricing';
import { useFlavorProfile, DEFAULT_STATUS } from './useFlavorProfile';
import { ImmersiveHeader } from './ImmersiveHeader';
import { BaseColumn } from './BaseColumn';
import { CenterScene } from './CenterScene';
import { AddinsColumn } from './AddinsColumn';
import { BottomActionBar } from './BottomActionBar';
import { useCart } from '@/contexts/CartContext';

interface BlendingPageProps {
  /** Callback for navigation back */
  onBack?: () => void;
  /** Callback when blend is ready for review */
  onContinue?: (blendState: ExtendedBlendState) => void;
}

export const BlendingPage: React.FC<BlendingPageProps> = ({
  onBack,
  onContinue,
}) => {
  // Extended blend state
  const [blendState, setBlendState] = useState<ExtendedBlendState>({
    baseTeaId: undefined,
    addIns: [],
    blendName: '',
    size: 2, // Default 2 oz
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Get cart item count for header
  const { itemCount } = useCart();

  // Calculate pricing and flavor profile
  const pricing = useBlendPricing(blendState);
  const { normalizedProfile, status } = useFlavorProfile(blendState);

  // Determine if blend is ready (has base + at least something selected)
  const isReady = !!blendState.baseTeaId;

  // Step indicator based on state
  const getStepIndicator = (): string | undefined => {
    if (!blendState.baseTeaId) {
      return 'Step 1 · Choose your base';
    }
    if (blendState.addIns.length === 0) {
      return 'Step 2 · Add your ingredients';
    }
    if (!blendState.blendName) {
      return 'Step 3 · Name your blend';
    }
    return undefined;
  };

  // Handlers
  const handleSelectBase = useCallback((baseId: string) => {
    setBlendState(prev => ({
      ...prev,
      baseTeaId: baseId,
    }));
  }, []);

  const handleBlendNameChange = useCallback((name: string) => {
    setBlendState(prev => ({
      ...prev,
      blendName: name,
    }));
  }, []);

  const handleSizeChange = useCallback((size: BlendSize) => {
    setBlendState(prev => ({
      ...prev,
      size,
    }));
  }, []);

  const handleToggleAddIn = useCallback((ingredientId: string) => {
    setBlendState(prev => {
      const existingIndex = prev.addIns.findIndex(a => a.ingredientId === ingredientId);
      
      if (existingIndex >= 0) {
        // Remove add-in
        return {
          ...prev,
          addIns: prev.addIns.filter((_, i) => i !== existingIndex),
        };
      } else {
        // Add add-in with default quantity
        const ingredient = getBlendingIngredientById(ingredientId);
        const defaultQuantity = ingredient?.baseAmount || 0.25;
        return {
          ...prev,
          addIns: [...prev.addIns, { ingredientId, quantity: defaultQuantity }],
        };
      }
    });
  }, []);

  const handleQuantityChange = useCallback((ingredientId: string, quantity: number) => {
    setBlendState(prev => ({
      ...prev,
      addIns: prev.addIns.map(a =>
        a.ingredientId === ingredientId ? { ...a, quantity } : a
      ),
    }));
  }, []);

  const handleRemoveIngredient = useCallback((ingredientId: string) => {
    setBlendState(prev => ({
      ...prev,
      addIns: prev.addIns.filter(a => a.ingredientId !== ingredientId),
    }));
  }, []);

  const handleContinue = async () => {
    if (!isReady || isProcessing) return;

    setIsProcessing(true);
    
    // TODO: Integrate with actual navigation/checkout
    // For now, just call the callback or show an alert
    if (onContinue) {
      onContinue(blendState);
    } else {
      // Demo behavior
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`✨ Blend "${blendState.blendName || 'Custom Blend'}" is ready for review!\nEstimated price: $${pricing.price}`);
    }
    
    setIsProcessing(false);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // TODO: Replace with React Router navigation when router is integrated
      // Using window.history.back() as a fallback since this component may be used
      // before full router integration is complete
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      }
    }
  };

  const handleCartClick = () => {
    // TODO: Replace with React Router navigation (e.g., router.push('/cart'))
    // Using window.location.href temporarily since this component may be used
    // before full router integration is complete
    if (typeof window !== 'undefined') {
      window.location.href = '/cart';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950">
      {/* Immersive Header */}
      <ImmersiveHeader
        onBack={handleBack}
        cartItemCount={itemCount}
        stepIndicator={getStepIndicator()}
        onCartClick={handleCartClick}
      />

      {/* Main Content - 3 Column Layout */}
      <main className="pt-20 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Desktop: 3-column layout */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-6">
            {/* Left Column: Base Selection (~20-25%) */}
            <div className="lg:col-span-3">
              <div className="sticky top-24">
                <BaseColumn
                  bases={MOCK_BASES}
                  selectedBaseId={blendState.baseTeaId}
                  onSelectBase={handleSelectBase}
                />
              </div>
            </div>

            {/* Center Column: Table Scene (~50-60%) */}
            <div className="lg:col-span-6">
              <CenterScene
                blendState={blendState}
                onBlendNameChange={handleBlendNameChange}
                onSizeChange={handleSizeChange}
                price={pricing.price}
                flavorProfile={normalizedProfile}
                onRemoveIngredient={handleRemoveIngredient}
              />
            </div>

            {/* Right Column: Add-ins (~20-25%) */}
            <div className="lg:col-span-3">
              <div className="sticky top-24">
                <AddinsColumn
                  selectedAddIns={blendState.addIns}
                  onToggleAddIn={handleToggleAddIn}
                  onQuantityChange={handleQuantityChange}
                />
              </div>
            </div>
          </div>

          {/* Mobile: Stacked Layout */}
          <div className="lg:hidden space-y-6">
            {/* Blend Controls at Top */}
            <div className="bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-purple-950/90 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30">
              <div className="flex items-center justify-between gap-4 mb-3">
                <input
                  type="text"
                  value={blendState.blendName}
                  onChange={(e) => handleBlendNameChange(e.target.value)}
                  placeholder="Name your blend…"
                  className="flex-1 bg-transparent border-b-2 border-white/30 focus:border-purple-300 text-white text-lg font-semibold placeholder-white/50 outline-none pb-1"
                />
                <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 px-3 py-1.5 rounded-full font-bold text-sm">
                  ${pricing.price}
                </div>
              </div>
              
              {/* Size Selector */}
              <div className="flex gap-2 justify-center">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSizeChange(s as BlendSize)}
                    className={`
                      px-4 py-1.5 rounded-full text-sm font-medium transition-all
                      ${blendState.size === s
                        ? 'bg-white text-purple-900 shadow'
                        : 'bg-white/20 text-white hover:bg-white/30'
                      }
                    `}
                  >
                    {s} oz
                  </button>
                ))}
              </div>
            </div>

            {/* Table Visual (simplified for mobile) */}
            <div className="bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-purple-950/90 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
              <div className="relative w-48 h-48 mx-auto">
                <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent rounded-full" />
                <div className="absolute inset-2 bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950 rounded-full shadow-2xl border-4 border-amber-700/50" />
                <div className="absolute inset-8 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-full shadow-inner border-2 border-slate-600/50 flex items-center justify-center">
                  <span className="text-3xl">🫖</span>
                </div>
              </div>
            </div>

            {/* Base Selection (Horizontal Carousel) */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
              <h2 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
                <span>🍵</span> Choose your base
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
                {MOCK_BASES.map((base) => (
                  <button
                    key={base.id}
                    onClick={() => handleSelectBase(base.id)}
                    className={`
                      flex-shrink-0 w-28 p-3 rounded-xl border-2 transition-all snap-start
                      ${blendState.baseTeaId === base.id
                        ? 'bg-purple-100 border-purple-400 shadow-lg'
                        : 'bg-white/60 border-white/40'
                      }
                    `}
                  >
                    <div className="text-2xl mb-1">{base.emoji}</div>
                    <div className="text-xs font-semibold text-gray-800 truncate">{base.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Add-ins (Collapsible) */}
            <AddinsColumn
              selectedAddIns={blendState.addIns}
              onToggleAddIn={handleToggleAddIn}
              onQuantityChange={handleQuantityChange}
            />

            {/* Blend Breakdown */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
              <h3 className="text-lg font-bold text-purple-900 mb-3">Your Blend</h3>
              {blendState.baseTeaId || blendState.addIns.length > 0 ? (
                <div className="space-y-2">
                  {blendState.baseTeaId && (
                    <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-lg">
                      <span>{getBlendingIngredientById(blendState.baseTeaId)?.emoji}</span>
                      <span className="flex-1 text-sm font-medium text-purple-900">
                        {getBlendingIngredientById(blendState.baseTeaId)?.name}
                      </span>
                      <span className="text-xs text-purple-600">Base</span>
                    </div>
                  )}
                  {blendState.addIns.map((addIn) => {
                    const ing = getBlendingIngredientById(addIn.ingredientId);
                    if (!ing) return null;
                    return (
                      <div key={addIn.ingredientId} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                        <span>{ing.emoji}</span>
                        <span className="flex-1 text-sm text-gray-800">{ing.name}</span>
                        <span className="text-xs text-gray-500">{addIn.quantity.toFixed(2)} oz</span>
                        <button
                          onClick={() => handleRemoveIngredient(addIn.ingredientId)}
                          className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center"
                        >
                          <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  Select a base and add ingredients
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <BottomActionBar
        size={blendState.size}
        status={isReady ? status : DEFAULT_STATUS}
        price={pricing.price}
        isReady={isReady}
        isProcessing={isProcessing}
        onContinue={handleContinue}
      />
    </div>
  );
};
