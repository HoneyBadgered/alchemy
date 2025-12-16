/**
 * Achievements Service
 * Handles user achievements and badges
 */

import { prisma } from '../utils/prisma';
import type { Prisma } from '@prisma/client';
import crypto from 'crypto';

export interface AchievementProgress {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
  earned: boolean;
  earnedAt: Date | null;
  progress: number;
  targetValue: number;
  progressPercentage: number;
  xpReward: number;
  pointsReward: number;
  isSecret: boolean;
}

export class AchievementsService {
  /**
   * Get all achievements for a user with their progress
   */
  async getAchievements(userId: string): Promise<AchievementProgress[]> {
    // Get all active achievements
    const achievements = await prisma.achievements.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { triggerValue: 'asc' },
      ],
    });

    // Get user's achievement progress
    const userAchievements = await prisma.user_achievements.findMany({
      where: { userId },
    });

    const userAchievementMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua])
    );

    return achievements.map((achievement) => {
      const userAchievement = userAchievementMap.get(achievement.id);
      const earned = !!userAchievement?.earnedAt;
      const progress = userAchievement?.progress || 0;

      // Don't show secret achievements unless earned
      if (achievement.isSecret && !earned) {
        return {
          id: achievement.id,
          name: '???',
          description: 'A secret achievement awaits...',
          iconUrl: null,
          category: achievement.category,
          earned: false,
          earnedAt: null,
          progress: 0,
          targetValue: achievement.triggerValue,
          progressPercentage: 0,
          xpReward: achievement.xpReward,
          pointsReward: achievement.pointsReward,
          isSecret: true,
        };
      }

      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        iconUrl: achievement.iconUrl,
        category: achievement.category,
        earned,
        earnedAt: userAchievement?.earnedAt || null,
        progress: earned ? achievement.triggerValue : progress,
        targetValue: achievement.triggerValue,
        progressPercentage: earned 
          ? 100 
          : Math.min(100, Math.round((progress / achievement.triggerValue) * 100)),
        xpReward: achievement.xpReward,
        pointsReward: achievement.pointsReward,
        isSecret: achievement.isSecret,
      };
    });
  }

  /**
   * Get earned achievements (badges) for a user
   */
  async getEarnedAchievements(userId: string) {
    const earned = await prisma.user_achievements.findMany({
      where: {
        userId,
        earnedAt: { not: null },
      },
      include: {
        achievements: true,
      },
      orderBy: { earnedAt: 'desc' },
    });

    return earned.map((ua) => ({
      id: ua.achievements.id,
      name: ua.achievements.name,
      description: ua.achievements.description,
      iconUrl: ua.achievements.iconUrl,
      category: ua.achievements.category,
      earnedAt: ua.earnedAt,
      xpReward: ua.achievements.xpReward,
      pointsReward: ua.achievements.pointsReward,
    }));
  }

  /**
   * Get achievements in progress (not yet earned)
   */
  async getAchievementsInProgress(userId: string) {
    const achievements = await this.getAchievements(userId);
    return achievements.filter((a) => !a.earned && a.progressPercentage > 0);
  }

  /**
   * Update progress for an achievement
   */
  async updateProgress(userId: string, achievementId: string, newProgress: number) {
    const achievement = await prisma.achievements.findUnique({
      where: { id: achievementId },
    });

    if (!achievement || !achievement.isActive) {
      throw new Error('Achievement not found');
    }

    const existing = await prisma.user_achievements.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    // If already earned, don't update
    if (existing?.earnedAt) {
      return { alreadyEarned: true };
    }

    const shouldAward = newProgress >= achievement.triggerValue;

    if (!existing) {
      // Create new progress record
      await prisma.user_achievements.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          achievementId,
          progress: newProgress,
          earnedAt: shouldAward ? new Date() : null,
        },
      });
    } else {
      // Update existing progress
      await prisma.user_achievements.update({
        where: {
          userId_achievementId: {
            userId,
            achievementId,
          },
        },
        data: {
          progress: newProgress,
          earnedAt: shouldAward ? new Date() : null,
        },
      });
    }

    if (shouldAward) {
      // Award XP and points
      await this.awardAchievementRewards(userId, achievement);
      return {
        earned: true,
        achievement: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          xpReward: achievement.xpReward,
          pointsReward: achievement.pointsReward,
        },
      };
    }

    return {
      earned: false,
      progress: newProgress,
      targetValue: achievement.triggerValue,
    };
  }

  /**
   * Check and update achievements based on a trigger
   */
  async checkAchievements(userId: string, triggerType: string, value: number) {
    // Get all achievements for this trigger type
    const achievements = await prisma.achievements.findMany({
      where: {
        triggerType,
        isActive: true,
      },
    });

    const results = [];

    for (const achievement of achievements) {
      const existing = await prisma.user_achievements.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
      });

      // Skip if already earned
      if (existing?.earnedAt) {
        continue;
      }

      const result = await this.updateProgress(userId, achievement.id, value);
      if (result.earned) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Award XP and points for earning an achievement
   */
  private async awardAchievementRewards(
    userId: string,
    achievement: { id: string; name: string; xpReward: number; pointsReward: number }
  ) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Award XP
      if (achievement.xpReward > 0) {
        await tx.player_states.update({
          where: { userId },
          data: {
            xp: { increment: achievement.xpReward },
            totalXp: { increment: achievement.xpReward },
          },
        });
      }

      // Award points
      if (achievement.pointsReward > 0) {
        const rewardPoints = await tx.reward_points.findUnique({
          where: { userId },
        });

        if (rewardPoints) {
          await tx.reward_points.update({
            where: { userId },
            data: {
              balance: { increment: achievement.pointsReward },
              lifetimeEarned: { increment: achievement.pointsReward },
            },
          });
        } else {
          await tx.reward_points.create({
            data: {
              id: crypto.randomUUID(),
              userId,
              balance: achievement.pointsReward,
              lifetimeEarned: achievement.pointsReward,
              updatedAt: new Date(),
            },
          });
        }

        // Record in history
        await tx.reward_history.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            type: 'earned',
            points: achievement.pointsReward,
            description: `Achievement unlocked: ${achievement.name}`,
          },
        });
      }
    });
  }

  /**
   * Get achievement statistics for a user
   */
  async getAchievementStats(userId: string) {
    const [totalAchievements, earnedCount, inProgressCount] = await Promise.all([
      prisma.achievements.count({ where: { isActive: true } }),
      prisma.user_achievements.count({
        where: {
          userId,
          earnedAt: { not: null },
        },
      }),
      prisma.user_achievements.count({
        where: {
          userId,
          earnedAt: null,
          progress: { gt: 0 },
        },
      }),
    ]);

    // Get total XP and points earned from achievements
    const earnedAchievements = await prisma.user_achievements.findMany({
      where: {
        userId,
        earnedAt: { not: null },
      },
      include: {
        achievements: {
          select: {
            xpReward: true,
            pointsReward: true,
          },
        },
      },
    });

    const totalXpEarned = earnedAchievements.reduce(
      (sum, ua) => sum + ua.achievements.xpReward,
      0
    );
    const totalPointsEarned = earnedAchievements.reduce(
      (sum, ua) => sum + ua.achievements.pointsReward,
      0
    );

    return {
      total: totalAchievements,
      earned: earnedCount,
      inProgress: inProgressCount,
      remaining: totalAchievements - earnedCount,
      completionPercentage: Math.round((earnedCount / totalAchievements) * 100),
      totalXpEarned,
      totalPointsEarned,
    };
  }
}
