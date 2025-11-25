/**
 * Tests for useBlendState hook
 */

import { renderHook, act } from '@testing-library/react';
import { useBlendState } from '../useBlendState';

describe('useBlendState', () => {
  it('should initialize with empty blend state', () => {
    const { result } = renderHook(() => useBlendState());

    expect(result.current.blendState).toEqual({
      baseTeaId: undefined,
      addIns: [],
    });
  });

  it('should initialize with provided initial state', () => {
    const initialState = {
      baseTeaId: 'green-tea',
      addIns: [{ ingredientId: 'lavender', quantity: 10 }],
    };

    const { result } = renderHook(() => useBlendState(initialState));

    expect(result.current.blendState).toEqual(initialState);
  });

  it('should select a base tea', () => {
    const { result } = renderHook(() => useBlendState());

    act(() => {
      result.current.selectBase('green-tea');
    });

    expect(result.current.blendState.baseTeaId).toBe('green-tea');
  });

  it('should replace existing base tea when selecting a new one', () => {
    const { result } = renderHook(() => useBlendState());

    act(() => {
      result.current.selectBase('green-tea');
    });

    expect(result.current.blendState.baseTeaId).toBe('green-tea');

    act(() => {
      result.current.selectBase('black-tea');
    });

    expect(result.current.blendState.baseTeaId).toBe('black-tea');
  });

  it('should toggle add-in on with its configured base amount', () => {
    const { result } = renderHook(() => useBlendState());

    act(() => {
      result.current.toggleAddIn('lavender');
    });

    expect(result.current.blendState.addIns).toHaveLength(1);
    // Lavender has baseAmount of 2 defined in INGREDIENTS
    expect(result.current.blendState.addIns[0]).toEqual({
      ingredientId: 'lavender',
      quantity: 2,
    });
  });

  it('should toggle add-in off', () => {
    const { result } = renderHook(() => useBlendState());

    act(() => {
      result.current.toggleAddIn('lavender');
    });

    expect(result.current.blendState.addIns).toHaveLength(1);

    act(() => {
      result.current.toggleAddIn('lavender');
    });

    expect(result.current.blendState.addIns).toHaveLength(0);
  });

  it('should update add-in quantity', () => {
    const { result } = renderHook(() => useBlendState());

    act(() => {
      result.current.toggleAddIn('lavender');
    });

    act(() => {
      result.current.updateAddInQuantity('lavender', 15);
    });

    expect(result.current.blendState.addIns[0].quantity).toBe(15);
  });

  it('should not update quantity for non-existent add-in', () => {
    const { result } = renderHook(() => useBlendState());

    act(() => {
      result.current.updateAddInQuantity('lavender', 15);
    });

    expect(result.current.blendState.addIns).toHaveLength(0);
  });

  it('should clear entire blend', () => {
    const { result } = renderHook(() => useBlendState());

    act(() => {
      result.current.selectBase('green-tea');
      result.current.toggleAddIn('lavender');
      result.current.toggleAddIn('chamomile');
    });

    expect(result.current.blendState.baseTeaId).toBe('green-tea');
    expect(result.current.blendState.addIns).toHaveLength(2);

    act(() => {
      result.current.clearBlend();
    });

    expect(result.current.blendState.baseTeaId).toBeUndefined();
    expect(result.current.blendState.addIns).toHaveLength(0);
  });

  it('should get add-in quantity', () => {
    const { result } = renderHook(() => useBlendState());

    act(() => {
      result.current.toggleAddIn('lavender');
      result.current.updateAddInQuantity('lavender', 20);
    });

    expect(result.current.getAddInQuantity('lavender')).toBe(20);
  });

  it('should return ingredient base amount for non-selected add-in', () => {
    const { result } = renderHook(() => useBlendState());

    // Lavender has baseAmount of 2 defined in INGREDIENTS
    expect(result.current.getAddInQuantity('lavender')).toBe(2);
  });

  it('should handle multiple add-ins with their respective base amounts', () => {
    const { result } = renderHook(() => useBlendState());

    act(() => {
      result.current.toggleAddIn('lavender');    // baseAmount: 2
      result.current.toggleAddIn('chamomile');   // baseAmount: 3
      result.current.toggleAddIn('mint');        // baseAmount: 2
    });

    expect(result.current.blendState.addIns).toHaveLength(3);
    expect(result.current.blendState.addIns.map(a => a.ingredientId)).toEqual([
      'lavender',
      'chamomile',
      'mint',
    ]);
    
    // Each add-in should have its configured base amount
    expect(result.current.blendState.addIns[0].quantity).toBe(2); // lavender
    expect(result.current.blendState.addIns[1].quantity).toBe(3); // chamomile
    expect(result.current.blendState.addIns[2].quantity).toBe(2); // mint
  });
});
