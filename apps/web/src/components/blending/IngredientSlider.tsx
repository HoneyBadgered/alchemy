/**
 * IngredientSlider Component
 * 
 * A descriptive slider that uses poetic language instead of technical measurements.
 * Shows 5 anchor points with category-specific labels that set expectations.
 */

'use client';

import React, { useMemo } from 'react';
import type { IngredientCategory } from '@alchemy/core';

interface SliderLabelSet {
  labels: [string, string, string, string, string];
  description: string;
}

// Label sets by category/role
const LABEL_SETS: Record<string, SliderLabelSet> = {
  // Default for most ingredients
  default: {
    labels: ['None', 'Hint', 'Balanced', 'Pronounced', 'Dominant'],
    description: 'Balanced = noticeable but not dominant',
  },
  
  // Botanicals / Florals / Herbs
  botanical: {
    labels: ['Absent', 'Whisper', 'Present', 'Expressive', 'Forward'],
    description: 'Present = clearly identifiable in the blend',
  },
  
  // Spices / Smoke / Strong Tea Accents
  spice: {
    labels: ['None', 'Trace', 'Measured', 'Strong', 'Assertive'],
    description: 'Measured = noticeable warmth without overpowering',
  },
  
  // Fruits & Citrus
  fruit: {
    labels: ['None', 'Aroma', 'Bright', 'Juicy', 'Fruit-Forward'],
    description: 'Bright = fresh and noticeable, juicy = full fruity presence',
  },
  
  // Essences / Extracts
  essence: {
    labels: ['None', 'Drop', 'Balanced', 'Concentrated', 'Intense'],
    description: 'A little goes a long way with extracts',
  },
};

// Category mapping to label sets
const CATEGORY_TO_LABEL_SET: Record<string, string> = {
  floral: 'botanical',
  herb: 'botanical',
  herbal: 'botanical',
  spice: 'spice',
  fruit: 'fruit',
  special: 'essence', // For extracts/essences
};

interface IngredientSliderProps {
  /** Current value (0-4) */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Ingredient category for label selection */
  category?: IngredientCategory | string;
  /** Ingredient role (base/addIn) */
  role?: string;
  /** Optional ingredient name for accessibility */
  name?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show helper text below slider */
  showHelper?: boolean;
}

export const IngredientSlider: React.FC<IngredientSliderProps> = ({
  value,
  onChange,
  category,
  role,
  name,
  disabled = false,
  showHelper = true,
}) => {
  // Select appropriate label set based on category
  const labelSet = useMemo(() => {
    if (!category) return LABEL_SETS.default;
    
    const mappedSet = CATEGORY_TO_LABEL_SET[category.toLowerCase()];
    return LABEL_SETS[mappedSet] || LABEL_SETS.default;
  }, [category]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    onChange(newValue);
  };

  const currentLabel = labelSet.labels[value] || labelSet.labels[2];

  return (
    <div className="w-full">
      {/* Slider Track with Anchor Points */}
      <div className="relative px-2">
        {/* Anchor point markers */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 pointer-events-none">
          {labelSet.labels.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === value
                  ? 'bg-purple-600 scale-150'
                  : index < value
                  ? 'bg-purple-400'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Range Input */}
        <input
          type="range"
          min="0"
          max="4"
          step="1"
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          aria-label={name ? `${name} intensity` : 'Ingredient intensity'}
          className="w-full h-2 bg-transparent appearance-none cursor-pointer relative z-10
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-6
                     [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-purple-600
                     [&::-webkit-slider-thumb]:shadow-lg
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:transition-all
                     [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-moz-range-thumb]:w-6
                     [&::-moz-range-thumb]:h-6
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-white
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-purple-600
                     [&::-moz-range-thumb]:shadow-lg
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:transition-all
                     [&::-moz-range-thumb]:hover:scale-110
                     disabled:opacity-50
                     disabled:cursor-not-allowed"
        />
      </div>

      {/* Current Label Display - Shows only the selected value */}
      <div className="mt-4 text-center">
        <div className="text-lg font-semibold text-purple-600 min-h-[28px]">
          {currentLabel}
        </div>
        {showHelper && (
          <div className="text-xs text-gray-500 mt-1">
            {labelSet.description}
          </div>
        )}
      </div>

      {/* Hidden clickable anchor points for accessibility */}
      <div className="sr-only">
        {labelSet.labels.map((label, index) => (
          <button
            key={index}
            onClick={() => !disabled && onChange(index)}
            disabled={disabled}
            aria-label={`Set to ${label}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
