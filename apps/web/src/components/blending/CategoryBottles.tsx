/**
 * CategoryBottles Component
 * 
 * Displays category bottles/buttons directly on the table
 * Each category opens its own ingredient scroll/panel
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { IngredientCategory } from '@alchemy/core';
import type { BlendingIngredient } from './mockData';
import { IngredientSlider } from './IngredientSlider';
import { sliderToGrams, gramsToSlider } from './sliderUtils';

interface CategoryBottlesProps {
  /** Selected add-in IDs with quantities */
  selectedAddIns: Array<{ ingredientId: string; quantity: number }>;
  /** Callback when an add-in is toggled */
  onToggleAddIn: (ingredientId: string) => void;
  /** Callback when add-in quantity is changed */
  onQuantityChange: (ingredientId: string, quantity: number) => void;
  /** Blend size in ounces */
  blendSize?: number;
  /** Add-ins data from API */
  addInsData: {
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  };
}

// Map legacy data structure to new category system
function getCategoryId(ingredient: BlendingIngredient): IngredientCategory {
  const cat = ingredient.category?.toLowerCase();
  const name = ingredient.name?.toLowerCase() || '';
  
  // Direct mappings
  if (cat === 'flowers') return 'flowers';
  if (cat === 'herbs') return 'herbs';
  if (cat === 'fruit') return 'fruit';
  if (cat === 'spice') return 'spice';
  if (cat === 'sweet') return 'sweet';
  if (cat === 'essence') return 'essence';
  if (cat === 'specialty') return 'specialty';
  
  // Legacy mappings
  if (cat === 'floral' || cat === 'botanical') return 'flowers';
  if (cat === 'herbal' || cat === 'herb') return 'herbs';
  if (cat === 'extract') return 'essence';
  if (cat === 'functional') return 'specialty';
  
  // Premium category classification
  if (cat === 'premium') {
    if (name.includes('jasmine') || name.includes('flower')) return 'flowers';
    if (name.includes('saffron')) return 'spice';
    return 'specialty';
  }
  
  // Ingredient-specific overrides
  if (name.includes('ginger') || name.includes('mint') || name.includes('lemongrass') || 
      name.includes('tulsi') || name.includes('sage')) {
    return 'herbs';
  }
  
  return 'specialty';
}

const INGREDIENT_CATEGORIES: Array<{
  id: IngredientCategory;
  label: string;
  description: string;
  emoji: string;
  color: string;
}> = [
  { id: 'flowers', label: 'Flowers', description: 'Petals & blossoms', emoji: '🌸', color: 'from-pink-400 to-pink-600' },
  { id: 'herbs', label: 'Herbs', description: 'Leafy & restorative', emoji: '🌿', color: 'from-green-400 to-green-600' },
  { id: 'fruit', label: 'Fruits', description: 'Dried fruit & peel', emoji: '🍊', color: 'from-orange-400 to-orange-600' },
  { id: 'spice', label: 'Spices', description: 'Warm & bold', emoji: '🔥', color: 'from-red-400 to-red-600' },
  { id: 'sweet', label: 'Sweet', description: 'Rounding elements', emoji: '🍯', color: 'from-amber-400 to-amber-600' },
  { id: 'essence', label: 'Essences', description: 'Concentrated flavors', emoji: '💧', color: 'from-blue-400 to-blue-600' },
  { id: 'specialty', label: 'Specialty', description: 'Rare & functional', emoji: '⭐', color: 'from-purple-400 to-purple-600' },
];

