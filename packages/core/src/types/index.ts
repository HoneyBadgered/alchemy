/**
 * Core types for The Alchemy Table game system
 */

export interface Player {
  id: string;
  level: number;
  xp: number;
  totalXp: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  xpReward: number;
  ingredientRewards?: IngredientReward[];
  cosmeticRewards?: string[];
}

export interface IngredientReward {
  ingredientId: string;
  quantity: number;
}

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

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

export interface Theme {
  id: string;
  name: string;
  requiredLevel: number;
  requiredQuestId?: string;
  isPurchased?: boolean;
}

export interface TableSkin {
  id: string;
  name: string;
  themeId: string;
  requiredLevel: number;
  requiredQuestId?: string;
  isPurchased?: boolean;
}

export interface PlayerCosmetics {
  unlockedThemes: string[];
  unlockedSkins: string[];
  activeThemeId?: string;
  activeTableSkinId?: string;
}

/**
 * Ingredient category types
 */
export type IngredientCategory = 'base' | 'floral' | 'fruit' | 'herbal' | 'spice' | 'special';

/**
 * Individual ingredient definition
 */
export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  description?: string;
  tags?: string[];
  badges?: string[];
  emoji?: string;
  isBase?: boolean; // true for base teas, false for add-ins
  baseAmount?: number; // Default starting amount for add-ins (in grams)
  incrementAmount?: number; // Amount to increase/decrease per step (falls back to baseAmount if not specified)
}

/**
 * Selected ingredient with quantity (for add-ins)
 */
export interface SelectedIngredient {
  ingredientId: string;
  quantity: number; // in grams
}

/**
 * Complete blend state
 */
export interface BlendState {
  baseTeaId?: string; // single base tea
  addIns: SelectedIngredient[]; // multiple add-ins with quantities
}
