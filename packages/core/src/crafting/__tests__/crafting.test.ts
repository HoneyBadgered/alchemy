import {
  hasRequiredIngredients,
  meetsLevelRequirement,
  canCraftRecipe,
  craftRecipe,
} from '../index';
import type { Recipe, InventoryItem } from '../../types';

describe('Crafting System', () => {
  const mockRecipe: Recipe = {
    id: 'recipe-1',
    name: 'Health Potion',
    ingredients: [
      { ingredientId: 'herb-1', quantity: 2 },
      { ingredientId: 'water-1', quantity: 1 },
    ],
    resultItemId: 'potion-health',
    requiredLevel: 3,
  };

  describe('hasRequiredIngredients', () => {
    it('should return true when player has all required ingredients', () => {
      const inventory: InventoryItem[] = [
        { itemId: 'herb-1', quantity: 5 },
        { itemId: 'water-1', quantity: 3 },
      ];

      expect(hasRequiredIngredients(mockRecipe, inventory)).toBe(true);
    });

    it('should return true when player has exact required ingredients', () => {
      const inventory: InventoryItem[] = [
        { itemId: 'herb-1', quantity: 2 },
        { itemId: 'water-1', quantity: 1 },
      ];

      expect(hasRequiredIngredients(mockRecipe, inventory)).toBe(true);
    });

    it('should return false when player is missing an ingredient', () => {
      const inventory: InventoryItem[] = [
        { itemId: 'herb-1', quantity: 5 },
      ];

      expect(hasRequiredIngredients(mockRecipe, inventory)).toBe(false);
    });

    it('should return false when player has insufficient quantity', () => {
      const inventory: InventoryItem[] = [
        { itemId: 'herb-1', quantity: 1 },
        { itemId: 'water-1', quantity: 1 },
      ];

      expect(hasRequiredIngredients(mockRecipe, inventory)).toBe(false);
    });

    it('should return false when inventory is empty', () => {
      const inventory: InventoryItem[] = [];

      expect(hasRequiredIngredients(mockRecipe, inventory)).toBe(false);
    });
  });

  describe('meetsLevelRequirement', () => {
    it('should return true when player level meets requirement', () => {
      expect(meetsLevelRequirement(mockRecipe, 3)).toBe(true);
    });

    it('should return true when player level exceeds requirement', () => {
      expect(meetsLevelRequirement(mockRecipe, 10)).toBe(true);
    });

    it('should return false when player level is below requirement', () => {
      expect(meetsLevelRequirement(mockRecipe, 2)).toBe(false);
    });

    it('should handle level 1 requirement correctly', () => {
      const level1Recipe: Recipe = { ...mockRecipe, requiredLevel: 1 };
      expect(meetsLevelRequirement(level1Recipe, 1)).toBe(true);
    });
  });

  describe('canCraftRecipe', () => {
    const inventory: InventoryItem[] = [
      { itemId: 'herb-1', quantity: 5 },
      { itemId: 'water-1', quantity: 3 },
    ];

    it('should allow crafting when level and ingredients are met', () => {
      const result = canCraftRecipe(mockRecipe, 5, inventory);
      expect(result.canCraft).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should prevent crafting when level requirement not met', () => {
      const result = canCraftRecipe(mockRecipe, 2, inventory);
      expect(result.canCraft).toBe(false);
      expect(result.reason).toBe('Level 3 required');
    });

    it('should prevent crafting when ingredients missing', () => {
      const emptyInventory: InventoryItem[] = [];
      const result = canCraftRecipe(mockRecipe, 5, emptyInventory);
      expect(result.canCraft).toBe(false);
      expect(result.reason).toBe('Missing required ingredients');
    });

    it('should prevent crafting when insufficient ingredient quantity', () => {
      const insufficientInventory: InventoryItem[] = [
        { itemId: 'herb-1', quantity: 1 },
        { itemId: 'water-1', quantity: 1 },
      ];
      const result = canCraftRecipe(mockRecipe, 5, insufficientInventory);
      expect(result.canCraft).toBe(false);
      expect(result.reason).toBe('Missing required ingredients');
    });
  });

  describe('craftRecipe', () => {
    it('should deduct ingredients and add crafted item', () => {
      const inventory: InventoryItem[] = [
        { itemId: 'herb-1', quantity: 5 },
        { itemId: 'water-1', quantity: 3 },
      ];

      const result = craftRecipe(mockRecipe, inventory);

      // Check herb quantity decreased
      const herb = result.find(item => item.itemId === 'herb-1');
      expect(herb?.quantity).toBe(3); // 5 - 2

      // Check water quantity decreased
      const water = result.find(item => item.itemId === 'water-1');
      expect(water?.quantity).toBe(2); // 3 - 1

      // Check crafted item was added
      const potion = result.find(item => item.itemId === 'potion-health');
      expect(potion?.quantity).toBe(1);
    });

    it('should remove ingredient when quantity reaches zero', () => {
      const inventory: InventoryItem[] = [
        { itemId: 'herb-1', quantity: 2 },
        { itemId: 'water-1', quantity: 1 },
      ];

      const result = craftRecipe(mockRecipe, inventory);

      // Ingredients with 0 quantity should be removed
      const herb = result.find(item => item.itemId === 'herb-1');
      expect(herb).toBeUndefined();

      const water = result.find(item => item.itemId === 'water-1');
      expect(water).toBeUndefined();

      // Crafted item should be present
      expect(result.length).toBe(1);
      expect(result[0].itemId).toBe('potion-health');
    });

    it('should increment quantity when crafted item already exists', () => {
      const inventory: InventoryItem[] = [
        { itemId: 'herb-1', quantity: 5 },
        { itemId: 'water-1', quantity: 3 },
        { itemId: 'potion-health', quantity: 2 },
      ];

      const result = craftRecipe(mockRecipe, inventory);

      const potion = result.find(item => item.itemId === 'potion-health');
      expect(potion?.quantity).toBe(3); // 2 + 1
    });

    it('should handle multiple crafting operations correctly', () => {
      let inventory: InventoryItem[] = [
        { itemId: 'herb-1', quantity: 10 },
        { itemId: 'water-1', quantity: 5 },
      ];

      // Craft twice
      inventory = craftRecipe(mockRecipe, inventory);
      inventory = craftRecipe(mockRecipe, inventory);

      const herb = inventory.find(item => item.itemId === 'herb-1');
      expect(herb?.quantity).toBe(6); // 10 - 2 - 2

      const water = inventory.find(item => item.itemId === 'water-1');
      expect(water?.quantity).toBe(3); // 5 - 1 - 1

      const potion = inventory.find(item => item.itemId === 'potion-health');
      expect(potion?.quantity).toBe(2);
    });
  });
});
