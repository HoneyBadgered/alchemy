/**
 * Slider Value Mapping Utilities
 * 
 * Maps between slider positions (0-4) and actual gram quantities
 * based on ingredient recommendedUsageMin/Max or fallback defaults.
 */

import type { Ingredient } from '@alchemy/core';

// Default usage ranges in grams if not specified in ingredient
const DEFAULT_MIN_GRAMS = 0;
const DEFAULT_MAX_GRAMS = 10;

// Fallback for ingredients without recommended usage
const CATEGORY_DEFAULTS: Record<string, { min: number; max: number }> = {
  spice: { min: 0.5, max: 5 },
  floral: { min: 1, max: 8 },
  fruit: { min: 2, max: 10 },
  herb: { min: 1, max: 8 },
  herbal: { min: 1, max: 8 },
  special: { min: 0.25, max: 2 }, // Essences/extracts
  sweetener: { min: 1, max: 8 },
};

/**
 * Get the gram range for an ingredient based on blend size
 */
export function getIngredientGramRange(
  ingredient: Ingredient,
  blendSizeOz: number = 2
): { min: number; max: number } {
  const totalGrams = blendSizeOz * 28; // 1oz ≈ 28g

  // If ingredient has explicit recommendedUsageMin/Max (as percentages)
  if (ingredient.recommendedUsageMin != null && ingredient.recommendedUsageMax != null) {
    return {
      min: (totalGrams * ingredient.recommendedUsageMin) / 100,
      max: (totalGrams * ingredient.recommendedUsageMax) / 100,
    };
  }

  // Fallback to category defaults
  const categoryDefault = CATEGORY_DEFAULTS[ingredient.category?.toLowerCase() || ''];
  if (categoryDefault) {
    return categoryDefault;
  }

  // Ultimate fallback
  return {
    min: DEFAULT_MIN_GRAMS,
    max: DEFAULT_MAX_GRAMS,
  };
}

/**
 * Map slider position (0-4) to gram quantity
 * 
 * Position 0 = 0 grams (None)
 * Position 1-4 = Evenly distributed between min and max
 */
export function sliderToGrams(
  sliderValue: number,
  ingredient: Ingredient,
  blendSizeOz: number = 2
): number {
  if (sliderValue === 0) return 0;

  const { min, max } = getIngredientGramRange(ingredient, blendSizeOz);
  
  // Map positions 1-4 to min-max range
  // Position 1 = min, Position 4 = max
  const step = (max - min) / 3; // 3 steps between positions 1-4
  const grams = min + (sliderValue - 1) * step;
  
  // Round to 2 decimal places
  return Math.round(grams * 100) / 100;
}

/**
 * Map gram quantity to nearest slider position (0-4)
 * Used when loading existing blends for editing
 */
export function gramsToSlider(
  grams: number,
  ingredient: Ingredient,
  blendSizeOz: number = 2
): number {
  if (grams === 0 || grams < 0.25) return 0;

  const { min, max } = getIngredientGramRange(ingredient, blendSizeOz);
  
  // If below min, return position 1 (Hint/Whisper/etc)
  if (grams <= min) return 1;
  
  // If above max, return position 4 (Dominant/Forward/etc)
  if (grams >= max) return 4;
  
  // Map to positions 1-4 based on where it falls in the range
  const step = (max - min) / 3;
  const position = Math.round((grams - min) / step) + 1;
  
  return Math.max(1, Math.min(4, position));
}

/**
 * Get a human-readable description of the gram amount for an ingredient
 * (for debugging/admin purposes only - not shown to users)
 */
export function getQuantityLabel(sliderValue: number): string {
  const labels = ['None', 'Light', 'Moderate', 'Strong', 'Intense'];
  return labels[sliderValue] || 'Unknown';
}
