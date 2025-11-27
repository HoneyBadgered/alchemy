/**
 * CraftingService Unit Tests
 */

import { CraftingService } from '../services/crafting.service';

// Mock Prisma Client
jest.mock('../utils/prisma', () => {
  const mockPrisma = {
    playerState: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    recipe: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    playerInventory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  return {
    prisma: mockPrisma,
  };
});

describe('CraftingService', () => {
  let craftingService: CraftingService;
  let mockPrisma: any;

  beforeEach(() => {
    craftingService = new CraftingService();
    mockPrisma = require('../utils/prisma').prisma;
    jest.clearAllMocks();
  });

  describe('getRecipes', () => {
    it('should return all active recipes', async () => {
      const mockPlayerState = {
        userId: 'user-1',
        level: 5,
        xp: 100,
        totalXp: 500,
      };

      const mockRecipes = [
        {
          id: 'recipe-1',
          name: 'Basic Potion',
          requiredLevel: 1,
          isActive: true,
        },
        {
          id: 'recipe-2',
          name: 'Advanced Potion',
          requiredLevel: 5,
          isActive: true,
        },
      ];

      mockPrisma.playerState.findUnique.mockResolvedValue(mockPlayerState);
      mockPrisma.recipe.findMany.mockResolvedValue(mockRecipes);

      const result = await craftingService.getRecipes('user-1');

      expect(result).toEqual(mockRecipes);
      expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { requiredLevel: 'asc' },
      });
    });

    it('should throw error if player state not found', async () => {
      mockPrisma.playerState.findUnique.mockResolvedValue(null);

      await expect(
        craftingService.getRecipes('user-1')
      ).rejects.toThrow('Player state not found');
    });
  });

  describe('craft', () => {
    const mockRecipe = {
      id: 'recipe-1',
      name: 'Health Potion',
      requiredLevel: 3,
      resultItemId: 'potion-health',
      ingredients: [
        { ingredientId: 'herb-1', quantity: 2 },
        { ingredientId: 'water-1', quantity: 1 },
      ],
      xpGained: 50,
      isActive: true,
    };

    const mockPlayerState = {
      userId: 'user-1',
      level: 5,
      xp: 100,
      totalXp: 500,
    };

    const mockInventory = [
      {
        userId: 'user-1',
        itemId: 'herb-1',
        quantity: 5,
      },
      {
        userId: 'user-1',
        itemId: 'water-1',
        quantity: 3,
      },
    ];

    it('should throw error if recipe not found', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(null);

      await expect(
        craftingService.craft('user-1', { recipeId: 'invalid' })
      ).rejects.toThrow('Recipe not found');
    });

    it('should throw error if recipe is not active', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue({
        ...mockRecipe,
        isActive: false,
      });

      await expect(
        craftingService.craft('user-1', { recipeId: 'recipe-1' })
      ).rejects.toThrow('Recipe is not available');
    });

    it('should throw error if player state not found', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(mockRecipe);
      mockPrisma.playerState.findUnique.mockResolvedValue(null);
      mockPrisma.playerInventory.findMany.mockResolvedValue(mockInventory);

      await expect(
        craftingService.craft('user-1', { recipeId: 'recipe-1' })
      ).rejects.toThrow('Player state not found');
    });

    it('should throw error if player level too low', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(mockRecipe);
      mockPrisma.playerState.findUnique.mockResolvedValue({
        ...mockPlayerState,
        level: 2,
      });
      mockPrisma.playerInventory.findMany.mockResolvedValue(mockInventory);

      await expect(
        craftingService.craft('user-1', { recipeId: 'recipe-1' })
      ).rejects.toThrow('Level 3 required');
    });

    it('should throw error if insufficient ingredients', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(mockRecipe);
      mockPrisma.playerState.findUnique.mockResolvedValue(mockPlayerState);
      mockPrisma.playerInventory.findMany.mockResolvedValue([
        { userId: 'user-1', itemId: 'herb-1', quantity: 1 },
      ]);

      await expect(
        craftingService.craft('user-1', { recipeId: 'recipe-1' })
      ).rejects.toThrow('Missing required ingredients');
    });

    it('should successfully craft item and update inventory', async () => {
      mockPrisma.recipe.findUnique.mockResolvedValue(mockRecipe);
      mockPrisma.playerState.findUnique.mockResolvedValue(mockPlayerState);
      mockPrisma.playerInventory.findMany.mockResolvedValue(mockInventory);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        // Mock the inventory lookups within the transaction
        mockPrisma.playerInventory.findUnique
          .mockResolvedValueOnce(mockInventory[0]) // herb-1
          .mockResolvedValueOnce(mockInventory[1]); // water-1
        
        return await callback(mockPrisma);
      });

      const result = await craftingService.craft('user-1', {
        recipeId: 'recipe-1',
      });

      expect(result.success).toBe(true);
      expect(result.craftedItemId).toBe('potion-health');
      expect(result.xpGained).toBe(50);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
