/**
 * Ingredients Context
 * Provides ingredients data throughout the blending interface
 */

'use client';

import React, { createContext, useContext } from 'react';
import type { BlendingIngredient } from '../components/blending/mockData';
import { useIngredients as useIngredientsHook, getIngredientById } from './useIngredients';

interface IngredientsContextValue {
  bases: BlendingIngredient[];
  addIns: {
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  };
  isLoading: boolean;
  error: Error | null;
  getIngredient: (id: string) => BlendingIngredient | undefined;
}

const IngredientsContext = createContext<IngredientsContextValue | null>(null);

export function IngredientsProvider({ children }: { children: React.ReactNode }) {
  const { bases, addIns, isLoading, error } = useIngredientsHook();

  const getIngredient = (id: string) => getIngredientById(id, bases, addIns);

  return (
    <IngredientsContext.Provider value={{ bases, addIns, isLoading, error, getIngredient }}>
      {children}
    </IngredientsContext.Provider>
  );
}

export function useIngredientsContext() {
  const context = useContext(IngredientsContext);
  if (!context) {
    throw new Error('useIngredientsContext must be used within IngredientsProvider');
  }
  return context;
}
