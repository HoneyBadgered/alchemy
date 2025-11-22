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

  it('should toggle add-in on', () => {
    const { result } = renderHook(() => useBlendState());

    act(() => {
      result.current.toggleAddIn('lavender');
    });

    expect(result.current.blendState.addIns).toHaveLength(1);
    expect(result.current.blendState.addIns[0]).toEqual({
      ingredientId: 'lavender',
      quantity: 5,
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

  it('should return default quantity for non-existent add-in', () => {
    const { result } = renderHook(() => useBlendState());

    expect(result.current.getAddInQuantity('lavender')).toBe(5);
  });

  it('should handle multiple add-ins', () => {
    const { result } = renderHook(() => useBlendState());

    act(() => {
      result.current.toggleAddIn('lavender');
      result.current.toggleAddIn('chamomile');
      result.current.toggleAddIn('mint');
    });

    expect(result.current.blendState.addIns).toHaveLength(3);
    expect(result.current.blendState.addIns.map(a => a.ingredientId)).toEqual([
      'lavender',
      'chamomile',
      'mint',
    ]);
  });
});
