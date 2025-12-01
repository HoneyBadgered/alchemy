/**
 * IngredientPanel Component
 * 
 * Floating panel for selecting ingredients from a category
 */

'use client';

import React, { useEffect } from 'react';
import { Ingredient, IngredientCategory, CATEGORY_INFO } from '@alchemy/core';
import { IngredientListItem } from './IngredientListItem';

interface IngredientPanelProps {
  isOpen: boolean;
  category: IngredientCategory | null;
  ingredients: Ingredient[];
  selectedBaseId?: string;
  selectedAddInIds: string[];
  addInQuantities: Record<string, number>;
  onClose: () => void;
  onSelectBase: (ingredientId: string) => void;
  onToggleAddIn: (ingredientId: string) => void;
  onUpdateQuantity: (ingredientId: string, quantity: number) => void;
}

// Helper function to get category-specific class names
const getCategoryClasses = (category: IngredientCategory) => {
  const classes: Record<IngredientCategory, {
    header: string;
    title: string;
    description: string;
    closeBtn: string;
  }> = {
    base: {
      header: 'bg-gradient-to-r from-emerald-100 to-emerald-200',
      title: 'text-emerald-900',
      description: 'text-emerald-700',
      closeBtn: 'bg-emerald-200 hover:bg-emerald-300 text-emerald-900',
    },
    floral: {
      header: 'bg-gradient-to-r from-pink-100 to-pink-200',
      title: 'text-pink-900',
      description: 'text-pink-700',
      closeBtn: 'bg-pink-200 hover:bg-pink-300 text-pink-900',
    },
    fruit: {
      header: 'bg-gradient-to-r from-orange-100 to-orange-200',
      title: 'text-orange-900',
      description: 'text-orange-700',
      closeBtn: 'bg-orange-200 hover:bg-orange-300 text-orange-900',
    },
    herbal: {
      header: 'bg-gradient-to-r from-green-100 to-green-200',
      title: 'text-green-900',
      description: 'text-green-700',
      closeBtn: 'bg-green-200 hover:bg-green-300 text-green-900',
    },
    herb: {
      header: 'bg-gradient-to-r from-green-100 to-green-200',
      title: 'text-green-900',
      description: 'text-green-700',
      closeBtn: 'bg-green-200 hover:bg-green-300 text-green-900',
    },
    spice: {
      header: 'bg-gradient-to-r from-amber-100 to-amber-200',
      title: 'text-amber-900',
      description: 'text-amber-700',
      closeBtn: 'bg-amber-200 hover:bg-amber-300 text-amber-900',
    },
    special: {
      header: 'bg-gradient-to-r from-purple-100 to-purple-200',
      title: 'text-purple-900',
      description: 'text-purple-700',
      closeBtn: 'bg-purple-200 hover:bg-purple-300 text-purple-900',
    },
    tea: {
      header: 'bg-gradient-to-r from-emerald-100 to-emerald-200',
      title: 'text-emerald-900',
      description: 'text-emerald-700',
      closeBtn: 'bg-emerald-200 hover:bg-emerald-300 text-emerald-900',
    },
    sweetener: {
      header: 'bg-gradient-to-r from-yellow-100 to-yellow-200',
      title: 'text-yellow-900',
      description: 'text-yellow-700',
      closeBtn: 'bg-yellow-200 hover:bg-yellow-300 text-yellow-900',
    },
  };
  return classes[category];
};

export const IngredientPanel: React.FC<IngredientPanelProps> = ({
  isOpen,
  category,
  ingredients,
  selectedBaseId,
  selectedAddInIds,
  addInQuantities,
  onClose,
  onSelectBase,
  onToggleAddIn,
  onUpdateQuantity,
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !category) return null;

  const categoryInfo = CATEGORY_INFO[category];
  const categoryClasses = getCategoryClasses(category);
  const isBaseCategory = category === 'base';
  const mode = isBaseCategory ? 'single' : 'multi';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel - Desktop: Modal, Mobile: Bottom Sheet */}
      <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
        <div
          className="
            bg-white rounded-t-3xl md:rounded-2xl shadow-2xl
            w-full max-w-2xl max-h-[85vh] md:max-h-[90vh]
            flex flex-col
            transition-transform duration-300 ease-out
          "
          style={{
            animation: 'slideUp 0.3s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 rounded-t-3xl md:rounded-t-2xl flex-shrink-0 ${categoryClasses.header}`}>
            {/* Mobile swipe indicator */}
            <div className="md:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{categoryInfo.emoji}</span>
                <div>
                  <h2 className={`text-2xl font-bold ${categoryClasses.title}`}>
                    {categoryInfo.title}
                  </h2>
                  <p className={`text-sm ${categoryClasses.description}`}>
                    {categoryInfo.description}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${categoryClasses.closeBtn}`}
                aria-label="Close panel"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Selection Mode Info */}
            <div className="mt-4 bg-white/50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700">
                {isBaseCategory ? (
                  <>
                    <span className="text-purple-600">⚡</span> Select one base tea for your blend
                  </>
                ) : (
                  <>
                    <span className="text-purple-600">✨</span> Select multiple add-ins and adjust quantities
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Scrollable Ingredient List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {ingredients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-3">🫙</div>
                <p>No ingredients available in this category</p>
              </div>
            ) : (
              ingredients.map((ingredient) => (
                <IngredientListItem
                  key={ingredient.id}
                  ingredient={ingredient}
                  isSelected={
                    isBaseCategory
                      ? selectedBaseId === ingredient.id
                      : selectedAddInIds.includes(ingredient.id)
                  }
                  quantity={addInQuantities[ingredient.id] || 5}
                  onSelect={isBaseCategory ? onSelectBase : onToggleAddIn}
                  onQuantityChange={isBaseCategory ? undefined : onUpdateQuantity}
                  mode={mode}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
