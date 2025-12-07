/**
 * Hook for fetching blending ingredients from the API
 */

'use client';

import { useState, useEffect } from 'react';
import type { BlendingIngredient } from '../components/blending/mockData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseIngredientsResult {
  bases: BlendingIngredient[];
  addIns: {
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  };
  isLoading: boolean;
  error: Error | null;
}

export function useIngredients(): UseIngredientsResult {
  const [bases, setBases] = useState<BlendingIngredient[]>([]);
  const [addIns, setAddIns] = useState<{
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  }>({
    addIns: [],
    botanicals: [],
    premium: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchIngredients() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch bases and add-ins in parallel
        const [basesResponse, addInsResponse] = await Promise.all([
          fetch(`${API_URL}/ingredients/bases`).then(res => {
            if (!res.ok) throw new Error('Failed to fetch base teas');
            return res.json();
          }),
          fetch(`${API_URL}/ingredients/add-ins`).then(res => {
            if (!res.ok) throw new Error('Failed to fetch add-ins');
            return res.json();
          }),
        ]);

        setBases(basesResponse.ingredients || []);
        setAddIns(addInsResponse);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error fetching ingredients:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchIngredients();
  }, []);

  return { bases, addIns, isLoading, error };
}

/**
 * Helper to get ingredient by ID from cache
 */
export function getIngredientById(
  id: string,
  bases: BlendingIngredient[],
  addIns: {
    addIns: BlendingIngredient[];
    botanicals: BlendingIngredient[];
    premium: BlendingIngredient[];
  }
): BlendingIngredient | undefined {
  // Check bases first
  const base = bases.find(b => b.id === id);
  if (base) return base;

  // Check all add-in categories
  const allAddIns = [
    ...addIns.addIns,
    ...addIns.botanicals,
    ...addIns.premium,
  ];
  return allAddIns.find(a => a.id === id);
}
