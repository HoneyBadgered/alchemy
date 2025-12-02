/**
 * CollapsibleMagicColumn Component
 * 
 * Collapsible wrapper for the "Add Your Magic" ingredient selection panel
 * Hidden by default, expands when trigger is clicked
 * Remains open until user explicitly closes it
 * Contains independent collapsible sections for Add-ins, Botanicals, and Premium
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AddInCategoryTab } from './types';
import type { BlendingIngredient } from './mockData';
import { getAddInsByTab } from './mockData';

interface CollapsibleMagicColumnProps {
  /** Selected add-in IDs with quantities */
  selectedAddIns: Array<{ ingredientId: string; quantity: number }>;
  /** Callback when an add-in is toggled */
  onToggleAddIn: (ingredientId: string) => void;
  /** Callback when add-in quantity is changed */
  onQuantityChange: (ingredientId: string, quantity: number) => void;
}

interface IngredientItemProps {
  ingredient: BlendingIngredient;
  quantity: number;
  isSelected: boolean;
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
}

const IngredientItem: React.FC<IngredientItemProps> = ({
  ingredient,
  quantity,
  isSelected,
  onToggle,
  onQuantityChange,
}) => {
  const incrementAmount = ingredient.incrementAmount || 0.25;
  const minQuantity = ingredient.baseAmount || 0.25;
  const maxQuantity = 2; // Max 2 oz per add-in

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity < maxQuantity) {
      onQuantityChange(Math.min(maxQuantity, quantity + incrementAmount));
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > minQuantity) {
      onQuantityChange(Math.max(minQuantity, quantity - incrementAmount));
    }
  };

  return (
    <div
      className={`
        rounded-xl border-2 transition-all duration-200
        ${isSelected
          ? 'bg-purple-50 border-purple-300 shadow-md'
          : 'bg-white/60 border-white/40 hover:border-purple-200'
        }
      `}
    >
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-start gap-3 text-left"
        aria-pressed={isSelected}
      >
        {/* Thumbnail */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0
          ${isSelected ? 'bg-purple-200' : 'bg-gray-100'}
        `}>
          {ingredient.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`
              font-medium text-sm
              ${isSelected ? 'text-purple-900' : 'text-gray-800'}
            `}>
              {ingredient.name}
            </h4>
            {ingredient.tier === 'premium' && (
              <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                Premium
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {ingredient.shortTags?.join(' · ') || ingredient.description}
          </p>
        </div>

        {/* Selection Indicator */}
        <div className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${isSelected
            ? 'bg-purple-500 border-purple-500'
            : 'border-gray-300'
          }
        `}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </button>

      {/* Quantity Controls (when selected) */}
      {isSelected && (
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between bg-white rounded-lg border border-purple-200 p-2">
            <button
              onClick={handleDecrement}
              disabled={quantity <= minQuantity}
              className="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Decrease quantity"
            >
              <svg className="w-4 h-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="font-semibold text-purple-900">
              {quantity.toFixed(2)} oz
            </span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= maxQuantity}
              className="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              aria-label="Increase quantity"
            >
              <svg className="w-4 h-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface CategorySectionProps {
  id: AddInCategoryTab;
  label: string;
  emoji: string;
  isExpanded: boolean;
  onToggle: () => void;
  ingredients: BlendingIngredient[];
  selectedAddIns: Array<{ ingredientId: string; quantity: number }>;
  onToggleAddIn: (ingredientId: string) => void;
  onQuantityChange: (ingredientId: string, quantity: number) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  id,
  label,
  emoji,
  isExpanded,
  onToggle,
  ingredients,
  selectedAddIns,
  onToggleAddIn,
  onQuantityChange,
}) => {
  const getSelectedQuantity = (ingredientId: string): number => {
    const addIn = selectedAddIns.find(a => a.ingredientId === ingredientId);
    return addIn?.quantity || 0.25;
  };

  const selectedCount = ingredients.filter(ing => 
    selectedAddIns.some(a => a.ingredientId === ing.id)
  ).length;

  return (
    <div 
      className="border border-white/30 rounded-xl overflow-hidden bg-white/10"
      data-testid={`category-section-${id}`}
    >
      {/* Category Header - Always visible, clickable to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-white/10 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="font-semibold text-white">{label}</span>
          {selectedCount > 0 && (
            <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
              {selectedCount}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Expandable ingredient list */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-2 max-h-60 overflow-y-auto">
              {ingredients.map((ingredient) => {
                const isSelected = selectedAddIns.some(a => a.ingredientId === ingredient.id);
                return (
                  <IngredientItem
                    key={ingredient.id}
                    ingredient={ingredient}
                    quantity={getSelectedQuantity(ingredient.id)}
                    isSelected={isSelected}
                    onToggle={() => onToggleAddIn(ingredient.id)}
                    onQuantityChange={(q) => onQuantityChange(ingredient.id, q)}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CATEGORIES: Array<{ id: AddInCategoryTab; label: string; emoji: string }> = [
  { id: 'addIns', label: 'Add-ins', emoji: '🌿' },
  { id: 'botanicals', label: 'Botanicals', emoji: '🌸' },
  { id: 'premium', label: 'Premium', emoji: '✨' },
];

export const CollapsibleMagicColumn: React.FC<CollapsibleMagicColumnProps> = ({
  selectedAddIns,
  onToggleAddIn,
  onQuantityChange,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Independent expanded state for each category section
  const [expandedCategories, setExpandedCategories] = useState<Record<AddInCategoryTab, boolean>>({
    addIns: false,
    botanicals: false,
    premium: false,
  });

  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  const handleToggleCategory = useCallback((categoryId: AddInCategoryTab) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
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
            className="cursor-pointer"
            onClick={handleTogglePanel}
            data-testid="magic-trigger"
          >
            <div
              className={`
                group flex flex-col items-center gap-2 p-4
                bg-white/20 backdrop-blur-sm rounded-2xl
                border-2 hover:border-purple-400/50
                shadow-lg hover:shadow-xl
                transition-all duration-200
                ${totalSelectedCount > 0 ? 'border-purple-400/50 ring-2 ring-purple-400/30' : 'border-white/30'}
              `}
            >
              {/* Icon with selection indicator */}
              <div className="relative">
                <span className="text-5xl group-hover:scale-110 transition-transform duration-200 block">
                  🪄
                </span>
                {totalSelectedCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{totalSelectedCount}</span>
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span className="text-white font-semibold text-center">
                Add Your Magic
              </span>
              
              {/* Subtitle */}
              {totalSelectedCount > 0 ? (
                <span className="text-purple-300 text-xs text-center">
                  {totalSelectedCount} ingredient{totalSelectedCount > 1 ? 's' : ''} selected
                </span>
              ) : (
                <span className="text-white/60 text-xs text-center">
                  Tap to add ingredients
                </span>
              )}
              
              {/* Expand indicator */}
              <div className="flex items-center gap-1 text-white/50 group-hover:text-white/80 transition-colors mt-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
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
            className="relative"
            data-testid="magic-panel-expanded"
          >
            <div className="bg-white/30 backdrop-blur-md rounded-2xl p-4 border border-white/40 shadow-xl">
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🪄</span>
                    Add your magic
                  </h2>
                  <p className="text-xs text-white/70 mt-1">
                    Select ingredients to customize your blend
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

              {/* Category Sections - Each independently collapsible */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {CATEGORIES.map((category) => (
                  <CategorySection
                    key={category.id}
                    id={category.id}
                    label={category.label}
                    emoji={category.emoji}
                    isExpanded={expandedCategories[category.id]}
                    onToggle={() => handleToggleCategory(category.id)}
                    ingredients={getAddInsByTab(category.id)}
                    selectedAddIns={selectedAddIns}
                    onToggleAddIn={onToggleAddIn}
                    onQuantityChange={onQuantityChange}
                  />
                ))}
              </div>

              {/* Done button */}
              <div className="mt-4 pt-3 border-t border-white/20">
                <button
                  onClick={handleTogglePanel}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
