/**
 * Crafting System
 * 
 * Validates recipes and crafting attempts for The Alchemy Table.
 */

import type { Recipe, InventoryItem } from '../types';

/**
 * Check if player has required ingredients for a recipe
 * 
 * @throws {Error} If recipe is null/undefined
 * @throws {Error} If inventory is null/undefined
 * @throws {Error} If recipe has invalid ingredients (negative quantities)
 * @throws {Error} If inventory has invalid items (negative quantities)
 */
export function hasRequiredIngredients(
  recipe: Recipe,
  inventory: InventoryItem[]
): boolean {
  if (!recipe) {
    throw new Error('Recipe is required');
  }
  
  if (!inventory) {
    throw new Error('Inventory is required');
  }
  
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
    throw new Error('Recipe must have a valid ingredients array');
  }
  
  // Validate recipe ingredients
  for (const ingredient of recipe.ingredients) {
    if (!ingredient.ingredientId) {
      throw new Error('Recipe ingredient must have a valid ingredientId');
    }
    if (typeof ingredient.quantity !== 'number' || ingredient.quantity < 0) {
      throw new Error(`Recipe ingredient quantity must be a non-negative number, got ${ingredient.quantity}`);
    }
  }
  
  // Validate inventory items
  for (const item of inventory) {
    if (!item.itemId) {
      throw new Error('Inventory item must have a valid itemId');
    }
    if (typeof item.quantity !== 'number' || item.quantity < 0) {
      throw new Error(`Inventory item quantity must be a non-negative number, got ${item.quantity}`);
    }
  }
  
  const inventoryMap = new Map(
    inventory.map(item => [item.itemId, item.quantity])
  );
  
  for (const ingredient of recipe.ingredients) {
    const available = inventoryMap.get(ingredient.ingredientId) || 0;
    if (available < ingredient.quantity) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if player meets level requirement for a recipe
 * 
 * @throws {Error} If recipe is null/undefined
 * @throws {Error} If playerLevel is not a valid positive number
 * @throws {Error} If recipe.requiredLevel is not a valid positive number
 */
export function meetsLevelRequirement(
  recipe: Recipe,
  playerLevel: number
): boolean {
  if (!recipe) {
    throw new Error('Recipe is required');
  }
  
  if (typeof playerLevel !== 'number' || playerLevel < 1) {
    throw new Error(`Player level must be a positive number, got ${playerLevel}`);
  }
  
  if (typeof recipe.requiredLevel !== 'number' || recipe.requiredLevel < 1) {
    throw new Error(`Recipe required level must be a positive number, got ${recipe.requiredLevel}`);
  }
  
  return playerLevel >= recipe.requiredLevel;
}

/**
 * Validate if a crafting attempt is possible
 * 
 * @throws {Error} If recipe is null/undefined
 * @throws {Error} If playerLevel is not a valid positive number
 * @throws {Error} If inventory is null/undefined
 * @throws {Error} If recipe or inventory has invalid data
 */
export function canCraftRecipe(
  recipe: Recipe,
  playerLevel: number,
  inventory: InventoryItem[]
): {
  canCraft: boolean;
  reason?: string;
} {
  if (!recipe) {
    throw new Error('Recipe is required');
  }
  
  if (!inventory) {
    throw new Error('Inventory is required');
  }
  
  if (!meetsLevelRequirement(recipe, playerLevel)) {
    return {
      canCraft: false,
      reason: `Level ${recipe.requiredLevel} required`,
    };
  }
  
  if (!hasRequiredIngredients(recipe, inventory)) {
    return {
      canCraft: false,
      reason: 'Missing required ingredients',
    };
  }
  
  return { canCraft: true };
}

/**
 * Calculate new inventory after crafting
 * 
 * @throws {Error} If recipe is null/undefined
 * @throws {Error} If inventory is null/undefined
 * @throws {Error} If recipe has invalid data
 * @throws {Error} If resultItemId is missing
 */
export function craftRecipe(
  recipe: Recipe,
  inventory: InventoryItem[]
): InventoryItem[] {
  if (!recipe) {
    throw new Error('Recipe is required');
  }
  
  if (!inventory) {
    throw new Error('Inventory is required');
  }
  
  if (!recipe.resultItemId) {
    throw new Error('Recipe must have a valid resultItemId');
  }
  
  if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
    throw new Error('Recipe must have a valid ingredients array');
  }
  
  const newInventory = [...inventory];
  const inventoryMap = new Map(
    newInventory.map(item => [item.itemId, item])
  );
  
  // Deduct ingredients
  for (const ingredient of recipe.ingredients) {
    const item = inventoryMap.get(ingredient.ingredientId);
    if (item) {
      item.quantity -= ingredient.quantity;
    }
  }
  
  // Add crafted item
  const resultItem = inventoryMap.get(recipe.resultItemId);
  if (resultItem) {
    resultItem.quantity += 1;
  } else {
    newInventory.push({
      itemId: recipe.resultItemId,
      quantity: 1,
    });
  }
  
  // Remove items with 0 quantity
  return newInventory.filter(item => item.quantity > 0);
}
