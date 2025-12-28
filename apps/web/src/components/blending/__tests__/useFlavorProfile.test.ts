/**
 * Tests for useFlavorProfile hook
 */

import { renderHook } from '@testing-library/react';
import { useFlavorProfile } from '../useFlavorProfile';
import type { ExtendedBlendState } from '../types';
import { vi, beforeEach } from 'vitest';
import * as useIngredientsHook from '@/hooks/useIngredients';

// Mock data
const mockBases = [
  {
    id: 'moonlit-black',
    name: 'Moonlit Black',
    category: 'base' as const,
    
    baseAmount: 10,
    incrementAmount: 5,
    costPerOz: 3,
    description: 'Bold black tea',
    shortTags: ['Black', 'Medium Caffeine'],
    emoji: '🌙',
    tier: 'standard' as const,
    caffeineLevel: 'medium' as const,
    flavorProfile: { earthy: 8, floral: 1, spicy: 0, sweet: 2, citrus: 0, caffeine: 70 },
  },
  {
    id: 'herbal-rooibos',
    name: 'Herbal Rooibos',
    category: 'base' as const,
    
    baseAmount: 10,
    incrementAmount: 5,
    costPerOz: 2,
    description: 'Caffeine-free rooibos',
    shortTags: ['Herbal', 'No Caffeine'],
    emoji: '🌿',
    tier: 'standard' as const,
    caffeineLevel: 'none' as const,
    flavorProfile: { earthy: 5, floral: 1, spicy: 0, sweet: 6, citrus: 0, caffeine: 0 },
  },
];

const mockAddIns = [
  {
    id: 'rose-petals',
    name: 'Rose Petals',
    category: 'floral' as const,
    
    baseAmount: 2,
    incrementAmount: 1,
    costPerOz: 8,
    description: 'Fragrant rose petals',
    shortTags: ['Floral'],
    emoji: '🌹',
    tier: 'standard' as const,
    caffeineLevel: 'none' as const,
    flavorProfile: { earthy: 0, floral: 10, spicy: 0, sweet: 2, citrus: 0, caffeine: 0 },
  },
  {
    id: 'vanilla',
    name: 'Vanilla',
    category: 'addIn' as const,
    
    baseAmount: 2,
    incrementAmount: 1,
    costPerOz: 5,
    description: 'Sweet vanilla',
    shortTags: ['Sweet'],
    emoji: '🍦',
    tier: 'standard' as const,
    caffeineLevel: 'none' as const,
    flavorProfile: { earthy: 0, floral: 1, spicy: 0, sweet: 10, citrus: 0, caffeine: 0 },
  },
];

