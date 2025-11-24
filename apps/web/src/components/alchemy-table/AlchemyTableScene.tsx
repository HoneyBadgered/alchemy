/**
 * AlchemyTableScene Component
 * 
 * Top-level orchestrator for the alchemy table UI
 * Manages blend state and controls which panel is open
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  INGREDIENTS,
  getIngredientsByCategory,
  IngredientCategory,
} from '@alchemy/core';
import { useBlendState } from '@/hooks/useBlendState';
import { useCart } from '@/contexts/CartContext';
import { JarCategory } from './JarCategory';
import { IngredientPanel } from './IngredientPanel';
import { BowlSummary } from './BowlSummary';

const CATEGORIES: IngredientCategory[] = [
  'base',
  'floral',
  'fruit',
  'herbal',
  'spice',
  'special',
];

export const AlchemyTableScene: React.FC = () => {
  const [openCategory, setOpenCategory] = useState<IngredientCategory | null>(null);
  const [isCrafting, setIsCrafting] = useState(false);
  
  const {
    blendState,
    selectBase,
    toggleAddIn,
    updateAddInQuantity,
    clearBlend,
  } = useBlendState();

  const { addBlendToCart } = useCart();

  // Memoize add-in quantities for panel
  const addInQuantities = useMemo(() => {
    return blendState.addIns.reduce((acc, item) => {
      acc[item.ingredientId] = item.quantity;
      return acc;
    }, {} as Record<string, number>);
  }, [blendState.addIns]);

  // Memoize selected add-in IDs
  const selectedAddInIds = useMemo(() => {
    return blendState.addIns.map(item => item.ingredientId);
  }, [blendState.addIns]);

  // Check if a category has selections
  const categoryHasSelections = (category: IngredientCategory): boolean => {
    if (category === 'base') {
      return !!blendState.baseTeaId;
    }
    const categoryIngredients = getIngredientsByCategory(category);
    return categoryIngredients.some(ing =>
      selectedAddInIds.includes(ing.id)
    );
  };

  const handleJarClick = (category: IngredientCategory) => {
    if (openCategory === category) {
      setOpenCategory(null);
    } else {
      setOpenCategory(category);
    }
  };

  const handleClosePanel = () => {
    setOpenCategory(null);
  };

  const handleCraftBlend = async () => {
    if (!blendState.baseTeaId) {
      alert('Please select a base tea first!');
      return;
    }

    setIsCrafting(true);
    try {
      await addBlendToCart(blendState.baseTeaId, blendState.addIns);
      
      // Show success message
      const baseTea = INGREDIENTS.find(ing => ing.id === blendState.baseTeaId);
      alert(`✨ Your ${baseTea?.name || 'custom'} blend has been added to cart!`);
      
      // Clear the blend after successful addition
      clearBlend();
    } catch (error) {
      console.error('Failed to craft blend:', error);
      alert('Failed to add blend to cart. Please try again.');
    } finally {
      setIsCrafting(false);
    }
  };

  const categoryIngredients = openCategory
    ? getIngredientsByCategory(openCategory)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-900">
            The Alchemy Table ✨
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Craft your perfect blend
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Jars (takes 2 columns on large screens) */}
          <div className="lg:col-span-2">
            {/* Alchemy Table Surface */}
            <div className="bg-gradient-to-br from-amber-900 to-amber-700 rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="bg-amber-800/50 rounded-2xl p-6 md:p-8">
                <h2 className="text-white text-lg md:text-xl font-semibold mb-6 text-center">
                  Select Your Ingredients
                </h2>

                {/* Ingredient Jars Grid */}
                <div className="grid grid-cols-3 gap-4 md:gap-6 justify-items-center">
                  {CATEGORIES.map(category => (
                    <JarCategory
                      key={category}
                      category={category}
                      isOpen={openCategory === category}
                      hasSelections={categoryHasSelections(category)}
                      onClick={() => handleJarClick(category)}
                    />
                  ))}
                </div>

                {/* Helpful Hint */}
                <div className="mt-8 text-center">
                  <p className="text-white/70 text-sm">
                    Tap a jar to explore ingredients
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Bowl Summary (shown below table on small screens) */}
            <div className="lg:hidden mt-6">
              <BowlSummary
                blendState={blendState}
                ingredients={INGREDIENTS}
                onClearBlend={clearBlend}
                onCraftBlend={handleCraftBlend}
                isCrafting={isCrafting}
              />
            </div>
          </div>

          {/* Right Column: Bowl Summary (sticky on large screens) */}
          <div className="hidden lg:block">
            <BowlSummary
              blendState={blendState}
              ingredients={INGREDIENTS}
              onClearBlend={clearBlend}
              onCraftBlend={handleCraftBlend}
              isCrafting={isCrafting}
            />
          </div>
        </div>
      </div>

      {/* Ingredient Selection Panel */}
      <IngredientPanel
        isOpen={!!openCategory}
        category={openCategory}
        ingredients={categoryIngredients}
        selectedBaseId={blendState.baseTeaId}
        selectedAddInIds={selectedAddInIds}
        addInQuantities={addInQuantities}
        onClose={handleClosePanel}
        onSelectBase={selectBase}
        onToggleAddIn={toggleAddIn}
        onUpdateQuantity={updateAddInQuantity}
      />
    </div>
  );
};
