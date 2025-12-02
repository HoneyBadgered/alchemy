/**
 * Tests for useBlendPricing hook
 */

import { renderHook } from '@testing-library/react';
import { useBlendPricing } from '../useBlendPricing';
import type { ExtendedBlendState } from '../types';

describe('useBlendPricing', () => {
  const emptyBlendState: ExtendedBlendState = {
    baseTeaId: undefined,
    addIns: [],
    blendName: '',
    size: 2,
  };

  it('should return default pricing when no ingredients are selected', () => {
    const { result } = renderHook(() => useBlendPricing(emptyBlendState));
    
    expect(result.current.price).toBeGreaterThanOrEqual(0);
    expect(result.current.tier).toBe('core');
  });

  it('should calculate pricing with base tea selected', () => {
    const blendState: ExtendedBlendState = {
      baseTeaId: 'moonlit-black',
      addIns: [],
      blendName: 'Test Blend',
      size: 2,
    };

    const { result } = renderHook(() => useBlendPricing(blendState));
    
    expect(result.current.price).toBeGreaterThan(0);
    expect(result.current.ingredientCost).toBeGreaterThan(0);
  });

  it('should increase price when add-ins are added', () => {
    const baseOnlyState: ExtendedBlendState = {
      baseTeaId: 'moonlit-black',
      addIns: [],
      blendName: 'Test Blend',
      size: 2,
    };

    const withAddInsState: ExtendedBlendState = {
      baseTeaId: 'moonlit-black',
      addIns: [
        { ingredientId: 'rose-petals', quantity: 0.5 },
        { ingredientId: 'vanilla-bean', quantity: 0.25 },
      ],
      blendName: 'Test Blend',
      size: 2,
    };

    const { result: baseOnly } = renderHook(() => useBlendPricing(baseOnlyState));
    const { result: withAddIns } = renderHook(() => useBlendPricing(withAddInsState));
    
    expect(withAddIns.current.price).toBeGreaterThan(baseOnly.current.price);
  });

  it('should scale price with blend size', () => {
    const smallBlend: ExtendedBlendState = {
      baseTeaId: 'moonlit-black',
      addIns: [],
      blendName: 'Small Blend',
      size: 1,
    };

    const largeBlend: ExtendedBlendState = {
      baseTeaId: 'moonlit-black',
      addIns: [],
      blendName: 'Large Blend',
      size: 4,
    };

    const { result: small } = renderHook(() => useBlendPricing(smallBlend));
    const { result: large } = renderHook(() => useBlendPricing(largeBlend));
    
    expect(large.current.ingredientCost).toBeGreaterThan(small.current.ingredientCost);
  });

  it('should return tier based on price', () => {
    const premiumBlend: ExtendedBlendState = {
      baseTeaId: 'silver-needle-white', // Premium base
      addIns: [
        { ingredientId: 'edible-gold-flakes', quantity: 0.5 }, // Very expensive add-in
      ],
      blendName: 'Premium Blend',
      size: 4,
    };

    const { result } = renderHook(() => useBlendPricing(premiumBlend));
    
    // Should be premium or ultra tier based on expensive ingredients
    expect(['premium', 'ultra']).toContain(result.current.tier);
  });
});
