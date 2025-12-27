/**
 * Crafting Service
 */

import { prisma } from '../utils/prisma';
import { canCraftRecipe } from '@alchemy/core';
import type { Prisma } from '@prisma/client';

export interface CraftInput {
  recipeId: string;
}

export class CraftingService {
  async getRecipes(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get player state to check level
    const playerState = await prisma.player_states.findUnique({
      where: { userId },
    });

    if (!playerState) {
      throw new Error('Player state not found');
    }

    // Get all active recipes
    const recipes = await prisma.recipes.findMany({
      where: {
        isActive: true,
      },
      orderBy: { requiredLevel: 'asc' },
    });

    return recipes;
  }

  async craft(userId: string, input: CraftInput) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!input || !input.recipeId) {
      throw new Error('Recipe ID is required');
    }

    const { recipeId } = input;

    // Get recipe
    const recipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      const error = new Error('Recipe not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (!recipe.isActive) {
      const error = new Error('Recipe is not available');
      (error as any).statusCode = 400;
      throw error;
    }

    // Get player state and inventory
    const [playerState, inventory] = await Promise.all([
      prisma.player_states.findUnique({
        where: { userId },
      }),
      prisma.player_inventory.findMany({
        where: { userId },
      }),
    ]);

    if (!playerState) {
      const error = new Error('Player state not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Convert inventory to array for canCraftRecipe
    const inventoryArray = inventory.map((item) => ({
      itemId: item.itemId,
      quantity: item.quantity,
    }));

    // Check if can craft
    const recipeWithTypedIngredients = {
      ...recipe,
      ingredients: recipe.ingredients as Array<{ ingredientId: string; quantity: number }>,
    };
    const craftCheck = canCraftRecipe(
      recipeWithTypedIngredients,
      playerState.level,
      inventoryArray
    );

    if (!craftCheck.canCraft) {
      const error = new Error(craftCheck.reason || 'Cannot craft this recipe. Check level and ingredients.');
      (error as any).statusCode = 422;
      throw error;
    }

    // Perform crafting logic
    const ingredients = recipe.ingredients as Array<{ ingredientId: string; quantity: number }>;
    
    // Start a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Consume ingredients
      for (const ingredient of ingredients) {
        const existing = await tx.player_inventory.findUnique({
          where: {
            userId_itemId: {
              userId,
              itemId: ingredient.ingredientId,
            },
          },
        });

        if (!existing || existing.quantity < ingredient.quantity) {
          const error = new Error(`Insufficient ${ingredient.ingredientId}`);
          (error as any).statusCode = 422;
          throw error;
        }

        if (existing.quantity === ingredient.quantity) {
          await tx.player_inventory.delete({
            where: {
              userId_itemId: {
                userId,
                itemId: ingredient.ingredientId,
              },
            },
          });
        } else {
          await tx.player_inventory.update({
            where: {
              userId_itemId: {
                userId,
                itemId: ingredient.ingredientId,
              },
            },
            data: {
              quantity: existing.quantity - ingredient.quantity,
            },
          });
        }
      }

      // Add crafted item to inventory
      await tx.player_inventory.upsert({
        where: {
          userId_itemId: {
            userId,
            itemId: recipe.resultItemId,
          },
        },
        create: {
          id: crypto.randomUUID(),
          userId,
          itemId: recipe.resultItemId,
          itemType: 'blend',
          quantity: 1,
        },
        update: {
          quantity: {
            increment: 1,
          },
        },
      });

      // Update player XP
      const newTotalXp = playerState.totalXp + recipe.xpGained;
      await tx.player_states.update({
        where: { userId },
        data: {
          totalXp: newTotalXp,
          xp: {
            increment: recipe.xpGained,
          },
        },
      });

      return {
        success: true,
        craftedItemId: recipe.resultItemId,
        xpGained: recipe.xpGained,
        newTotalXp,
      };
    });

    return result;
  }
}
