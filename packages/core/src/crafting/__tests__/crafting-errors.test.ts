import {
  hasRequiredIngredients,
  meetsLevelRequirement,
  canCraftRecipe,
  craftRecipe,
} from '../index';
import type { Recipe, InventoryItem } from '../../types';

describe('Crafting System - Error Handling', () => {
  const validRecipe: Recipe = {
    id: 'recipe-1',
    name: 'Health Potion',
    ingredients: [
      { ingredientId: 'herb-1', quantity: 2 },
      { ingredientId: 'water-1', quantity: 1 },
    ],
    resultItemId: 'potion-health',
    requiredLevel: 3,
  };

  const validInventory: InventoryItem[] = [
    { itemId: 'herb-1', quantity: 5 },
    { itemId: 'water-1', quantity: 3 },
  ];

  describe('hasRequiredIngredients - Error Cases', () => {
    it('should throw error when recipe is null', () => {
      expect(() => hasRequiredIngredients(null as any, validInventory)).toThrow('Recipe is required');
    });

    it('should throw error when recipe is undefined', () => {
      expect(() => hasRequiredIngredients(undefined as any, validInventory)).toThrow('Recipe is required');
    });

    it('should throw error when inventory is null', () => {
      expect(() => hasRequiredIngredients(validRecipe, null as any)).toThrow('Inventory is required');
    });

    it('should throw error when inventory is undefined', () => {
      expect(() => hasRequiredIngredients(validRecipe, undefined as any)).toThrow('Inventory is required');
    });

    it('should throw error when recipe has no ingredients array', () => {
      const invalidRecipe = { ...validRecipe, ingredients: undefined as any };
      expect(() => hasRequiredIngredients(invalidRecipe, validInventory)).toThrow('Recipe must have a valid ingredients array');
    });

    it('should throw error when recipe ingredients is not an array', () => {
      const invalidRecipe = { ...validRecipe, ingredients: 'not-an-array' as any };
      expect(() => hasRequiredIngredients(invalidRecipe, validInventory)).toThrow('Recipe must have a valid ingredients array');
    });

    it('should throw error when recipe ingredient has no ingredientId', () => {
      const invalidRecipe = {
        ...validRecipe,
        ingredients: [{ ingredientId: '', quantity: 2 }],
      };
      expect(() => hasRequiredIngredients(invalidRecipe, validInventory)).toThrow('Recipe ingredient must have a valid ingredientId');
    });

    it('should throw error when recipe ingredient has negative quantity', () => {
      const invalidRecipe = {
        ...validRecipe,
        ingredients: [{ ingredientId: 'herb-1', quantity: -1 }],
      };
      expect(() => hasRequiredIngredients(invalidRecipe, validInventory)).toThrow('Recipe ingredient quantity must be a non-negative number');
    });

    it('should throw error when inventory item has no itemId', () => {
      const invalidInventory = [{ itemId: '', quantity: 5 }];
      expect(() => hasRequiredIngredients(validRecipe, invalidInventory)).toThrow('Inventory item must have a valid itemId');
    });

    it('should throw error when inventory item has negative quantity', () => {
      const invalidInventory = [{ itemId: 'herb-1', quantity: -5 }];
      expect(() => hasRequiredIngredients(validRecipe, invalidInventory)).toThrow('Inventory item quantity must be a non-negative number');
    });
  });

  describe('meetsLevelRequirement - Error Cases', () => {
    it('should throw error when recipe is null', () => {
      expect(() => meetsLevelRequirement(null as any, 5)).toThrow('Recipe is required');
    });

    it('should throw error when recipe is undefined', () => {
      expect(() => meetsLevelRequirement(undefined as any, 5)).toThrow('Recipe is required');
    });

    it('should throw error when playerLevel is negative', () => {
      expect(() => meetsLevelRequirement(validRecipe, -1)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is zero', () => {
      expect(() => meetsLevelRequirement(validRecipe, 0)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is not a number', () => {
      expect(() => meetsLevelRequirement(validRecipe, 'not-a-number' as any)).toThrow('Player level must be a positive number');
    });

    it('should throw error when recipe requiredLevel is negative', () => {
      const invalidRecipe = { ...validRecipe, requiredLevel: -1 };
      expect(() => meetsLevelRequirement(invalidRecipe, 5)).toThrow('Recipe required level must be a positive number');
    });

    it('should throw error when recipe requiredLevel is zero', () => {
      const invalidRecipe = { ...validRecipe, requiredLevel: 0 };
      expect(() => meetsLevelRequirement(invalidRecipe, 5)).toThrow('Recipe required level must be a positive number');
    });
  });

  describe('canCraftRecipe - Error Cases', () => {
    it('should throw error when recipe is null', () => {
      expect(() => canCraftRecipe(null as any, 5, validInventory)).toThrow('Recipe is required');
    });

    it('should throw error when recipe is undefined', () => {
      expect(() => canCraftRecipe(undefined as any, 5, validInventory)).toThrow('Recipe is required');
    });

    it('should throw error when inventory is null', () => {
      expect(() => canCraftRecipe(validRecipe, 5, null as any)).toThrow('Inventory is required');
    });

    it('should throw error when inventory is undefined', () => {
      expect(() => canCraftRecipe(validRecipe, 5, undefined as any)).toThrow('Inventory is required');
    });

    it('should throw error when playerLevel is invalid', () => {
      expect(() => canCraftRecipe(validRecipe, -1, validInventory)).toThrow('Player level must be a positive number');
    });
  });

  describe('craftRecipe - Error Cases', () => {
    it('should throw error when recipe is null', () => {
      expect(() => craftRecipe(null as any, validInventory)).toThrow('Recipe is required');
    });

    it('should throw error when recipe is undefined', () => {
      expect(() => craftRecipe(undefined as any, validInventory)).toThrow('Recipe is required');
    });

    it('should throw error when inventory is null', () => {
      expect(() => craftRecipe(validRecipe, null as any)).toThrow('Inventory is required');
    });

    it('should throw error when inventory is undefined', () => {
      expect(() => craftRecipe(validRecipe, undefined as any)).toThrow('Inventory is required');
    });

    it('should throw error when recipe has no resultItemId', () => {
      const invalidRecipe = { ...validRecipe, resultItemId: '' };
      expect(() => craftRecipe(invalidRecipe, validInventory)).toThrow('Recipe must have a valid resultItemId');
    });

    it('should throw error when recipe has no ingredients array', () => {
      const invalidRecipe = { ...validRecipe, ingredients: undefined as any };
      expect(() => craftRecipe(invalidRecipe, validInventory)).toThrow('Recipe must have a valid ingredients array');
    });
  });
});
