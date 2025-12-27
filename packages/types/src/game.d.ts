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
export type IngredientCategory = 'base' | 'floral' | 'fruit' | 'herbal' | 'spice' | 'special' | 'herb' | 'tea' | 'sweetener';
export type IngredientRole = 'base' | 'addIn' | 'either';
export type IngredientStatus = 'active' | 'archived' | 'outOfStock';
export type CaffeineLevel = 'none' | 'low' | 'medium' | 'high';
export type CutOrGrade = 'whole leaf' | 'pieces' | 'powder' | 'crystals' | 'cut and sift' | 'ground' | 'whole';
export interface Ingredient {
    id: string;
    name: string;
    category: IngredientCategory;
    description?: string;
    tags?: string[];
    badges?: string[];
    emoji?: string;
    isBase?: boolean;
    baseAmount?: number;
    incrementAmount?: number;
    role?: IngredientRole;
    descriptionShort?: string;
    descriptionLong?: string;
    image?: string;
    flavorNotes?: string[];
    cutOrGrade?: CutOrGrade | string;
    recommendedUsageMin?: number;
    recommendedUsageMax?: number;
    pairings?: string[];
    steepTemperature?: number;
    steepTimeMin?: number;
    steepTimeMax?: number;
    brewNotes?: string;
    supplierId?: string;
    costPerOunce?: number;
    costPerGram?: number;
    inventoryAmount?: number;
    minimumStockLevel?: number;
    status?: IngredientStatus;
    caffeineLevel?: CaffeineLevel;
    allergens?: string[];
    internalNotes?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
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
export interface SelectedIngredient {
    ingredientId: string;
    quantity: number;
}
export interface BlendState {
    baseTeaId?: string;
    addIns: SelectedIngredient[];
}
export interface PlayerProgress {
    player: Player;
    quests: PlayerQuest[];
    inventory: InventoryItem[];
    cosmetics: PlayerCosmetics;
}
export interface PlayerQuest {
    questId: string;
    quest: Quest;
    status: 'available' | 'active' | 'completed';
    progress?: number;
    completedAt?: string;
}
//# sourceMappingURL=game.d.ts.map