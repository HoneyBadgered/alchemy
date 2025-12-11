/**
 * BlendingPage Component
 * 
 * Main page component for the immersive blending experience
 * Manages state and delegates rendering to Desktop/Mobile views
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ExtendedBlendState, BlendSize } from './types';
import { useIngredients, getIngredientById } from '@/hooks/useIngredients';
import { useBlendPricing } from './useBlendPricing';
import { useFlavorProfile, DEFAULT_STATUS } from './useFlavorProfile';
import { ImmersiveHeader } from './ImmersiveHeader';
import { BottomActionBar } from './BottomActionBar';
import { DesktopBlendingView } from './DesktopBlendingView';
import { MobileBlendingView } from './MobileBlendingView';
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
  const [isBasePanelOpen, setIsBasePanelOpen] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Restore blend state from sessionStorage if available (e.g., when returning from review page)
  useEffect(() => {
    const storedBlend = sessionStorage.getItem('pendingBlend');
    if (storedBlend) {
      try {
        const parsed = JSON.parse(storedBlend);
        setBlendState(parsed);
      } catch (e) {
        console.error('Failed to parse stored blend:', e);
      }
    }
    setHasLoadedFromStorage(true);
  }, []);

  // Save blend state to sessionStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (hasLoadedFromStorage) {
      sessionStorage.setItem('pendingBlend', JSON.stringify(blendState));
    }
  }, [blendState, hasLoadedFromStorage]);

  // Get cart item count for header
  const { itemCount } = useCart();

  // Calculate pricing and flavor profile
  const pricing = useBlendPricing(blendState);
  const { normalizedProfile, status } = useFlavorProfile(blendState, bases, addIns);

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
    return undefined;
  };

  // Handlers
  const handleSelectBase = useCallback((baseId: string) => {
    setBlendState(prev => ({
      ...prev,
      baseTeaId: baseId,
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

  const handleEmptyBowl = useCallback(() => {
    setBlendState(prev => ({
      ...prev,
      baseTeaId: undefined,
      addIns: [],
    }));
  }, []);

  const handleRandomizeBlend = useCallback(() => {
    // Select random base
    const randomBase = bases[Math.floor(Math.random() * bases.length)];
    
    // Combine all add-ins
    const allAddIns = [...addIns.addIns, ...addIns.botanicals, ...addIns.premium];
    
    // Select 2-5 random add-ins
    const numAddIns = Math.floor(Math.random() * 4) + 2; // 2-5 add-ins
    const shuffled = [...allAddIns].sort(() => Math.random() - 0.5);
    const selectedAddIns = shuffled.slice(0, numAddIns);
    
    // Create add-ins with random quantities
    const randomAddIns = selectedAddIns.map(ingredient => ({
      ingredientId: ingredient.id,
      quantity: Math.round((Math.random() * 0.75 + 0.25) * 4) / 4, // 0.25 to 1.0 in 0.25 increments
    }));
    
    // Random size
    const sizes: BlendSize[] = [1, 2, 4];
    const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
    
    setBlendState({
      baseTeaId: randomBase.id,
      addIns: randomAddIns,
      blendName: '',
      size: randomSize,
    });
  }, [bases, addIns]);

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
              router.back();
            } else {
              router.push("/");
            }
          }}
          cartItemCount={itemCount}
          stepIndicator={getStepIndicator()}
          onCartClick={handleCartClick}
        />

        {/* Main Content */}
        <main className="pt-20 pb-24 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Desktop View */}
            <DesktopBlendingView
              blendState={blendState}
              bases={bases}
              addIns={addIns}
              flavorProfile={normalizedProfile}
              price={pricing.price}
              isBasePanelOpen={isBasePanelOpen}
              onSelectBase={handleSelectBase}
              onToggleAddIn={handleToggleAddIn}
              onQuantityChange={handleQuantityChange}
              onSizeChange={handleSizeChange}
              onRemoveIngredient={handleRemoveIngredient}
              onBasePanelOpenChange={setIsBasePanelOpen}
              onContinue={handleContinue}
            />

            {/* Mobile View */}
            <MobileBlendingView
              blendState={blendState}
              bases={bases}
              addIns={addIns}
              price={pricing.price}
              flavorProfile={normalizedProfile}
              onSelectBase={handleSelectBase}
              onToggleAddIn={handleToggleAddIn}
              onQuantityChange={handleQuantityChange}
              onSizeChange={handleSizeChange}
              onRemoveIngredient={handleRemoveIngredient}
            />
          </div>
        </main>

        {/* Bottom Action Bar */}
        <BottomActionBar
          size={blendState.size}
          status={isReady ? status : DEFAULT_STATUS}
          price={pricing.price}
          isReady={isReady}
          isProcessing={isProcessing}
          hasContents={!!blendState.baseTeaId || blendState.addIns.length > 0}
          onContinue={handleContinue}
          onSizeChange={handleSizeChange}
          onEmptyBowl={handleEmptyBowl}
          onRandomize={handleRandomizeBlend}
        />
      </div>
    </div>
  );
};
