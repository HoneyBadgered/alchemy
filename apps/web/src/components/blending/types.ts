/**
 * Types for the blending page components
 */

import type { Ingredient } from '@alchemy/core';

/**
 * Size options for blend (in ounces)
 */
export type BlendSize = 1 | 2 | 4;

/**
 * Tier of blend based on price
 */
export type PriceTier = 'core' | 'premium' | 'ultra';

/**
 * Ingredient tier for pricing
 */
export type IngredientTier = 'standard' | 'premium';

/**
 * Flavor profile dimensions
 */
export interface FlavorProfile {
  floral: number;
  citrus: number;
  earthy: number;
  sweet: number;
  caffeine: number;
}

/**
 * Extended blend state for the new blending page
 */
export interface ExtendedBlendState {
  baseTeaId?: string;
  addIns: Array<{ ingredientId: string; quantity: number }>;
  blendName: string;
  size: BlendSize;
}

/**
 * Add-in category type for the right column tabs
 */
export type AddInCategoryTab = 'addIns' | 'botanicals' | 'premium';

/**
 * Pricing result from useBlendPricing
 */
export interface PricingResult {
  price: number;
  tier: PriceTier;
  ingredientCost: number;
  packagingOverhead: number;
  rawCost: number;
}

/**
 * Blend breakdown item for display
 */
export interface BlendBreakdownItem {
  ingredient: Ingredient;
  weightOz: number;
  percentage: number;
}

/**
 * Blend status for the bottom bar
 */
export interface BlendStatus {
  label: string;
  description: string;
}
