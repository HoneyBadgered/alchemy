/**
 * IngredientListItem Component
 * 
 * Individual ingredient row with selection and quantity controls
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Ingredient, getIngredientBaseAmount, getIngredientIncrementAmount } from '@alchemy/core';
import { formatQuantity } from '../../lib/format';

interface IngredientListItemProps {
  ingredient: Ingredient;
  isSelected: boolean;
  quantity?: number;
  onSelect: (ingredientId: string) => void;
  onQuantityChange?: (ingredientId: string, quantity: number) => void;
  mode: 'single' | 'multi';
  /** Current blend size in ounces (required for percentage-based sliders) */
  blendSize?: number;
  /** Maximum allowed quantity based on add-ins budget */
  maxAllowedQuantity?: number;
}

export const IngredientListItem: React.FC<IngredientListItemProps> = ({
  ingredient,
  isSelected,
  quantity,
  onSelect,
  onQuantityChange,
  mode,
  blendSize = 2, // Default to 2oz for backwards compatibility
  maxAllowedQuantity,
}) => {
  // Get ingredient-specific amounts with fallbacks
  const baseAmount = getIngredientBaseAmount(ingredient);
  const incrementAmount = getIngredientIncrementAmount(ingredient);
  
  // Use provided quantity or fall back to the ingredient's base amount
  const initialQuantity = quantity ?? baseAmount;
  const [localQuantity, setLocalQuantity] = useState(initialQuantity);

  // Sync local quantity when the prop changes
  useEffect(() => {
    if (quantity !== undefined) {
      setLocalQuantity(quantity);
    }
  }, [quantity]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseFloat(e.target.value);
    setLocalQuantity(newQuantity);
    if (onQuantityChange) {
      onQuantityChange(ingredient.id, newQuantity);
    }
  };

  // Calculate slider constraints based on ingredient configuration
  const calculateSliderRange = () => {
    // Use percentage-based ranges if available
    if (ingredient.recommendedUsageMin !== undefined && 
        ingredient.recommendedUsageMax !== undefined &&
        ingredient.recommendedUsageMin !== null &&
        ingredient.recommendedUsageMax !== null) {
      const minOz = (blendSize * Number(ingredient.recommendedUsageMin)) / 100;
      const maxOz = (blendSize * Number(ingredient.recommendedUsageMax)) / 100;
      
      // Respect add-ins budget if provided
      const effectiveMax = maxAllowedQuantity 
        ? Math.min(maxOz, maxAllowedQuantity) 
        : maxOz;
      
      return { 
        min: Math.max(0.1, minOz), // At least 0.1oz
        max: Math.max(0.1, effectiveMax), 
        step: 0.1 
      };
    }
    
    // Fallback to old system using baseAmount
    const minValue = Math.min(incrementAmount, baseAmount);
    const maxValue = Math.max(baseAmount * 10, 50); // At least 10x base amount or 50g
    
    // Respect add-ins budget if provided
    const effectiveMax = maxAllowedQuantity
      ? Math.min(maxValue, maxAllowedQuantity)
      : maxValue;
    
    return {
      min: minValue,
      max: effectiveMax,
      step: incrementAmount,
    };
  };

  const sliderRange = calculateSliderRange();
  
  // Calculate percentage for display
  const percentage = ((localQuantity / blendSize) * 100).toFixed(1);

  return (
    <div
      className={`
        rounded-lg transition-all border-2
        ${isSelected 
          ? 'bg-purple-50 border-purple-400' 
          : 'bg-white border-gray-200 hover:border-gray-300'
        }
      `}
    >
      <button
        onClick={() => onSelect(ingredient.id)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        {/* Selection Indicator */}
        <div className="flex-shrink-0">
          {mode === 'single' ? (
            <div
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${isSelected
                  ? 'border-purple-600 bg-purple-600'
                  : 'border-gray-300'
                }
              `}
            >
              {isSelected && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          ) : (
            <div
              className={`
                w-5 h-5 rounded border-2 flex items-center justify-center
                ${isSelected
                  ? 'border-purple-600 bg-purple-600'
                  : 'border-gray-300'
                }
              `}
            >
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
          )}
        </div>

        {/* Emoji */}
        <div className="text-3xl flex-shrink-0">
          {ingredient.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            {ingredient.name}
            {ingredient.badges?.map(badge => (
              <span
                key={badge}
                className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium"
              >
                {badge}
              </span>
            ))}
          </div>
          {ingredient.description && (
            <div className="text-sm text-gray-600 mt-0.5">
              {ingredient.description}
            </div>
          )}
          {ingredient.tags && ingredient.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {ingredient.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Quantity Controls (Multi-select only) */}
      {mode === 'multi' && isSelected && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-white rounded-lg border border-purple-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Quantity:</span>
              <span className="font-bold text-purple-900">
                {formatQuantity(localQuantity)}oz ({percentage}%)
              </span>
            </div>
            <input
              type="range"
              min={sliderRange.min}
              max={sliderRange.max}
              step={sliderRange.step}
              value={localQuantity}
              onChange={handleSliderChange}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
              aria-label={`Adjust quantity for ${ingredient.name}`}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{sliderRange.min.toFixed(1)}oz</span>
              <span>{sliderRange.max.toFixed(1)}oz</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
