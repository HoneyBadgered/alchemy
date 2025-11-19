/**
 * Crafting System
 * 
 * Validates recipes and crafting attempts for The Alchemy Table.
 */

import type { Recipe, InventoryItem } from '../types';

/**
 * Check if player has required ingredients for a recipe
 */
export function hasRequiredIngredients(
  recipe: Recipe,
  inventory: InventoryItem[]
): boolean {
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
 */
export function meetsLevelRequirement(
  recipe: Recipe,
  playerLevel: number
): boolean {
  return playerLevel >= recipe.requiredLevel;
}

/**
 * Validate if a crafting attempt is possible
 */
export function canCraftRecipe(
  recipe: Recipe,
  playerLevel: number,
  inventory: InventoryItem[]
): {
  canCraft: boolean;
  reason?: string;
} {
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
 */
export function craftRecipe(
  recipe: Recipe,
  inventory: InventoryItem[]
): InventoryItem[] {
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
