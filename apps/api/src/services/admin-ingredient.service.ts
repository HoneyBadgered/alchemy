/**
 * Admin Ingredient Management Service
 * 
 * Manages ingredient configurations including baseAmount and incrementAmount
 * Note: Ingredients are stored in-memory in the core package. This service
 * provides an API for reading and potentially persisting custom configurations.
 */

import {
  INGREDIENTS,
  Ingredient,
  IngredientCategory,
  getIngredientById,
  getIngredientsByCategory,
  getBaseTeas,
  getAddIns,
  DEFAULT_BASE_AMOUNT,
  DEFAULT_INCREMENT_AMOUNT,
} from '@alchemy/core';

export interface IngredientFilters {
  category?: IngredientCategory;
  isBase?: boolean;
  search?: string;
}

export interface UpdateIngredientInput {
  baseAmount?: number;
  incrementAmount?: number;
}

/**
 * In-memory storage for ingredient customizations
 * 
 * NOTE: This is a temporary solution. In a production system, these customizations
 * should be persisted to the database (e.g., a new IngredientConfig table) to
 * survive server restarts.
 * 
 * TODO: Create database table for ingredient customizations and migrate this storage
 */
const ingredientCustomizations: Map<string, { baseAmount?: number; incrementAmount?: number }> = new Map();

export class AdminIngredientService {
  /**
   * Get all ingredients with optional filtering
   */
  async getIngredients(filters?: IngredientFilters): Promise<Ingredient[]> {
    let ingredients = [...INGREDIENTS];

    if (filters?.category) {
      ingredients = getIngredientsByCategory(filters.category);
    }

    if (filters?.isBase !== undefined) {
      ingredients = filters.isBase ? getBaseTeas() : getAddIns();
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      ingredients = ingredients.filter(
        ing =>
          ing.name.toLowerCase().includes(searchLower) ||
          ing.description?.toLowerCase().includes(searchLower) ||
          ing.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply any customizations
    return ingredients.map(ing => this.applyCustomizations(ing));
  }

  /**
   * Get a single ingredient by ID
   */
  async getIngredient(id: string): Promise<Ingredient> {
    const ingredient = getIngredientById(id);
    if (!ingredient) {
      throw new Error('Ingredient not found');
    }
    return this.applyCustomizations(ingredient);
  }

  /**
   * Get all add-ins (non-base ingredients)
   */
  async getAddIns(): Promise<Ingredient[]> {
    const addIns = getAddIns();
    return addIns.map(ing => this.applyCustomizations(ing));
  }

  /**
   * Update ingredient configuration
   * This applies customizations on top of the default ingredient data
   */
  async updateIngredient(id: string, data: UpdateIngredientInput): Promise<Ingredient> {
    const ingredient = getIngredientById(id);
    if (!ingredient) {
      throw new Error('Ingredient not found');
    }

    // Validate inputs
    if (data.baseAmount !== undefined) {
      if (typeof data.baseAmount !== 'number' || data.baseAmount < 0.1) {
        throw new Error('Base amount must be a positive number (minimum 0.1)');
      }
    }

    if (data.incrementAmount !== undefined) {
      if (typeof data.incrementAmount !== 'number' || data.incrementAmount < 0.1) {
        throw new Error('Increment amount must be a positive number (minimum 0.1)');
      }
    }

    // Store customization
    const existing = ingredientCustomizations.get(id) || {};
    ingredientCustomizations.set(id, {
      ...existing,
      ...data,
    });

    return this.applyCustomizations(ingredient);
  }

  /**
   * Reset ingredient to default configuration
   */
  async resetIngredient(id: string): Promise<Ingredient> {
    const ingredient = getIngredientById(id);
    if (!ingredient) {
      throw new Error('Ingredient not found');
    }

    ingredientCustomizations.delete(id);
    return ingredient;
  }

  /**
   * Get available ingredient categories
   */
  async getCategories(): Promise<IngredientCategory[]> {
    return ['base', 'floral', 'fruit', 'herbal', 'spice', 'special'];
  }

  /**
   * Get default values for reference
   */
  getDefaults(): { baseAmount: number; incrementAmount: number } {
    return {
      baseAmount: DEFAULT_BASE_AMOUNT,
      incrementAmount: DEFAULT_INCREMENT_AMOUNT,
    };
  }

  /**
   * Apply any stored customizations to an ingredient
   */
  private applyCustomizations(ingredient: Ingredient): Ingredient {
    const customization = ingredientCustomizations.get(ingredient.id);
    if (!customization) {
      return ingredient;
    }

    return {
      ...ingredient,
      baseAmount: customization.baseAmount ?? ingredient.baseAmount,
      incrementAmount: customization.incrementAmount ?? ingredient.incrementAmount,
    };
  }
}
