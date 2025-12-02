/**
 * Tests for useFlavorProfile hook
 */

import { renderHook } from '@testing-library/react';
import { useFlavorProfile } from '../useFlavorProfile';
import type { ExtendedBlendState } from '../types';

describe('useFlavorProfile', () => {
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
});
