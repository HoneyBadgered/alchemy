/**
 * useBlendState Hook
 * 
 * Custom hook for managing blend state (base tea + add-ins)
 */

'use client';

import { useState, useCallback } from 'react';
import { BlendState, SelectedIngredient } from '@alchemy/core';

interface UseBlendStateReturn {
  blendState: BlendState;
  selectBase: (ingredientId: string) => void;
  toggleAddIn: (ingredientId: string) => void;
  updateAddInQuantity: (ingredientId: string, quantity: number) => void;
  clearBlend: () => void;
  getAddInQuantity: (ingredientId: string) => number;
}

export function useBlendState(initialState?: BlendState): UseBlendStateReturn {
  const [blendState, setBlendState] = useState<BlendState>(
    initialState || {
      baseTeaId: undefined,
      addIns: [],
    }
  );

  const selectBase = useCallback((ingredientId: string) => {
    setBlendState(prev => ({
      ...prev,
      baseTeaId: ingredientId,
    }));
  }, []);

  const toggleAddIn = useCallback((ingredientId: string) => {
    setBlendState(prev => {
      const existingIndex = prev.addIns.findIndex(
        item => item.ingredientId === ingredientId
      );

      if (existingIndex >= 0) {
        // Remove the add-in
        return {
          ...prev,
          addIns: prev.addIns.filter((_, i) => i !== existingIndex),
        };
      } else {
        // Add the add-in with default quantity
        return {
          ...prev,
          addIns: [
            ...prev.addIns,
            { ingredientId, quantity: 5 },
          ],
        };
      }
    });
  }, []);

  const updateAddInQuantity = useCallback((ingredientId: string, quantity: number) => {
    setBlendState(prev => {
      const existingIndex = prev.addIns.findIndex(
        item => item.ingredientId === ingredientId
      );

      if (existingIndex >= 0) {
        const newAddIns = [...prev.addIns];
        newAddIns[existingIndex] = { ingredientId, quantity };
        return {
          ...prev,
          addIns: newAddIns,
        };
      }

      return prev;
    });
  }, []);

  const clearBlend = useCallback(() => {
    setBlendState({
      baseTeaId: undefined,
      addIns: [],
    });
  }, []);

  const getAddInQuantity = useCallback((ingredientId: string): number => {
    const addIn = blendState.addIns.find(item => item.ingredientId === ingredientId);
    return addIn?.quantity || 5;
  }, [blendState.addIns]);

  return {
    blendState,
    selectBase,
    toggleAddIn,
    updateAddInQuantity,
    clearBlend,
    getAddInQuantity,
  };
}