export const CategoryBottles: React.FC<CategoryBottlesProps> = ({
  selectedAddIns,
  onToggleAddIn,
  onQuantityChange,
  blendSize = 2,
  addInsData,
}) => {
  const [openCategory, setOpenCategory] = useState<IngredientCategory | null>(null);

  // Group all ingredients by category
  const ingredientsByCategory = useMemo(() => {
    const allIngredients = [
      ...addInsData.addIns,
      ...addInsData.botanicals,
      ...addInsData.premium,
    ];
    
    const grouped: Partial<Record<IngredientCategory, BlendingIngredient[]>> = {};
    
    allIngredients.forEach(ingredient => {
      const categoryId = getCategoryId(ingredient);
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId]!.push(ingredient);
    });
    
    return grouped;
  }, [addInsData]);

  const handleToggleCategory = useCallback((categoryId: IngredientCategory) => {
    setOpenCategory(prev => prev === categoryId ? null : categoryId);
  }, []);

  return (
    <div className="space-y-4">
      {/* Category Bottles Grid */}
      <div className="grid grid-cols-4 gap-3">
        {INGREDIENT_CATEGORIES.map((category) => {
          const ingredientsInCategory = ingredientsByCategory[category.id] || [];
          const selectedCount = ingredientsInCategory.filter(ing =>
            selectedAddIns.some(a => a.ingredientId === ing.id)
          ).length;
          const isOpen = openCategory === category.id;
          const hasIngredients = ingredientsInCategory.length > 0;

          return (
            <button
              key={category.id}
              onClick={() => hasIngredients && handleToggleCategory(category.id)}
              disabled={!hasIngredients}
              className={`
                relative group transition-all duration-200
                ${hasIngredients ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                ${isOpen ? 'scale-105' : 'hover:scale-102'}
              `}
            >
              {/* Bottle/Button Visual */}
              <div className={`
                relative h-32 rounded-2xl overflow-hidden
                bg-gradient-to-br ${category.color}
                ${isOpen ? 'ring-4 ring-white shadow-2xl' : 'shadow-lg'}
                ${hasIngredients && !isOpen ? 'group-hover:shadow-xl' : ''}
                transition-all duration-200
              `}>
                {/* Emoji/Icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl mb-2 filter drop-shadow-lg">
                    {category.emoji}
                  </div>
                  <div className="text-white font-bold text-sm drop-shadow-md">
                    {category.label}
                  </div>
                  <div className="text-white/80 text-xs mt-0.5">
                    {category.description}
                  </div>
                </div>

                {/* Badge */}
                {hasIngredients && (
                  <div className="absolute top-2 right-2 bg-white/90 text-gray-900 text-xs font-bold px-2 py-1 rounded-full shadow-md">
                    {ingredientsInCategory.length}
                  </div>
                )}

                {/* Selected Count Badge */}
                {selectedCount > 0 && (
                  <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                    <span>✓</span>
                    <span>{selectedCount}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Category Ingredient Scroll */}
      <AnimatePresence mode="wait">
        {openCategory && ingredientsByCategory[openCategory] && (
          <motion.div
            key={openCategory}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">
                    {INGREDIENT_CATEGORIES.find(c => c.id === openCategory)?.emoji}
                  </span>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {INGREDIENT_CATEGORIES.find(c => c.id === openCategory)?.label}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {INGREDIENT_CATEGORIES.find(c => c.id === openCategory)?.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenCategory(null)}
                  className="text-white/60 hover:text-white transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Ingredients Grid with Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                {ingredientsByCategory[openCategory]!.map((ingredient) => {
                  const isSelected = selectedAddIns.some(a => a.ingredientId === ingredient.id);
                  const quantity = selectedAddIns.find(a => a.ingredientId === ingredient.id)?.quantity || ingredient.baseAmount || 0.25;
                  const sliderValue = gramsToSlider(quantity, ingredient, blendSize);

                  return (
                    <div
                      key={ingredient.id}
                      className={`
                        p-4 rounded-xl transition-all
                        ${isSelected
                          ? 'bg-white/20 ring-2 ring-white/50'
                          : 'bg-white/5 hover:bg-white/10'
                        }
                      `}
                    >
                      {/* Ingredient Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{ingredient.name}</h4>
                          {ingredient.description && (
                            <p className="text-white/60 text-xs mt-1">{ingredient.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => onToggleAddIn(ingredient.id)}
                          className={`
                            ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-all
                            ${isSelected
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/20 text-white/60 hover:bg-white/30'
                            }
                          `}
                        >
                          {isSelected ? '✓' : '+'}
                        </button>
                      </div>

                      {/* Slider (only show when selected) */}
                      {isSelected && (
                        <div className="mt-3">
                          <IngredientSlider
                            value={sliderValue}
                            onChange={(newValue) => {
                              const grams = sliderToGrams(newValue, ingredient, blendSize);
                              onQuantityChange(ingredient.id, grams);
                            }}
                            category={ingredient.category}
                            name={ingredient.name}
                            showHelper={false}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
