/**
 * Gamification Service
 */

import { prisma } from '../utils/prisma';
import { getLevelFromTotalXp } from '@alchemy/core';
import type { Prisma } from '@prisma/client';

export class GamificationService {
  async getProgress(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const playerState = await prisma.player_states.findUnique({
      where: { userId },
    });

    if (!playerState) {
      const error = new Error('Player state not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return {
      level: playerState.level,
      xp: playerState.xp,
      totalXp: playerState.totalXp,
      currentStreak: playerState.currentStreak,
      longestStreak: playerState.longestStreak,
      lastLoginAt: playerState.lastLoginAt,
      lastDailyRewardAt: playerState.lastDailyRewardAt,
    };
  }

  async getQuests(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get player state to check level
    const playerState = await prisma.player_states.findUnique({
      where: { userId },
    });

    if (!playerState) {
      const error = new Error('Player state not found');
      (error as any).statusCode = 404;
      throw error;
    }

    // Get player quests
    const playerQuests = await prisma.player_quests.findMany({
      where: { userId },
      include: {
        quest: true,
      },
    });

    return playerQuests.map((pq: any) => ({
      id: pq.id,
      questId: pq.questId,
      name: pq.quest.name,
      description: pq.quest.description,
      questType: pq.quest.questType,
      status: pq.status,
      progress: pq.progress,
      xpReward: pq.quest.xpReward,
      ingredientRewards: pq.quest.ingredientRewards,
      cosmeticRewards: pq.quest.cosmeticRewards,
      startedAt: pq.startedAt,
      completedAt: pq.completedAt,
      claimedAt: pq.claimedAt,
    }));
  }

  async claimQuest(userId: string, questId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!questId) {
      throw new Error('Quest ID is required');
    }

    // Get player quest
    const playerQuest = await prisma.player_quests.findUnique({
      where: {
        userId_questId: {
          userId,
          questId,
        },
      },
      include: {
        quest: true,
      },
    });

    if (!playerQuest) {
      const error = new Error('Quest not found');
      (error as any).statusCode = 404;
      throw error;
    }

    if (playerQuest.status !== 'completed') {
      const error = new Error('Quest is not completed yet');
      (error as any).statusCode = 422;
      throw error;
    }

    if (playerQuest.claimedAt) {
      const error = new Error('Quest reward already claimed');
      (error as any).statusCode = 409;
      throw error;
    }

    // Start transaction to claim rewards
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update quest status
      await tx.playerQuest.update({
        where: {
          userId_questId: {
            userId,
            questId,
          },
        },
        data: {
          status: 'claimed',
          claimedAt: new Date(),
        },
      });

      // Award XP
      const playerState = await tx.player_states.findUnique({
        where: { userId },
      });

      if (!playerState) {
        const error = new Error('Player state not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const newTotalXp = playerState.totalXp + playerQuest.quest.xpReward;
      const newLevel = getLevelFromTotalXp(newTotalXp);

      await tx.player_states.update({
        where: { userId },
        data: {
          totalXp: newTotalXp,
          xp: playerState.xp + playerQuest.quest.xpReward,
          level: newLevel,
        },
      });

      // Award ingredient rewards
      if (playerQuest.quest.ingredientRewards) {
        const ingredients = playerQuest.quest.ingredientRewards as Array<{
          ingredientId: string;
          quantity: number;
        }>;

        for (const ingredient of ingredients) {
          await tx.playerInventory.upsert({
            where: {
              userId_itemId: {
                userId,
                itemId: ingredient.ingredientId,
              },
            },
            create: {
              userId,
              itemId: ingredient.ingredientId,
              itemType: 'ingredient',
              quantity: ingredient.quantity,
            },
            update: {
              quantity: {
                increment: ingredient.quantity,
              },
            },
          });
        }
      }

      // Award cosmetic rewards
      if (playerQuest.quest.cosmeticRewards) {
        const cosmetics = playerQuest.quest.cosmeticRewards as Array<string>;
        
        const playerCosmetics = await tx.playerCosmetics.findUnique({
          where: { userId },
        });

        if (playerCosmetics) {
          const newUnlockedThemes = [
            ...new Set([...playerCosmetics.unlockedThemes, ...cosmetics]),
          ];

          await tx.playerCosmetics.update({
            where: { userId },
            data: {
              unlockedThemes: newUnlockedThemes,
            },
          });
        }
      }

      return {
        success: true,
        xpGained: playerQuest.quest.xpReward,
      };
    });

    return result;
  }

  async getInventory(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const inventory = await prisma.player_inventory.findMany({
      where: { userId },
      orderBy: [
        { itemType: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return inventory.map((item: any) => ({
      id: item.id,
      itemId: item.itemId,
      itemType: item.itemType,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }
}
