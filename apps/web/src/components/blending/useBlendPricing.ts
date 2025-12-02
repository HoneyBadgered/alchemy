/**
 * useBlendPricing Hook
 * 
 * Calculates the price of a blend based on ingredients and size
 */

'use client';

import { useMemo } from 'react';
import type { ExtendedBlendState, PricingResult, PriceTier } from './types';
import { getBlendingIngredientById } from './mockData';

/**
 * Pricing constants
 */
const PACKAGING_OVERHEAD = 2.50;
const TARGET_MARGIN = 0.70; // 70% margin

/**
 * Price tier thresholds
 */
const PRICE_TIERS: Array<{ max: number; tier: PriceTier }> = [
  { max: 20, tier: 'core' },
  { max: 35, tier: 'premium' },
  { max: Infinity, tier: 'ultra' },
];

/**
 * Round price to nearest whole dollar
 */
function roundToNearestDollar(price: number): number {
  return Math.round(price);
}

/**
 * Get price tier based on price
 */
function getPriceTier(price: number): PriceTier {
  for (const { max, tier } of PRICE_TIERS) {
    if (price <= max) {
      return tier;
    }
  }
  return 'ultra';
}

/**
 * Hook for calculating blend pricing
 */
export function useBlendPricing(blendState: ExtendedBlendState): PricingResult {
  return useMemo(() => {
    let ingredientCost = 0;

    // Get base tea cost
    if (blendState.baseTeaId) {
      const base = getBlendingIngredientById(blendState.baseTeaId);
      if (base) {
        // Base tea is the foundation - use 60% of the blend size
        const baseWeightOz = blendState.size * 0.6;
        ingredientCost += baseWeightOz * base.costPerOz;
      }
    }

    // Get add-ins cost
    for (const addIn of blendState.addIns) {
      const ingredient = getBlendingIngredientById(addIn.ingredientId);
      if (ingredient) {
        // Add-in quantity is in oz (from the UI)
        ingredientCost += addIn.quantity * ingredient.costPerOz;
      }
    }

    // Calculate raw cost and display price
    const rawCost = ingredientCost + PACKAGING_OVERHEAD;
    const calculatedPrice = rawCost / (1 - TARGET_MARGIN);
    const displayPrice = roundToNearestDollar(calculatedPrice);
    const tier = getPriceTier(displayPrice);

    return {
      price: displayPrice,
      tier,
      ingredientCost,
      packagingOverhead: PACKAGING_OVERHEAD,
      rawCost,
    };
  }, [blendState.baseTeaId, blendState.addIns, blendState.size]);
}

/**
 * Default pricing result when no blend is configured
 */
export const DEFAULT_PRICING: PricingResult = {
  price: 0,
  tier: 'core',
  ingredientCost: 0,
  packagingOverhead: PACKAGING_OVERHEAD,
  rawCost: PACKAGING_OVERHEAD,
};
