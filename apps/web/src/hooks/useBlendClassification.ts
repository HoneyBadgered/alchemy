/**
 * Hook for calculating blend classification based on composition
 */

'use client';

import { useMemo } from 'react';
import type { ExtendedBlendState, BlendClassification } from '../components/blending/types';
import type { BlendingIngredient } from '../components/blending/mockData';
import { getIngredientById } from './useIngredients';

/**
 * Emoji mapping for blend classifications
 */
const CLASSIFICATION_EMOJI: Record<string, string> = {
  'Tea Forward': '🍵',
  'Balanced': '⚖️',
  'Botanical Forward': '🌿',
  'Floral Forward': '🌸',
  'Very Floral': '🌺',
  'Floral Accent': '🌸',
  'Spicy': '🔥',
  'Very Spicy': '🌶️',
  'Chai-Style': '🫖',
  'Fruity': '🍊',
  'Very Fruity': '🍓',
  'Smoky': '🔥',
  'Very Smoky': '💨',
  'Minty': '🌿',
  'Very Minty': '❄️',
  'Herbal': '🌿',
  'Very Herbal': '🌿',
  'Balanced Blend': '⚖️',
};

/**
 * Calculate blend classification based on composition
 */
export function calculateBlendClassification(
  blendState: ExtendedBlendState,
  bases: BlendingIngredient[],
  addInsData: {
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  }
): BlendClassification {
  // Default state when no ingredients selected
  if (!blendState.baseTeaId || blendState.addIns.length === 0) {
    return {
      label: 'Select ingredients to begin',
      description: 'Choose a base tea and add your ingredients to see your blend character.',
      emoji: '✨',
      baseTeaPercentage: 0,
      addInsPercentage: 0,
    };
  }

  // Calculate weights
  const totalAddInsWeight = blendState.addIns.reduce((sum, a) => sum + a.quantity, 0);
  const totalBlendWeight = blendState.size;
  const baseTeaWeight = totalBlendWeight - totalAddInsWeight;
  
  const baseTeaPercentage = (baseTeaWeight / totalBlendWeight) * 100;
  const addInsPercentage = (totalAddInsWeight / totalBlendWeight) * 100;

  // Check if blend violates 40% minimum base tea
  if (baseTeaPercentage < 40) {
    return {
      label: 'Too many add-ins',
      description: 'Base tea must be at least 40% of the blend. Remove some ingredients.',
      emoji: '⚠️',
      baseTeaPercentage,
      addInsPercentage,
    };
  }

  // Group add-ins by category
  const categoryWeights: Record<string, number> = {};
  for (const addIn of blendState.addIns) {
    const ingredient = getIngredientById(addIn.ingredientId, bases, addInsData);
    if (ingredient) {
      const category = ingredient.category || 'other';
      categoryWeights[category] = (categoryWeights[category] || 0) + addIn.quantity;
    }
  }

  // Find dominant category (>25% of add-ins)
  let dominantCategory: string | undefined;
  let dominantWeight = 0;
  for (const [category, weight] of Object.entries(categoryWeights)) {
    if (weight > dominantWeight && (weight / totalAddInsWeight) > 0.25) {
      dominantCategory = category;
      dominantWeight = weight;
    }
  }

  // Check if any single add-in dominates
  const maxSingleIngredient = Math.max(...blendState.addIns.map(a => a.quantity));
  const dominancePercentage = (maxSingleIngredient / totalBlendWeight) * 100;
  const intensity: 'moderate' | 'very' | undefined = 
    dominancePercentage > 20 ? 'very' : 
    dominancePercentage > 10 ? 'moderate' : 
    undefined;

  // Determine classification by base tea percentage
  let baseClassification: string;
  if (baseTeaPercentage >= 70) {
    baseClassification = 'Tea Forward';
  } else if (baseTeaPercentage >= 55) {
    baseClassification = 'Balanced';
  } else {
    baseClassification = 'Botanical Forward';
  }

  // Build final classification
  let label: string;
  let description: string;

  if (dominantCategory && dominantWeight > 0) {
    // Category-based classification
    const categoryName = dominantCategory.charAt(0).toUpperCase() + dominantCategory.slice(1);
    
    if (intensity === 'very') {
      label = `Very ${categoryName}`;
      description = `Your blend features bold ${dominantCategory} notes that take center stage.`;
    } else if (baseTeaPercentage >= 60) {
      label = `${categoryName} Accent`;
      description = `A tea-forward blend with subtle ${dominantCategory} undertones.`;
    } else {
      label = `${categoryName} Forward`;
      description = `Your blend showcases ${dominantCategory} character with balanced tea presence.`;
    }
  } else {
    // Base tea percentage classification
    label = baseClassification;
    if (baseClassification === 'Tea Forward') {
      description = 'A classic tea blend where the base tea character shines through.';
    } else if (baseClassification === 'Balanced') {
      description = 'A harmonious blend balancing tea and botanicals perfectly.';
    } else {
      description = 'A botanical-rich blend with diverse flavor notes.';
    }
  }

  // Special case for chai-style blends
  if (categoryWeights['spice'] && (categoryWeights['spice'] / totalAddInsWeight) > 0.5) {
    label = 'Chai-Style';
    description = 'A warming spice blend reminiscent of traditional chai.';
  }

  // Get emoji
  const emoji = CLASSIFICATION_EMOJI[label] || '✨';

  return {
    label,
    description,
    emoji,
    baseTeaPercentage,
    addInsPercentage,
    dominantCategory,
    intensity,
  };
}

/**
 * Hook to get blend classification with memoization
 */
export function useBlendClassification(
  blendState: ExtendedBlendState,
  bases: BlendingIngredient[],
  addInsData: {
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  }
): BlendClassification {
  return useMemo(() => {
    return calculateBlendClassification(blendState, bases, addInsData);
  }, [blendState.baseTeaId, blendState.addIns, blendState.size, bases, addInsData]);
}
