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
