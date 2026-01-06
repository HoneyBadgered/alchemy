/**
 * CollapsibleMagicColumn Component
 * 
 * Collapsible wrapper for the "Add Your Magic" ingredient selection panel
 * Hidden by default, expands when trigger is clicked
 * Remains open until user explicitly closes it
 * Contains 7 ingredient category buttons with accordion-style expansion
 */

'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { BRANDING } from '@/config/branding';
import type { IngredientCategory } from '@alchemy/core';
import type { BlendingIngredient } from './mockData';
import { useDeviceType } from '@/hooks/useDeviceType';
import { IngredientDetailsSheet } from './IngredientDetailsSheet';
import { IngredientSlider } from './IngredientSlider';
import { sliderToGrams, gramsToSlider } from './sliderUtils';

interface CollapsibleMagicColumnProps {
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
  
  // Direct mappings for new categories
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
  
  // Premium category - needs smart classification
  if (cat === 'premium') {
    // Flowers
    if (name.includes('jasmine') || name.includes('rose') || name.includes('lavender') || 
        name.includes('chamomile') || name.includes('hibiscus') || name.includes('flower')) {
      return 'flowers';
    }
    // Spices
    if (name.includes('saffron') || name.includes('cardamom') || name.includes('vanilla bean')) {
      return 'spice';
    }
    // Essences/Extracts
    if (name.includes('extract') || name.includes('essence') || name.includes('oil') || name.includes('bergamot')) {
      return 'essence';
    }
    // Default premium items to specialty
    return 'specialty';
  }
  
  // Special category - needs smart classification
  if (cat === 'special') {
    // Sweeteners
    if (name.includes('honey') || name.includes('vanilla') || name.includes('licorice') || 
        name.includes('stevia') || name.includes('agave') || name.includes('sugar')) {
      return 'sweet';
    }
    // Essences/Extracts
    if (name.includes('extract') || name.includes('essence') || name.includes('oil')) {
      return 'essence';
    }
    return 'specialty';
  }
  
  // Ingredient-specific overrides for common misclassifications
  if (name.includes('ginger') || name.includes('mint') || name.includes('lemongrass') || 
      name.includes('tulsi') || name.includes('basil') || name.includes('thyme')) {
    return 'herbs';
  }
  
  // Default fallback
  return 'specialty';
}

interface IngredientItemProps {
  ingredient: BlendingIngredient;
  quantity: number;
  isSelected: boolean;
  blendSize: number;
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
  useMobileBehavior: boolean;
  onOpenDetails?: () => void;
}

