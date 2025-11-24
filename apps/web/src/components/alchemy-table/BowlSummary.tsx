/**
 * BowlSummary Component
 * 
 * Displays the current blend state - selected base tea and add-ins
 */

'use client';

import React from 'react';
import { BlendState, Ingredient, IngredientCategory } from '@alchemy/core';

interface BowlSummaryProps {
  blendState: BlendState;
  ingredients: Ingredient[];
  onClearBlend?: () => void;
  onCraftBlend?: () => void;
  isCrafting?: boolean;
}

export const BowlSummary: React.FC<BowlSummaryProps> = ({
  blendState,
  ingredients,
  onClearBlend,
  onCraftBlend,
  isCrafting = false,
}) => {
  const baseTea = blendState.baseTeaId
    ? ingredients.find(ing => ing.id === blendState.baseTeaId)
    : null;

  const addInsByCategory = blendState.addIns.reduce((acc, selectedIng) => {
    const ingredient = ingredients.find(ing => ing.id === selectedIng.ingredientId);
    if (ingredient) {
      if (!acc[ingredient.category]) {
        acc[ingredient.category] = [];
      }
      acc[ingredient.category].push({
        ingredient,
        quantity: selectedIng.quantity,
      });
    }
    return acc;
  }, {} as Record<IngredientCategory, Array<{ ingredient: Ingredient; quantity: number }>>);

  const hasSelections = baseTea || blendState.addIns.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-purple-900">Your Blend</h3>
        {hasSelections && onClearBlend && (
          <button
            onClick={onClearBlend}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            aria-label="Clear blend"
          >
            Clear
          </button>
        )}
      </div>

      {!hasSelections ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-3">🫙</div>
          <p className="text-gray-500 text-sm">
            Select ingredients to start crafting
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Base Tea */}
          {baseTea && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Base
              </h4>
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{baseTea.emoji}</span>
                  <div>
                    <div className="font-medium text-emerald-900">{baseTea.name}</div>
                    <div className="text-xs text-emerald-700">{baseTea.description}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add-ins by Category */}
          {Object.entries(addInsByCategory).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                {category}
              </h4>
              <div className="space-y-2">
                {items.map(({ ingredient, quantity }) => (
                  <div
                    key={ingredient.id}
                    className="bg-gray-50 rounded-lg p-2 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xl">{ingredient.emoji}</span>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{ingredient.name}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-purple-600">
                      {quantity}g
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Summary Stats */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Add-ins:</span>
              <span className="font-semibold">{blendState.addIns.length}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Total Weight:</span>
              <span className="font-semibold">
                {blendState.addIns.reduce((sum, ing) => sum + ing.quantity, 0)}g
              </span>
            </div>
          </div>

          {/* Craft Button */}
          {baseTea && (
            <button 
              onClick={onCraftBlend}
              disabled={isCrafting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isCrafting ? '✨ Adding to Cart...' : '✨ Craft This Blend'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
