/**
 * Gamification Service
 */

import { prisma } from '../utils/prisma';
import { getLevelFromTotalXp } from '@alchemy/core';
import { BadRequestError, NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import type { Prisma } from '@prisma/client';

export class GamificationService {
  async getProgress(userId: string) {
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const playerState = await prisma.player_states.findUnique({
      where: { userId },
    });

    if (!playerState) {
      throw new NotFoundError('Player state not found');
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
      throw new BadRequestError('User ID is required');
    }

    // Get player state to check level
    const playerState = await prisma.player_states.findUnique({
      where: { userId },
    });

    if (!playerState) {
      throw new NotFoundError('Player state not found');
    }

    // Get player quests
    const playerQuests = await prisma.player_quests.findMany({
      where: { userId },
      include: {
        quests: true,
      },
    });

    return playerQuests.map((pq) => ({
      id: pq.id,
      questId: pq.questId,
      name: pq.quests.name,
      description: pq.quests.description,
      questType: pq.quests.questType,
      status: pq.status,
      progress: pq.progress,
      xpReward: pq.quests.xpReward,
      ingredientRewards: pq.quests.ingredientRewards,
      cosmeticRewards: pq.quests.cosmeticRewards,
      startedAt: pq.startedAt,
      completedAt: pq.completedAt,
      claimedAt: pq.claimedAt,
    }));
  }

  async claimQuest(userId: string, questId: string) {
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    if (!questId) {
      throw new BadRequestError('Quest ID is required');
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
        quests: true,
      },
    });

    if (!playerQuest) {
      throw new NotFoundError('Quest not found');
    }

    if (playerQuest.status !== 'completed') {
      throw new ValidationError('Quest is not completed yet');
    }

    if (playerQuest.claimedAt) {
      throw new ConflictError('Quest reward already claimed');
    }

    // Start transaction to claim rewards
    const result = await prisma.$transaction(async (tx) => {
      // Update quest status
      await tx.player_quests.update({
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
        throw new NotFoundError('Player state not found');
      }

      const newTotalXp = playerState.totalXp + playerQuest.quests.xpReward;
      const newLevel = getLevelFromTotalXp(newTotalXp);

      await tx.player_states.update({
        where: { userId },
        data: {
          totalXp: newTotalXp,
          xp: playerState.xp + playerQuest.quests.xpReward,
          level: newLevel,
        },
      });

      // Award ingredient rewards
      if (playerQuest.quests.ingredientRewards) {
        const ingredients = playerQuest.quests.ingredientRewards as Array<{
          ingredientId: string;
          quantity: number;
        }>;

        for (const ingredient of ingredients) {
          await tx.player_inventory.upsert({
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
      if (playerQuest.quests.cosmeticRewards) {
        const cosmetics = playerQuest.quests.cosmeticRewards as Array<string>;
        
        const playerCosmetics = await tx.player_cosmetics.findUnique({
          where: { userId },
        });

        if (playerCosmetics) {
          const newUnlockedThemes = Array.from(
            new Set([...playerCosmetics.unlockedThemes, ...cosmetics])
          );

          await tx.player_cosmetics.update({
            where: { userId },
            data: {
              unlockedThemes: newUnlockedThemes,
            },
          });
        }
      }

      return {
        success: true,
        xpGained: playerQuest.quests.xpReward,
      };
    });

    return result;
  }

  async getInventory(userId: string) {
    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    const inventory = await prisma.player_inventory.findMany({
      where: { userId },
      orderBy: [
        { itemType: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return inventory.map((item) => ({
      id: item.id,
      itemId: item.itemId,
      itemType: item.itemType,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }
}
