/**
 * Rewards Service
 * Handles loyalty points, tiers, and reward redemption
 */

import { prisma } from '../utils/prisma';
import type { Prisma } from '@prisma/client';
import crypto from 'crypto';

export interface AddPointsInput {
  points: number;
  description: string;
  orderId?: string;
}

export interface RedeemRewardInput {
  rewardId: string;
}

// Tier thresholds (lifetime points earned)
const TIER_THRESHOLDS = {
  Novice: 0,
  Adept: 500,
  Alchemist: 2000,
  Master: 5000,
  Grandmaster: 10000,
};

export class RewardsService {
  /**
   * Get user's reward points and tier
   */
  async getRewardPoints(userId: string) {
    let rewardPoints = await prisma.reward_points.findUnique({
      where: { userId },
    });

    // Create reward points record if it doesn't exist
    if (!rewardPoints) {
      rewardPoints = await prisma.reward_points.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          balance: 0,
          lifetimeEarned: 0,
          tier: 'Novice',
        },
      });
    }

    // Calculate progress to next tier
    const nextTier = this.getNextTier(rewardPoints.tier);
    const nextTierThreshold = nextTier ? TIER_THRESHOLDS[nextTier as keyof typeof TIER_THRESHOLDS] : null;
    const currentTierThreshold = TIER_THRESHOLDS[rewardPoints.tier as keyof typeof TIER_THRESHOLDS];

    return {
      balance: rewardPoints.balance,
      lifetimeEarned: rewardPoints.lifetimeEarned,
      tier: rewardPoints.tier,
      tierUpdatedAt: rewardPoints.tierUpdatedAt,
      nextTier,
      pointsToNextTier: nextTierThreshold 
        ? Math.max(0, nextTierThreshold - rewardPoints.lifetimeEarned)
        : null,
      progressToNextTier: nextTierThreshold
        ? Math.min(100, Math.round(((rewardPoints.lifetimeEarned - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100))
        : 100,
    };
  }

  /**
   * Get reward history for a user
   */
  async getRewardHistory(userId: string, params: { page?: number; perPage?: number } = {}) {
    const { page = 1, perPage = 20 } = params;
    const skip = (page - 1) * perPage;

    const [history, total] = await Promise.all([
      prisma.reward_history.findMany({
        where: { userId },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reward_history.count({ where: { userId } }),
    ]);

    return {
      history,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Add points to user's balance
   */
  async addPoints(userId: string, input: AddPointsInput) {
    if (input.points <= 0) {
      throw new Error('Points must be positive');
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get or create reward points record
      let rewardPoints = await tx.reward_points.findUnique({
        where: { userId },
      });

      if (!rewardPoints) {
        rewardPoints = await tx.reward_points.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            balance: 0,
            lifetimeEarned: 0,
            tier: 'Novice',
          },
        });
      }

      // Calculate new tier
      const newLifetimeEarned = rewardPoints.lifetimeEarned + input.points;
      const newTier = this.calculateTier(newLifetimeEarned);
      const tierUpdated = newTier !== rewardPoints.tier;

      // Update points
      const updated = await tx.reward_points.update({
        where: { userId },
        data: {
          balance: { increment: input.points },
          lifetimeEarned: { increment: input.points },
          tier: newTier,
          tierUpdatedAt: tierUpdated ? new Date() : undefined,
        },
      });

      // Record history
      await tx.reward_history.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          type: 'earned',
          points: input.points,
          description: input.description,
          orderId: input.orderId,
        },
      });

      return {
        balance: updated.balance,
        pointsAdded: input.points,
        tier: updated.tier,
        tierUpdated,
      };
    });

    return result;
  }

  /**
   * Deduct points from user's balance
   */
  async deductPoints(userId: string, points: number, description: string) {
    if (points <= 0) {
      throw new Error('Points must be positive');
    }

    const rewardPoints = await prisma.reward_points.findUnique({
      where: { userId },
    });

    if (!rewardPoints || rewardPoints.balance < points) {
      throw new Error('Insufficient points balance');
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.reward_points.update({
        where: { userId },
        data: {
          balance: { decrement: points },
        },
      });

      await tx.reward_history.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          type: 'redeemed',
          points: -points,
          description,
        },
      });

      return {
        balance: updated.balance,
        pointsDeducted: points,
      };
    });

    return result;
  }

  /**
   * Get available rewards
   */
  async getAvailableRewards(userId: string) {
    const rewardPoints = await prisma.reward_points.findUnique({
      where: { userId },
    });

    const tier = rewardPoints?.tier || 'Novice';
    const tierOrder = ['Novice', 'Adept', 'Alchemist', 'Master', 'Grandmaster'];
    const userTierIndex = tierOrder.indexOf(tier);

    const rewards = await prisma.rewards.findMany({
      where: {
        isActive: true,
        OR: [
          { stock: null },
          { stock: { gt: 0 } },
        ],
      },
      orderBy: { pointsCost: 'asc' },
    });

    // Filter by tier and add eligibility status
    return rewards.map((reward) => {
      const rewardTierIndex = tierOrder.indexOf(reward.minimumTier);
      const isEligible = userTierIndex >= rewardTierIndex;
      const canAfford = (rewardPoints?.balance || 0) >= reward.pointsCost;

      return {
        ...reward,
        isEligible,
        canAfford,
        canRedeem: isEligible && canAfford,
      };
    });
  }

  /**
   * Redeem a reward
   */
  async redeemReward(userId: string, input: RedeemRewardInput) {
    const reward = await prisma.rewards.findUnique({
      where: { id: input.rewardId },
    });

    if (!reward || !reward.isActive) {
      throw new Error('Reward not found or not available');
    }

    if (reward.stock !== null && reward.stock <= 0) {
      throw new Error('Reward is out of stock');
    }

    const rewardPoints = await prisma.reward_points.findUnique({
      where: { userId },
    });

    if (!rewardPoints || rewardPoints.balance < reward.pointsCost) {
      throw new Error('Insufficient points balance');
    }

    // Check tier eligibility
    const tierOrder = ['Novice', 'Adept', 'Alchemist', 'Master', 'Grandmaster'];
    const userTierIndex = tierOrder.indexOf(rewardPoints.tier);
    const rewardTierIndex = tierOrder.indexOf(reward.minimumTier);

    if (userTierIndex < rewardTierIndex) {
      throw new Error(`This reward requires ${reward.minimumTier} tier or higher`);
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Deduct points
      await tx.reward_points.update({
        where: { userId },
        data: {
          balance: { decrement: reward.pointsCost },
        },
      });

      // Decrement stock if applicable
      if (reward.stock !== null) {
        await tx.rewards.update({
          where: { id: reward.id },
          data: {
            stock: { decrement: 1 },
          },
        });
      }

      // Record history
      await tx.reward_history.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          type: 'redeemed',
          points: -reward.pointsCost,
          description: `Redeemed: ${reward.name}`,
        },
      });

      return {
        success: true,
        reward: {
          id: reward.id,
          name: reward.name,
          discountType: reward.discountType,
          discountValue: reward.discountValue,
          productId: reward.productId,
        },
        pointsSpent: reward.pointsCost,
      };
    });

    return result;
  }

  /**
   * Calculate tier based on lifetime points
   */
  private calculateTier(lifetimePoints: number): string {
    if (lifetimePoints >= TIER_THRESHOLDS.Grandmaster) return 'Grandmaster';
    if (lifetimePoints >= TIER_THRESHOLDS.Master) return 'Master';
    if (lifetimePoints >= TIER_THRESHOLDS.Alchemist) return 'Alchemist';
    if (lifetimePoints >= TIER_THRESHOLDS.Adept) return 'Adept';
    return 'Novice';
  }

  /**
   * Get the next tier
   */
  private getNextTier(currentTier: string): string | null {
    const tierOrder = ['Novice', 'Adept', 'Alchemist', 'Master', 'Grandmaster'];
    const currentIndex = tierOrder.indexOf(currentTier);
    if (currentIndex < tierOrder.length - 1) {
      return tierOrder[currentIndex + 1];
    }
    return null;
  }
}
