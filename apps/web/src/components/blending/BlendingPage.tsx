/**
 * BlendingPage Component
 * 
 * Main page component for the immersive blending experience
 * Features collapsible ingredient panels hidden by default
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { ExtendedBlendState, BlendSize } from './types';
import { useIngredients, getIngredientById } from '@/hooks/useIngredients';
import { useBlendPricing } from './useBlendPricing';
import { useFlavorProfile, DEFAULT_STATUS } from './useFlavorProfile';
import { ImmersiveHeader } from './ImmersiveHeader';
import { CenterScene } from './CenterScene';
import { BottomActionBar } from './BottomActionBar';
import { CollapsibleBaseColumn } from './CollapsibleBaseColumn';
import { CollapsibleMagicColumn } from './CollapsibleMagicColumn';
import { useCart } from '@/contexts/CartContext';
import { BRANDING } from '@/config/branding';

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
  const router = useRouter();
  
  // Fetch ingredients from API
  const { bases, addIns, isLoading, error } = useIngredients();
  
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
        const ingredient = getIngredientById(ingredientId, bases, addIns);
        const defaultQuantity = ingredient?.baseAmount || 0.25;
        return {
          ...prev,
          addIns: [...prev.addIns, { ingredientId, quantity: defaultQuantity }],
        };
      }
    });
  }, [bases, addIns]);

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
    
    if (onContinue) {
      onContinue(blendState);
    } else {
      // Store blend state in sessionStorage and navigate to review page
      sessionStorage.setItem('pendingBlend', JSON.stringify(blendState));
      router.push('/table/review');
    }
    
    setIsProcessing(false);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleCartClick = () => {
    router.push('/cart');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed relative" style={{ backgroundImage: `url(${BRANDING.IMAGE_BASE_PATH}/background-image.png)` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">Loading ingredients...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-fixed relative" style={{ backgroundImage: `url(${BRANDING.IMAGE_BASE_PATH}/background-image.png)` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-white text-center">
            <p className="text-xl mb-2">Error loading ingredients</p>
            <p className="text-sm opacity-70">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Fixed full-screen background with custom image */}
      <div 
        className="fixed inset-0 z-0 bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950"
        style={{
          backgroundImage: `url(${BRANDING.IMAGE_BASE_PATH}/background-table.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />

      {/* Content layer */}
      <div className="relative z-10">
        {/* Immersive Header */}
        <ImmersiveHeader
          onBack={() => {
        if (window.history.length > 1) {
          router.back();             // Go back to wherever user came from
        } else {
          router.push("/l");   // Fallback if no history (page opened fresh)
        }
      }}
          cartItemCount={itemCount}
          stepIndicator={getStepIndicator()}
          onCartClick={handleCartClick}
        />

        {/* Main Content - 3 Column Layout */}
        <main className="pt-20 pb-24 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Desktop: 3-column layout */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-6">
              {/* Left Column: Base Selection (~20-25%) - Now Collapsible */}
              <div className="lg:col-span-3">
                <div className="sticky top-24">
                  <CollapsibleBaseColumn
                    bases={bases}
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
                  bases={bases}
                  addInsData={addIns}
                />
              </div>

              {/* Right Column: Add-ins (~20-25%) - Now Collapsible */}
              <div className="lg:col-span-3">
                <div className="sticky top-24">
                  <CollapsibleMagicColumn
                    selectedAddIns={blendState.addIns}
                    onToggleAddIn={handleToggleAddIn}
                    onQuantityChange={handleQuantityChange}
                    addInsData={addIns}
                  />
                </div>
              </div>
            </div>

            {/* Mobile: Stacked Layout */}
            <div className="lg:hidden space-y-6">
              {/* Blend Controls at Top */}
              <div className="rounded-2xl p-4">
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

              {/* Bowl Visual (simplified for mobile) */}
              <div className="rounded-2xl p-6">
                <div className="relative w-48 h-48 mx-auto">
                  <Image
                    src={`${BRANDING.IMAGE_BASE_PATH}/glass-bowl.png`}
                    alt="Empty bowl"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Collapsible Panels for Mobile */}
              <div className="flex gap-4 justify-center">
                {/* Base Selection Trigger */}
                <CollapsibleBaseColumn
                  bases={bases}
                  selectedBaseId={blendState.baseTeaId}
                  onSelectBase={handleSelectBase}
                />

                {/* Magic Selection Trigger */}
                <CollapsibleMagicColumn
                  selectedAddIns={blendState.addIns}
                  onToggleAddIn={handleToggleAddIn}
                  onQuantityChange={handleQuantityChange}
                  addInsData={addIns}
                />
              </div>

              {/* Blend Breakdown */}
              <div className="rounded-2xl p-4">
                <h3 className="text-lg font-bold text-white mb-3">Your Blend</h3>
                {blendState.baseTeaId || blendState.addIns.length > 0 ? (
                  <div className="space-y-2">
                    {blendState.baseTeaId && (
                      <div className="flex items-center gap-2 bg-white/20 p-2 rounded-lg">
                        <span>{getIngredientById(blendState.baseTeaId, bases, addIns)?.emoji}</span>
                        <span className="flex-1 text-sm font-medium text-white">
                          {getIngredientById(blendState.baseTeaId, bases, addIns)?.name}
                        </span>
                        <span className="text-xs text-purple-300">Base</span>
                      </div>
                    )}
                    {blendState.addIns.map((addIn) => {
                      const ing = getIngredientById(addIn.ingredientId, bases, addIns);
                      if (!ing) return null;
                      return (
                        <div key={addIn.ingredientId} className="flex items-center gap-2 bg-white/10 p-2 rounded-lg">
                          <span>{ing.emoji}</span>
                          <span className="flex-1 text-sm text-white">{ing.name}</span>
                          <span className="text-xs text-white/60">{addIn.quantity.toFixed(2)} oz</span>
                          <button
                            onClick={() => handleRemoveIngredient(addIn.ingredientId)}
                            className="w-5 h-5 rounded-full bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center"
                          >
                            <svg className="w-3 h-3 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-white/50 text-sm text-center py-4">
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
    </div>
  );
};
