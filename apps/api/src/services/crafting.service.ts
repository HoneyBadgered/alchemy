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
    // Get player state to check level
    const playerState = await prisma.playerState.findUnique({
      where: { userId },
    });

    if (!playerState) {
      throw new Error('Player state not found');
    }

    // Get all active recipes
    const recipes = await prisma.recipe.findMany({
      where: {
        isActive: true,
      },
      orderBy: { requiredLevel: 'asc' },
    });

    return recipes;
  }

  async craft(userId: string, input: CraftInput) {
    const { recipeId } = input;

    // Get recipe
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe || !recipe.isActive) {
      throw new Error('Recipe not found');
    }

    // Get player state and inventory
    const [playerState, inventory] = await Promise.all([
      prisma.playerState.findUnique({
        where: { userId },
      }),
      prisma.playerInventory.findMany({
        where: { userId },
      }),
    ]);

    if (!playerState) {
      throw new Error('Player state not found');
    }

    // Convert inventory to array for canCraftRecipe
    const inventoryArray = inventory.map((item: any) => ({
      itemId: item.itemId,
      quantity: item.quantity,
    }));

    // Check if can craft
    const craftCheck = canCraftRecipe(
      recipe,
      playerState.level,
      inventoryArray
    );

    if (!craftCheck.canCraft) {
      throw new Error(craftCheck.reason || 'Cannot craft this recipe. Check level and ingredients.');
    }

    // Perform crafting logic
    const ingredients = recipe.ingredients as Array<{ ingredientId: string; quantity: number }>;
    
    // Start a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Consume ingredients
      for (const ingredient of ingredients) {
        const existing = await tx.playerInventory.findUnique({
          where: {
            userId_itemId: {
              userId,
              itemId: ingredient.ingredientId,
            },
          },
        });

        if (!existing || existing.quantity < ingredient.quantity) {
          throw new Error(`Insufficient ${ingredient.ingredientId}`);
        }

        if (existing.quantity === ingredient.quantity) {
          await tx.playerInventory.delete({
            where: {
              userId_itemId: {
                userId,
                itemId: ingredient.ingredientId,
              },
            },
          });
        } else {
          await tx.playerInventory.update({
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
      await tx.playerInventory.upsert({
        where: {
          userId_itemId: {
            userId,
            itemId: recipe.resultItemId,
          },
        },
        create: {
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
      await tx.playerState.update({
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
