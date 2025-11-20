/**
 * Cosmetics Service Tests
 */

import { CosmeticsService } from '../services/cosmetics.service';

// Mock Prisma client
jest.mock('../utils/prisma', () => ({
  prisma: {
    theme: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    tableSkin: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    playerCosmetics: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    playerState: {
      findUnique: jest.fn(),
    },
  },
}));

describe('CosmeticsService', () => {
  let cosmeticsService: CosmeticsService;

  beforeEach(() => {
    cosmeticsService = new CosmeticsService();
    jest.clearAllMocks();
  });

  describe('getThemes', () => {
    it('should return all active themes', async () => {
      const { prisma } = require('../utils/prisma');
      const mockThemes = [
        { id: '1', name: 'Classic', isActive: true, requiredLevel: 1 },
        { id: '2', name: 'Dark', isActive: true, requiredLevel: 5 },
      ];

      prisma.theme.findMany.mockResolvedValue(mockThemes);

      const result = await cosmeticsService.getThemes();

      expect(result).toEqual(mockThemes);
      expect(prisma.theme.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { requiredLevel: 'asc' },
      });
    });
  });

  describe('getThemeSkins', () => {
    it('should return skins for a theme', async () => {
      const { prisma } = require('../utils/prisma');
      const mockTheme = { id: '1', name: 'Classic', isActive: true };
      const mockSkins = [
        { id: 's1', name: 'Oak', themeId: '1', isActive: true },
      ];

      prisma.theme.findUnique.mockResolvedValue(mockTheme);
      prisma.tableSkin.findMany.mockResolvedValue(mockSkins);

      const result = await cosmeticsService.getThemeSkins('1');

      expect(result).toEqual(mockSkins);
      expect(prisma.tableSkin.findMany).toHaveBeenCalledWith({
        where: { themeId: '1', isActive: true },
        orderBy: { requiredLevel: 'asc' },
      });
    });

    it('should throw error if theme not found', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.theme.findUnique.mockResolvedValue(null);

      await expect(cosmeticsService.getThemeSkins('999')).rejects.toThrow('Theme not found');
    });
  });

  describe('getMyCosmetics', () => {
    it('should return player cosmetics', async () => {
      const { prisma } = require('../utils/prisma');
      const mockCosmetics = {
        userId: 'user1',
        unlockedThemes: ['1', '2'],
        unlockedSkins: ['s1'],
        activeThemeId: '1',
        activeTableSkinId: 's1',
      };

      prisma.playerCosmetics.findUnique.mockResolvedValue(mockCosmetics);

      const result = await cosmeticsService.getMyCosmetics('user1');

      expect(result).toEqual({
        unlockedThemes: ['1', '2'],
        unlockedSkins: ['s1'],
        activeThemeId: '1',
        activeTableSkinId: 's1',
      });
    });

    it('should throw error if cosmetics not found', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.playerCosmetics.findUnique.mockResolvedValue(null);

      await expect(cosmeticsService.getMyCosmetics('user1')).rejects.toThrow('Player cosmetics not found');
    });
  });
});