describe('useFlavorProfile', () => {
  beforeEach(() => {
    // Mock the useIngredients hook
    vi.spyOn(useIngredientsHook, 'useIngredients').mockReturnValue({
      bases: mockBases,
      addIns: {
        addIns: mockAddIns,
        botanicals: [],
        premium: [],
      },
      isLoading: false,
      error: null,
    });

    // Mock getIngredientById
    vi.spyOn(useIngredientsHook, 'getIngredientById').mockImplementation((id) => {
      return [...mockBases, ...mockAddIns].find(i => i.id === id);
    });
  });

  const emptyBlendState: ExtendedBlendState = {
    baseTeaId: undefined,
    addIns: [],
    blendName: '',
    size: 2,
  };

  it('should return empty profile when no ingredients are selected', () => {
    const { result } = renderHook(() => useFlavorProfile(emptyBlendState));
    
    expect(result.current.normalizedProfile.floral).toBe(0);
    expect(result.current.normalizedProfile.citrus).toBe(0);
    expect(result.current.normalizedProfile.earthy).toBe(0);
    expect(result.current.normalizedProfile.sweet).toBe(0);
    expect(result.current.normalizedProfile.caffeine).toBe(0);
  });

  it('should reflect base tea flavor profile', () => {
    const blendState: ExtendedBlendState = {
      baseTeaId: 'moonlit-black', // Earthy, medium caffeine
      addIns: [],
      blendName: 'Test Blend',
      size: 2,
    };

    const { result } = renderHook(() => useFlavorProfile(blendState));
    
    // Moonlit Black should have notable earthy and caffeine profiles
    expect(result.current.normalizedProfile.earthy).toBeGreaterThan(0);
    expect(result.current.normalizedProfile.caffeine).toBeGreaterThan(0);
  });

  it('should aggregate profiles from add-ins', () => {
    const blendState: ExtendedBlendState = {
      baseTeaId: 'moonlit-black',
      addIns: [
        { ingredientId: 'rose-petals', quantity: 0.5 }, // Highly floral
      ],
      blendName: 'Test Blend',
      size: 2,
    };

    const { result } = renderHook(() => useFlavorProfile(blendState));
    
    // Rose petals should contribute to floral profile
    expect(result.current.normalizedProfile.floral).toBeGreaterThan(0);
  });

  it('should derive appropriate status for floral blend', () => {
    const floralBlend: ExtendedBlendState = {
      baseTeaId: 'silver-needle-white', // Already somewhat floral
      addIns: [
        { ingredientId: 'jasmine-flowers', quantity: 1 },
        { ingredientId: 'rose-petals', quantity: 0.5 },
      ],
      blendName: 'Floral Garden',
      size: 2,
    };

    const { result } = renderHook(() => useFlavorProfile(floralBlend));
    
    // Should have a meaningful status
    expect(result.current.status.label.length).toBeGreaterThan(0);
    expect(result.current.status.description.length).toBeGreaterThan(0);
  });

  it('should normalize profile values to 0-100 range', () => {
    const blendState: ExtendedBlendState = {
      baseTeaId: 'moonlit-black',
      addIns: [
        { ingredientId: 'rose-petals', quantity: 0.5 },
        { ingredientId: 'vanilla-bean', quantity: 0.25 },
      ],
      blendName: 'Test Blend',
      size: 2,
    };

    const { result } = renderHook(() => useFlavorProfile(blendState));
    
    const { normalizedProfile } = result.current;
    expect(normalizedProfile.floral).toBeLessThanOrEqual(100);
    expect(normalizedProfile.citrus).toBeLessThanOrEqual(100);
    expect(normalizedProfile.earthy).toBeLessThanOrEqual(100);
    expect(normalizedProfile.sweet).toBeLessThanOrEqual(100);
    expect(normalizedProfile.caffeine).toBeLessThanOrEqual(100);
    
    expect(normalizedProfile.floral).toBeGreaterThanOrEqual(0);
    expect(normalizedProfile.citrus).toBeGreaterThanOrEqual(0);
    expect(normalizedProfile.earthy).toBeGreaterThanOrEqual(0);
    expect(normalizedProfile.sweet).toBeGreaterThanOrEqual(0);
    expect(normalizedProfile.caffeine).toBeGreaterThanOrEqual(0);
  });

  it('should keep caffeine independent from add-ins (caffeine does not change with blend composition)', () => {
    // Base tea only - Moonlit Black has caffeine: 70
    const baseOnlyState: ExtendedBlendState = {
      baseTeaId: 'moonlit-black',
      addIns: [],
      blendName: 'Test Blend',
      size: 2,
    };

    // Base tea with multiple add-ins (none of which have caffeine)
    const withAddInsState: ExtendedBlendState = {
      baseTeaId: 'moonlit-black',
      addIns: [
        { ingredientId: 'rose-petals', quantity: 1 },
        { ingredientId: 'lavender-buds', quantity: 1 },
        { ingredientId: 'vanilla-bean', quantity: 0.5 },
      ],
      blendName: 'Test Blend with Add-ins',
      size: 2,
    };

    const { result: baseOnlyResult } = renderHook(() => useFlavorProfile(baseOnlyState));
    const { result: withAddInsResult } = renderHook(() => useFlavorProfile(withAddInsState));

    // Caffeine should remain the same from the base tea regardless of add-ins
    expect(withAddInsResult.current.normalizedProfile.caffeine).toBe(
      baseOnlyResult.current.normalizedProfile.caffeine
    );
    
    // But flavor values should change (floral should increase with rose petals and lavender)
    expect(withAddInsResult.current.normalizedProfile.floral).not.toBe(
      baseOnlyResult.current.normalizedProfile.floral
    );
  });

  it('should use caffeine directly from base tea value', () => {
    // Moonlit Black has caffeine: 70
    const blackTeaBlend: ExtendedBlendState = {
      baseTeaId: 'moonlit-black',
      addIns: [],
      blendName: 'Black Tea',
      size: 2,
    };

    // Herbal Rooibos has caffeine: 0
    const herbalBlend: ExtendedBlendState = {
      baseTeaId: 'herbal-rooibos',
      addIns: [],
      blendName: 'Herbal',
      size: 2,
    };

    const { result: blackTeaResult } = renderHook(() => useFlavorProfile(blackTeaBlend));
    const { result: herbalResult } = renderHook(() => useFlavorProfile(herbalBlend));

    // Caffeine should come directly from the base tea
    expect(blackTeaResult.current.normalizedProfile.caffeine).toBe(70);
    expect(herbalResult.current.normalizedProfile.caffeine).toBe(0);
  });
});