const IngredientItem: React.FC<IngredientItemProps> = ({
  ingredient,
  quantity,
  isSelected,
  blendSize,
  onToggle,
  onQuantityChange,
  useMobileBehavior,
  onOpenDetails,
}) => {
  const handleClick = () => {
    if (useMobileBehavior && onOpenDetails) {
      // On mobile: tap opens details sheet
      onOpenDetails();
    } else {
      // On desktop: click toggles selection
      onToggle();
    }
  };

  // Convert grams to slider value for display
  const sliderValue = gramsToSlider(quantity, ingredient, blendSize);

  const handleSliderChange = (newSliderValue: number) => {
    // Convert slider value back to grams
    const grams = sliderToGrams(newSliderValue, ingredient, blendSize);
    onQuantityChange(grams);
  };

  const tooltipText = [
    ingredient.shortTags?.join(' · ') || ingredient.description,
    ingredient.tier === 'premium' ? 'Premium' : ''
  ].filter(Boolean).join(' · ');

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (showTooltip && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top - 8,
        left: rect.left + rect.width / 2
      });
    }
  }, [showTooltip]);

  return (
    <>
    <div className="relative group">
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={() => !useMobileBehavior && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative w-full p-2 transition-all duration-200 flex flex-col items-center text-center gap-2 hover:scale-105 active:scale-95"
        aria-pressed={isSelected}
      >

        {/* Rose Bottle Image */}
        <div className="relative w-16 h-20">
          <Image
            src={`${BRANDING.IMAGE_BASE_PATH}/rose-bottle.png`}
            alt={ingredient.name}
            fill
            className="object-contain"
          />
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Name */}
        <h4 className={`font-semibold text-sm ${isSelected ? 'text-purple-300' : 'text-white'}`}>
          {ingredient.name}
        </h4>
      </button>

      {/* Quantity Slider (when selected) */}
      {isSelected && (
        <div className="mt-2 px-2">
          <IngredientSlider
            value={sliderValue}
            onChange={handleSliderChange}
            category={ingredient.category}
            name={ingredient.name}
            showHelper={false}
          />
        </div>
      )}

      {/* Mobile: Show select/unselect button when details sheet is used */}
      {useMobileBehavior && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`mt-1 px-3 py-1 text-white text-xs rounded-full transition-colors ${
            isSelected 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-purple-500 hover:bg-purple-600'
          }`}
        >
          {isSelected ? 'Remove' : 'Add'}
        </button>
      )}
    </div>

    {/* Portal Tooltip */}
    {showTooltip && !useMobileBehavior && typeof window !== 'undefined' && createPortal(
      <div 
        className="fixed pointer-events-none z-[9999] transition-opacity duration-200"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
};

const INGREDIENT_CATEGORIES: Array<{
  id: IngredientCategory;
  label: string;
  description: string;
  emoji: string;
}> = [
  { id: 'flowers', label: 'Flowers', description: 'Petals, blossoms, gentle aromatics', emoji: '🌸' },
  { id: 'herbs', label: 'Herbs', description: 'Leafy, green, restorative', emoji: '🌿' },
  { id: 'fruit', label: 'Fruits & Citrus', description: 'Dried fruit and peel', emoji: '🍊' },
  { id: 'spice', label: 'Spices', description: 'Warm, bold, smoky', emoji: '🔥' },
  { id: 'sweet', label: 'Sweet & Aromatic', description: 'Rounding elements', emoji: '🍯' },
  { id: 'essence', label: 'Essences', description: 'Concentrated flavors', emoji: '💧' },
  { id: 'specialty', label: 'Specialty', description: 'Seasonal, rare, functional', emoji: '⭐' },
];

export const CollapsibleMagicColumn: React.FC<CollapsibleMagicColumnProps> = ({
  selectedAddIns,
  onToggleAddIn,
  onQuantityChange,
  blendSize = 2,
  addInsData,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [detailsIngredient, setDetailsIngredient] = useState<BlendingIngredient | null>(null);
  const { useMobileBehavior } = useDeviceType();
  
  // Single expanded category (accordion behavior)
  const [expandedCategory, setExpandedCategory] = useState<IngredientCategory | null>(null);

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

  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  const handleToggleCategory = useCallback((categoryId: IngredientCategory) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  }, []);

  const handleOpenDetails = useCallback((ingredient: BlendingIngredient) => {
    setDetailsIngredient(ingredient);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsIngredient(null);
  }, []);

  const totalSelectedCount = selectedAddIns.length;

  return (
    <div className="relative" data-testid="collapsible-magic-panel">
      {/* Collapsed Trigger */}
      <AnimatePresence mode="wait">
        {!isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="cursor-pointer fixed top-[40vh] right-8 z-30"
            onClick={handleTogglePanel}
            data-testid="magic-trigger"
          >
            <div className="relative w-98 h-112 group">
              <Image
                src={`${BRANDING.IMAGE_BASE_PATH}/rose-bottle.png`}
                alt="Add your magic"
                fill
                className="object-contain group-hover:scale-110 transition-transform duration-200"
              />
              {totalSelectedCount > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">{totalSelectedCount}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Panel */}
      <AnimatePresence mode="wait">
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative max-w-lg z-[55]"
            data-testid="magic-panel-expanded"
          >
            <div 
              className="rounded-2xl pt-6 px-6 pb-12 shadow-xl relative w-full max-w-lg overflow-visible"
              style={{ 
                backgroundImage: `url(${BRANDING.IMAGE_BASE_PATH}/background-wide-scroll-2.png)`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🪄</span>
                    Add your magic
                  </h2>
                  <p className="text-xs text-white/70 mt-1">
                    Choose a category to explore ingredients
                  </p>
                </div>
                <button
                  onClick={handleTogglePanel}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="Close magic selection panel"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Category Buttons (2x4 grid - will be 2x3 + 1) */}
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-3">
                  {INGREDIENT_CATEGORIES.map((category) => {
                    const ingredientsInCategory = ingredientsByCategory[category.id] || [];
                    const isExpanded = expandedCategory === category.id;
                    const hasIngredients = ingredientsInCategory.length > 0;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => hasIngredients && handleToggleCategory(category.id)}
                        disabled={!hasIngredients}
                        className={`
                          relative p-4 rounded-xl transition-all
                          ${isExpanded 
                            ? 'bg-white/30 ring-2 ring-white/50 shadow-lg' 
                            : hasIngredients 
                              ? 'bg-white/10 hover:bg-white/20' 
                              : 'bg-white/5 opacity-50 cursor-not-allowed'
                          }
                        `}
                      >
                        <div className="text-3xl mb-1">{category.emoji}</div>
                        <div className="text-sm font-semibold text-white">{category.label}</div>
                        <div className="text-xs text-white/60 mt-0.5">{category.description}</div>
                        {hasIngredients && (
                          <div className="absolute top-2 right-2 text-xs bg-white/20 px-1.5 py-0.5 rounded-full text-white">
                            {ingredientsInCategory.length}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expanded Category Ingredient List */}
              <AnimatePresence mode="wait">
                {expandedCategory && ingredientsByCategory[expandedCategory] && (
                  <motion.div
                    key={expandedCategory}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/10 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <span>{INGREDIENT_CATEGORIES.find(c => c.id === expandedCategory)?.emoji}</span>
                        {INGREDIENT_CATEGORIES.find(c => c.id === expandedCategory)?.label}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-1">
                        {ingredientsByCategory[expandedCategory]!.map((ingredient) => {
                          const isSelected = selectedAddIns.some(a => a.ingredientId === ingredient.id);
                          const quantity = selectedAddIns.find(a => a.ingredientId === ingredient.id)?.quantity || 0.25;
                          return (
                            <IngredientItem
                              key={ingredient.id}
                              ingredient={ingredient}
                              quantity={quantity}
                              isSelected={isSelected}
                              blendSize={blendSize}
                              onToggle={() => onToggleAddIn(ingredient.id)}
                              onQuantityChange={(q) => onQuantityChange(ingredient.id, q)}
                              useMobileBehavior={useMobileBehavior}
                              onOpenDetails={() => handleOpenDetails(ingredient)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Details Sheet */}
      <IngredientDetailsSheet
        ingredient={detailsIngredient}
        isOpen={detailsIngredient !== null}
        onClose={handleCloseDetails}
      />
    </div>
  );
};
