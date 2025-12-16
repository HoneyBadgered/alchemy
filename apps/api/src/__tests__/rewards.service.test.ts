/**
 * Rewards Service Tests
 */

import { RewardsService } from '../services/rewards.service';

// Mock dependencies
jest.mock('../utils/prisma', () => ({
  prisma: {
    rewardPoints: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    rewardHistory: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    reward: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(require('../utils/prisma').prisma)),
  },
}));

describe('RewardsService', () => {
  let rewardsService: RewardsService;

  beforeEach(() => {
    rewardsService = new RewardsService();
    jest.clearAllMocks();
  });

  describe('getRewardPoints', () => {
    it('should return existing reward points with tier info', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.reward_points.findUnique.mockResolvedValue({
        userId: 'user_123',
        balance: 500,
        lifetimeEarned: 750,
        tier: 'Adept',
        tierUpdatedAt: new Date(),
      });

      const result = await rewardsService.getRewardPoints('user_123');

      expect(result.balance).toBe(500);
      expect(result.tier).toBe('Adept');
      expect(result.nextTier).toBe('Alchemist');
      expect(result.pointsToNextTier).toBe(1250); // 2000 - 750
    });

    it('should create reward points if not exists', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.reward_points.findUnique.mockResolvedValue(null);
      prisma.reward_points.create.mockResolvedValue({
        userId: 'user_123',
        balance: 0,
        lifetimeEarned: 0,
        tier: 'Novice',
        tierUpdatedAt: new Date(),
      });

      const result = await rewardsService.getRewardPoints('user_123');

      expect(result.balance).toBe(0);
      expect(result.tier).toBe('Novice');
      expect(result.nextTier).toBe('Adept');
      expect(prisma.reward_points.create).toHaveBeenCalled();
    });

    it('should return null for next tier at Grandmaster', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.reward_points.findUnique.mockResolvedValue({
        userId: 'user_123',
        balance: 15000,
        lifetimeEarned: 15000,
        tier: 'Grandmaster',
        tierUpdatedAt: new Date(),
      });

      const result = await rewardsService.getRewardPoints('user_123');

      expect(result.tier).toBe('Grandmaster');
      expect(result.nextTier).toBeNull();
      expect(result.pointsToNextTier).toBeNull();
      expect(result.progressToNextTier).toBe(100);
    });
  });

  describe('getRewardHistory', () => {
    it('should return paginated history', async () => {
      const { prisma } = require('../utils/prisma');
      
      const mockHistory = [
        { id: '1', type: 'earned', points: 100, description: 'Purchase', createdAt: new Date() },
        { id: '2', type: 'redeemed', points: -50, description: 'Reward', createdAt: new Date() },
      ];

      prisma.rewards.history.findMany.mockResolvedValue(mockHistory);
      prisma.rewards.history.count.mockResolvedValue(10);

      const result = await rewardsService.getRewardHistory('user_123', { page: 1, perPage: 2 });

      expect(result.history).toHaveLength(2);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.totalPages).toBe(5);
    });
  });

  describe('addPoints', () => {
    it('should add points and update tier', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.reward_points.findUnique.mockResolvedValue({
        userId: 'user_123',
        balance: 400,
        lifetimeEarned: 400,
        tier: 'Novice',
      });
      prisma.reward_points.update.mockResolvedValue({
        balance: 600,
        tier: 'Adept',
      });

      const result = await rewardsService.addPoints('user_123', {
        points: 200,
        description: 'Order #123',
        orderId: 'order_123',
      });

      expect(result.pointsAdded).toBe(200);
      expect(result.tierUpdated).toBe(true);
      expect(prisma.rewards.history.create).toHaveBeenCalled();
    });

    it('should reject non-positive points', async () => {
      await expect(
        rewardsService.addPoints('user_123', {
          points: 0,
          description: 'Invalid',
        })
      ).rejects.toThrow('Points must be positive');

      await expect(
        rewardsService.addPoints('user_123', {
          points: -10,
          description: 'Invalid',
        })
      ).rejects.toThrow('Points must be positive');
    });

    it('should create reward points record if not exists', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.reward_points.findUnique.mockResolvedValue(null);
      prisma.reward_points.create.mockResolvedValue({
        userId: 'user_123',
        balance: 0,
        lifetimeEarned: 0,
        tier: 'Novice',
      });
      prisma.reward_points.update.mockResolvedValue({
        balance: 100,
        tier: 'Novice',
      });

      await rewardsService.addPoints('user_123', {
        points: 100,
        description: 'Welcome bonus',
      });

      expect(prisma.reward_points.create).toHaveBeenCalled();
    });
  });

  describe('deductPoints', () => {
    it('should deduct points from balance', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.reward_points.findUnique.mockResolvedValue({
        userId: 'user_123',
        balance: 500,
        tier: 'Adept',
      });
      prisma.reward_points.update.mockResolvedValue({
        balance: 400,
      });

      const result = await rewardsService.deductPoints('user_123', 100, 'Reward redemption');

      expect(result.pointsDeducted).toBe(100);
      expect(result.balance).toBe(400);
    });

    it('should reject if insufficient balance', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.reward_points.findUnique.mockResolvedValue({
        userId: 'user_123',
        balance: 50,
      });

      await expect(
        rewardsService.deductPoints('user_123', 100, 'Reward')
      ).rejects.toThrow('Insufficient points balance');
    });
  });

  describe('getAvailableRewards', () => {
    it('should return rewards with eligibility status', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.reward_points.findUnique.mockResolvedValue({
        userId: 'user_123',
        balance: 300,
        tier: 'Adept',
      });

      prisma.rewards.findMany.mockResolvedValue([
        { id: '1', name: 'Free Tea', pointsCost: 100, minimumTier: 'Novice', isActive: true },
        { id: '2', name: 'Premium Tea', pointsCost: 500, minimumTier: 'Novice', isActive: true },
        { id: '3', name: 'Exclusive', pointsCost: 200, minimumTier: 'Master', isActive: true },
      ]);

      const result = await rewardsService.getAvailableRewards('user_123');

      expect(result).toHaveLength(3);
      expect(result[0].canRedeem).toBe(true); // Can afford and eligible
      expect(result[1].canRedeem).toBe(false); // Can't afford
      expect(result[2].canRedeem).toBe(false); // Not eligible (tier too low)
    });
  });

  describe('redeemReward', () => {
    it('should redeem reward successfully', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.rewards.findUnique.mockResolvedValue({
        id: 'reward_123',
        name: 'Free Tea',
        pointsCost: 100,
        minimumTier: 'Novice',
        isActive: true,
        stock: 10,
        discountType: 'percentage',
        discountValue: 10,
      });

      prisma.reward_points.findUnique.mockResolvedValue({
        userId: 'user_123',
        balance: 500,
        tier: 'Adept',
      });

      prisma.reward_points.update.mockResolvedValue({});
      prisma.rewards.update.mockResolvedValue({});

      const result = await rewardsService.redeemReward('user_123', { rewardId: 'reward_123' });

      expect(result.success).toBe(true);
      expect(result.pointsSpent).toBe(100);
      expect(result.reward.name).toBe('Free Tea');
    });

    it('should reject if reward not found', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.rewards.findUnique.mockResolvedValue(null);

      await expect(
        rewardsService.redeemReward('user_123', { rewardId: 'invalid' })
      ).rejects.toThrow('Reward not found');
    });

    it('should reject if out of stock', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.rewards.findUnique.mockResolvedValue({
        id: 'reward_123',
        name: 'Limited Edition',
        pointsCost: 100,
        minimumTier: 'Novice',
        isActive: true,
        stock: 0,
      });

      await expect(
        rewardsService.redeemReward('user_123', { rewardId: 'reward_123' })
      ).rejects.toThrow('Reward is out of stock');
    });

    it('should reject if insufficient points', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.rewards.findUnique.mockResolvedValue({
        id: 'reward_123',
        name: 'Expensive Tea',
        pointsCost: 1000,
        minimumTier: 'Novice',
        isActive: true,
        stock: null,
      });

      prisma.reward_points.findUnique.mockResolvedValue({
        userId: 'user_123',
        balance: 100,
        tier: 'Novice',
      });

      await expect(
        rewardsService.redeemReward('user_123', { rewardId: 'reward_123' })
      ).rejects.toThrow('Insufficient points balance');
    });

    it('should reject if tier too low', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.rewards.findUnique.mockResolvedValue({
        id: 'reward_123',
        name: 'Master Only',
        pointsCost: 100,
        minimumTier: 'Master',
        isActive: true,
        stock: null,
      });

      prisma.reward_points.findUnique.mockResolvedValue({
        userId: 'user_123',
        balance: 500,
        tier: 'Adept',
      });

      await expect(
        rewardsService.redeemReward('user_123', { rewardId: 'reward_123' })
      ).rejects.toThrow('This reward requires Master tier or higher');
    });
  });
});
