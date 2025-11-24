/**
 * Crafting API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Recipe {
  id: string;
  name: string;
  requiredLevel: number;
  ingredients: RecipeIngredient[];
  resultItemId: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface CraftRequest {
  recipeId: string;
}

export interface CraftResponse {
  success: boolean;
  craftedItemId: string;
  xpGained: number;
  newTotalXp: number;
}

export const craftingApi = {
  /**
   * Get available recipes
   */
  async getRecipes(token: string): Promise<Recipe[]> {
    const response = await fetch(`${API_URL}/recipes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recipes');
    }

    return response.json();
  },

  /**
   * Craft a recipe
   */
  async craft(recipeId: string, token: string): Promise<CraftResponse> {
    const response = await fetch(`${API_URL}/craft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ recipeId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to craft recipe');
    }

    return response.json();
  },
};
