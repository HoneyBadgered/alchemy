/**
 * GamificationService Unit Tests
 */

import { GamificationService } from '../services/gamification.service';

// Mock Prisma Client
jest.mock('../utils/prisma', () => {
  const mockPrisma = {
    playerState: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    playerQuest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    playerInventory: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    playerCosmetics: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  return {
    prisma: mockPrisma,
  };
});

// Mock getLevelFromTotalXp from @alchemy/core
jest.mock('@alchemy/core', () => ({
  getLevelFromTotalXp: jest.fn((totalXp: number) => {
    // Simple mock implementation
    if (totalXp < 282) return 1;
    if (totalXp < 861) return 2;
    if (totalXp < 1657) return 3;
    return Math.floor(totalXp / 500);
  }),
}));

describe('GamificationService', () => {
  let gamificationService: GamificationService;
  let mockPrisma: any;

  beforeEach(() => {
    gamificationService = new GamificationService();
    mockPrisma = require('../utils/prisma').prisma;
    jest.clearAllMocks();
  });

  describe('getProgress', () => {
    it('should return player progress', async () => {
      const mockPlayerState = {
        userId: 'user-1',
        level: 5,
        xp: 100,
        totalXp: 1000,
        currentStreak: 3,
        longestStreak: 10,
        lastLoginAt: new Date('2024-01-01'),
        lastDailyRewardAt: new Date('2024-01-01'),
      };

      mockPrisma.player_states.findUnique.mockResolvedValue(mockPlayerState);

      const result = await gamificationService.getProgress('user-1');

      expect(result).toEqual({
        level: 5,
        xp: 100,
        totalXp: 1000,
        currentStreak: 3,
        longestStreak: 10,
        lastLoginAt: mockPlayerState.lastLoginAt,
        lastDailyRewardAt: mockPlayerState.lastDailyRewardAt,
      });
    });

    it('should throw error if player state not found', async () => {
      mockPrisma.player_states.findUnique.mockResolvedValue(null);

      await expect(
        gamificationService.getProgress('user-1')
      ).rejects.toThrow('Player state not found');
    });
  });

  describe('getQuests', () => {
    it('should return player quests with details', async () => {
      const mockPlayerState = {
        userId: 'user-1',
        level: 5,
      };

      const mockPlayerQuests = [
        {
          id: 'pq-1',
          questId: 'quest-1',
          userId: 'user-1',
          status: 'active',
          progress: 3,
          startedAt: new Date('2024-01-01'),
          completedAt: null,
          claimedAt: null,
          quest: {
            id: 'quest-1',
            name: 'First Steps',
            description: 'Complete your first craft',
            questType: 'craft',
            xpReward: 100,
            ingredientRewards: [],
            cosmeticRewards: [],
          },
        },
      ];

      mockPrisma.player_states.findUnique.mockResolvedValue(mockPlayerState);
      mockPrisma.playerQuest.findMany.mockResolvedValue(mockPlayerQuests);

      const result = await gamificationService.getQuests('user-1');

      expect(result.length).toBe(1);
      expect(result[0].questId).toBe('quest-1');
      expect(result[0].name).toBe('First Steps');
      expect(result[0].status).toBe('active');
    });

    it('should throw error if player state not found', async () => {
      mockPrisma.player_states.findUnique.mockResolvedValue(null);

      await expect(
        gamificationService.getQuests('user-1')
      ).rejects.toThrow('Player state not found');
    });
  });

  describe('claimQuest', () => {
    const mockQuest = {
      id: 'quest-1',
      name: 'First Steps',
      description: 'Complete your first craft',
      questType: 'craft',
      xpReward: 100,
      ingredientRewards: [
        { ingredientId: 'herb-1', quantity: 5 },
      ],
      cosmeticRewards: ['theme-1'],
    };

    const mockPlayerQuest = {
      id: 'pq-1',
      questId: 'quest-1',
      userId: 'user-1',
      status: 'completed',
      progress: 5,
      startedAt: new Date('2024-01-01'),
      completedAt: new Date('2024-01-02'),
      claimedAt: null,
      quest: mockQuest,
    };

    const mockPlayerState = {
      userId: 'user-1',
      level: 2,
      xp: 500,
      totalXp: 800,
    };

    it('should throw error if quest not found', async () => {
      mockPrisma.playerQuest.findUnique.mockResolvedValue(null);

      await expect(
        gamificationService.claimQuest('user-1', 'quest-1')
      ).rejects.toThrow('Quest not found');
    });

    it('should throw error if quest not completed', async () => {
      mockPrisma.playerQuest.findUnique.mockResolvedValue({
        ...mockPlayerQuest,
        status: 'active',
      });

      await expect(
        gamificationService.claimQuest('user-1', 'quest-1')
      ).rejects.toThrow('Quest is not completed yet');
    });

    it('should throw error if quest already claimed', async () => {
      mockPrisma.playerQuest.findUnique.mockResolvedValue({
        ...mockPlayerQuest,
        claimedAt: new Date('2024-01-03'),
      });

      await expect(
        gamificationService.claimQuest('user-1', 'quest-1')
      ).rejects.toThrow('Quest reward already claimed');
    });

    it('should successfully claim quest rewards', async () => {
      mockPrisma.playerQuest.findUnique.mockResolvedValue(mockPlayerQuest);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        mockPrisma.player_states.findUnique.mockResolvedValue(mockPlayerState);
        mockPrisma.playerCosmetics.findUnique.mockResolvedValue({
          userId: 'user-1',
          unlockedThemes: [],
        });
        return await callback(mockPrisma);
      });

      const result = await gamificationService.claimQuest('user-1', 'quest-1');

      expect(result.success).toBe(true);
      expect(result.xpGained).toBe(100);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should award ingredient rewards when claiming quest', async () => {
      mockPrisma.playerQuest.findUnique.mockResolvedValue(mockPlayerQuest);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        mockPrisma.player_states.findUnique.mockResolvedValue(mockPlayerState);
        mockPrisma.playerCosmetics.findUnique.mockResolvedValue({
          userId: 'user-1',
          unlockedThemes: [],
        });
        return await callback(mockPrisma);
      });

      await gamificationService.claimQuest('user-1', 'quest-1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getInventory', () => {
    it('should return player inventory sorted by type and date', async () => {
      const mockInventory = [
        {
          id: 'inv-1',
          userId: 'user-1',
          itemId: 'herb-1',
          itemType: 'ingredient',
          quantity: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'inv-2',
          userId: 'user-1',
          itemId: 'potion-1',
          itemType: 'blend',
          quantity: 2,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockPrisma.playerInventory.findMany.mockResolvedValue(mockInventory);

      const result = await gamificationService.getInventory('user-1');

      expect(result.length).toBe(2);
      expect(result[0].itemId).toBe('herb-1');
      expect(result[0].itemType).toBe('ingredient');
      expect(mockPrisma.playerInventory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: [
          { itemType: 'asc' },
          { createdAt: 'desc' },
        ],
      });
    });

    it('should return empty array if no inventory items', async () => {
      mockPrisma.playerInventory.findMany.mockResolvedValue([]);

      const result = await gamificationService.getInventory('user-1');

      expect(result.length).toBe(0);
    });
  });
});
