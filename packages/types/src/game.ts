/**
 * Core game logic types for The Alchemy Table
 */

/**
 * Player entity
 */
export interface Player {
  id: string;
  level: number;
  xp: number;
  totalXp: number;
}

/**
 * Quest entity
 */
export interface Quest {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  xpReward: number;
  ingredientRewards?: IngredientReward[];
  cosmeticRewards?: string[];
}

/**
 * Ingredient reward
 */
export interface IngredientReward {
  ingredientId: string;
  quantity: number;
}

/**
 * Recipe entity
 */
export interface Recipe {
  id: string;
  name: string;
  requiredLevel: number;
  ingredients: RecipeIngredient[];
  resultItemId: string;
}

/**
 * Recipe ingredient
 */
export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

/**
 * Inventory item
 */
export interface InventoryItem {
  itemId: string;
  quantity: number;
}

/**
 * Theme entity
 */
export interface Theme {
  id: string;
  name: string;
  requiredLevel: number;
  requiredQuestId?: string;
  isPurchased?: boolean;
}

/**
 * Table skin entity
 */
export interface TableSkin {
  id: string;
  name: string;
  themeId: string;
  requiredLevel: number;
  requiredQuestId?: string;
  isPurchased?: boolean;
}

/**
 * Player cosmetics
 */
export interface PlayerCosmetics {
  unlockedThemes: string[];
  unlockedSkins: string[];
  activeThemeId?: string;
  activeTableSkinId?: string;
}

/**
 * Ingredient category types (legacy + new)
 */
export type IngredientCategory = 'base' | 'floral' | 'fruit' | 'herbal' | 'spice' | 'special' | 'herb' | 'tea' | 'sweetener';

/**
 * Ingredient role types
 */
export type IngredientRole = 'base' | 'addIn' | 'either';

/**
 * Ingredient status types
 */
export type IngredientStatus = 'active' | 'archived' | 'outOfStock';

/**
 * Caffeine level types
 */
export type CaffeineLevel = 'none' | 'low' | 'medium' | 'high';

/**
 * Cut or grade types
 */
export type CutOrGrade = 'whole leaf' | 'pieces' | 'powder' | 'crystals' | 'cut and sift' | 'ground' | 'whole';

/**
 * Individual ingredient definition (extended for admin management)
 */
export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  
  // Legacy fields (for backwards compatibility with crafting system)
  description?: string;
  tags?: string[];
  badges?: string[];
  emoji?: string;
  isBase?: boolean; // true for base teas, false for add-ins
  baseAmount?: number; // Default starting amount for add-ins (in grams)
  incrementAmount?: number; // Amount to increase/decrease per step (falls back to baseAmount if not specified)
  
  // Extended fields for admin management
  role?: IngredientRole;
  descriptionShort?: string;
  descriptionLong?: string;
  image?: string;
  
  // Flavor & Use
  flavorNotes?: string[];
  cutOrGrade?: CutOrGrade | string;
  recommendedUsageMin?: number; // Slider start percentage
  recommendedUsageMax?: number; // Slider end percentage
  pairings?: string[]; // Array of ingredient IDs
  
  // Brewing
  steepTemperature?: number; // in °F
  steepTimeMin?: number; // in seconds
  steepTimeMax?: number; // in seconds
  brewNotes?: string;
  
  // Inventory & Costing
  supplierId?: string;
  costPerOunce?: number;
  costPerGram?: number; // Computed from costPerOunce
  inventoryAmount?: number;
  minimumStockLevel?: number;
  status?: IngredientStatus;
  
  // Safety
  caffeineLevel?: CaffeineLevel;
  allergens?: string[];
  internalNotes?: string;
  
  // Timestamps
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Supplier model
 */
export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
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

/**
 * Player progress data
 */
export interface PlayerProgress {
  player: Player;
  quests: PlayerQuest[];
  inventory: InventoryItem[];
  cosmetics: PlayerCosmetics;
}

/**
 * Player quest status
 */
export interface PlayerQuest {
  questId: string;
  quest: Quest;
  status: 'available' | 'active' | 'completed';
  progress?: number;
  completedAt?: string;
}
