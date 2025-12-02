/**
 * useFlavorProfile Hook
 * 
 * Aggregates flavor profiles from selected ingredients and derives blend status
 */

'use client';

import { useMemo } from 'react';
import type { ExtendedBlendState, FlavorProfile, BlendStatus } from './types';
import { getBlendingIngredientById } from './mockData';

/**
 * Flavor profile keys as a constant array for type-safe iteration
 * Note: caffeine is excluded as it is handled independently from flavor choices
 */
const FLAVOR_KEYS: readonly (keyof Omit<FlavorProfile, 'caffeine'>)[] = [
  'floral',
  'citrus',
  'earthy',
  'sweet',
] as const;

/**
 * Empty/default flavor profile
 */
const EMPTY_PROFILE: FlavorProfile = {
  floral: 0,
  citrus: 0,
  earthy: 0,
  sweet: 0,
  caffeine: 0,
};

/**
 * Helper function to add weighted flavor profile contribution
 * Note: caffeine is handled separately and not weighted
 */
function addWeightedProfile(
  target: FlavorProfile,
  source: FlavorProfile,
  weight: number
): void {
  for (const key of FLAVOR_KEYS) {
    target[key] += source[key] * weight;
  }
}

/**
 * Helper function to divide all profile values by a weight
 * Note: caffeine is handled separately and not divided
 */
function divideProfile(target: FlavorProfile, divisor: number): void {
  for (const key of FLAVOR_KEYS) {
    target[key] = target[key] / divisor;
  }
}

/**
 * Normalize a flavor profile to 0-100 scale
 * Note: caffeine is kept independent and only clamped, not scaled with other flavors
 */
function normalizeProfile(profile: FlavorProfile): FlavorProfile {
  // Only consider flavor values (not caffeine) when determining scale
  const max = Math.max(
    profile.floral,
    profile.citrus,
    profile.earthy,
    profile.sweet,
    1 // Prevent division by zero
  );

  // Caffeine is clamped independently (0-100)
  const caffeine = Math.min(100, Math.max(0, profile.caffeine));

  // If the max flavor is already under 100, just return the profile clamped
  if (max <= 100) {
    return {
      floral: Math.min(100, Math.max(0, profile.floral)),
      citrus: Math.min(100, Math.max(0, profile.citrus)),
      earthy: Math.min(100, Math.max(0, profile.earthy)),
      sweet: Math.min(100, Math.max(0, profile.sweet)),
      caffeine,
    };
  }

  // Scale down flavors to fit within 0-100, caffeine stays independent
  const scale = 100 / max;
  return {
    floral: Math.round(profile.floral * scale),
    citrus: Math.round(profile.citrus * scale),
    earthy: Math.round(profile.earthy * scale),
    sweet: Math.round(profile.sweet * scale),
    caffeine,
  };
}

/**
 * Derive blend status text from flavor profile
 */
function deriveBlendStatus(profile: FlavorProfile): BlendStatus {
  const { floral, citrus, earthy, sweet, caffeine } = profile;

  // Check for specific combinations
  if (floral > 50 && citrus > 40) {
    return { label: 'Bright & Floral', description: 'A vibrant blend with garden freshness' };
  }
  if (caffeine > 60 && earthy > 40) {
    return { label: 'Bold & Energizing', description: 'A powerful morning pick-me-up' };
  }
  if (sweet > 60 && floral > 30) {
    return { label: 'Sweet & Delicate', description: 'A gentle, honeyed infusion' };
  }
  if (earthy > 60) {
    return { label: 'Grounded & Robust', description: 'A rich, full-bodied experience' };
  }
  if (citrus > 60) {
    return { label: 'Citrus Forward', description: 'Zesty and refreshing' };
  }
  if (floral > 60) {
    return { label: 'Floral Fantasy', description: 'A garden in your cup' };
  }
  if (sweet > 60) {
    return { label: 'Sweet Indulgence', description: 'A dessert-like treat' };
  }
  if (caffeine > 50) {
    return { label: 'Energizing', description: 'A caffeinated boost' };
  }

  // Default balanced status
  return { label: 'Balanced', description: 'A harmonious blend of flavors' };
}

/**
 * Hook for calculating aggregated flavor profile and blend status
 * Note: Caffeine is calculated independently from flavor profiles.
 *       It comes directly from the base tea and does not change with add-ins.
 */
export function useFlavorProfile(blendState: ExtendedBlendState): {
  profile: FlavorProfile;
  normalizedProfile: FlavorProfile;
  status: BlendStatus;
} {
  return useMemo(() => {
    // Start with empty profile
    const aggregated: FlavorProfile = { ...EMPTY_PROFILE };
    let totalWeight = 0;

    // Get caffeine directly from base tea (caffeine is independent of blend composition)
    if (blendState.baseTeaId) {
      const base = getBlendingIngredientById(blendState.baseTeaId);
      if (base?.flavorProfile) {
        // Caffeine comes directly from the base tea
        aggregated.caffeine = base.flavorProfile.caffeine;
        
        // Add base tea flavor contribution (60% of blend typically)
        const baseWeight = blendState.size * 0.6;
        totalWeight += baseWeight;
        addWeightedProfile(aggregated, base.flavorProfile, baseWeight);
      }
    }

    // Add add-ins contribution (only flavors, not caffeine)
    for (const addIn of blendState.addIns) {
      const ingredient = getBlendingIngredientById(addIn.ingredientId);
      if (ingredient?.flavorProfile) {
        const weight = addIn.quantity;
        totalWeight += weight;
        addWeightedProfile(aggregated, ingredient.flavorProfile, weight);
      }
    }

    // Calculate weighted average for flavors only
    if (totalWeight > 0) {
      divideProfile(aggregated, totalWeight);
    }

    const normalizedProfile = normalizeProfile(aggregated);
    const status = deriveBlendStatus(normalizedProfile);

    return {
      profile: aggregated,
      normalizedProfile,
      status,
    };
  }, [blendState.baseTeaId, blendState.addIns, blendState.size]);
}

/**
 * Default status when no blend is configured
 */
export const DEFAULT_STATUS: BlendStatus = {
  label: 'Start Creating',
  description: 'Select a base and add ingredients',
};
