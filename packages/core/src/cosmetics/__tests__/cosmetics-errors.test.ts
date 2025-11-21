import {
  canUseTheme,
  canUseSkin,
  getUnlockableThemes,
  getUnlockableSkins,
} from '../index';
import type { Theme, TableSkin, PlayerCosmetics } from '../../types';

describe('Cosmetics System - Error Handling', () => {
  const validTheme: Theme = {
    id: 'theme-1',
    name: 'Dark Theme',
    requiredLevel: 1,
  };

  const validSkin: TableSkin = {
    id: 'skin-1',
    name: 'Wooden Table',
    themeId: 'theme-1',
    requiredLevel: 1,
  };

  const validPlayerCosmetics: PlayerCosmetics = {
    unlockedThemes: [],
    unlockedSkins: [],
  };

  const validCompletedQuestIds: string[] = [];

  describe('canUseTheme - Error Cases', () => {
    it('should throw error when theme is null', () => {
      expect(() => canUseTheme(null as any, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Theme is required');
    });

    it('should throw error when theme is undefined', () => {
      expect(() => canUseTheme(undefined as any, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Theme is required');
    });

    it('should throw error when playerLevel is negative', () => {
      expect(() => canUseTheme(validTheme, -1, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is zero', () => {
      expect(() => canUseTheme(validTheme, 0, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is not a number', () => {
      expect(() => canUseTheme(validTheme, 'not-a-number' as any, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is NaN', () => {
      expect(() => canUseTheme(validTheme, NaN, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is Infinity', () => {
      expect(() => canUseTheme(validTheme, Infinity, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerCosmetics is null', () => {
      expect(() => canUseTheme(validTheme, 5, null as any, validCompletedQuestIds)).toThrow('Player cosmetics is required');
    });

    it('should throw error when playerCosmetics is undefined', () => {
      expect(() => canUseTheme(validTheme, 5, undefined as any, validCompletedQuestIds)).toThrow('Player cosmetics is required');
    });

    it('should throw error when completedQuestIds is null', () => {
      expect(() => canUseTheme(validTheme, 5, validPlayerCosmetics, null as any)).toThrow('Completed quest IDs array is required');
    });

    it('should throw error when completedQuestIds is undefined', () => {
      expect(() => canUseTheme(validTheme, 5, validPlayerCosmetics, undefined as any)).toThrow('Completed quest IDs array is required');
    });

    it('should throw error when completedQuestIds is not an array', () => {
      expect(() => canUseTheme(validTheme, 5, validPlayerCosmetics, 'not-an-array' as any)).toThrow('Completed quest IDs must be an array');
    });

    it('should throw error when playerCosmetics.unlockedThemes is not an array', () => {
      const invalidCosmetics = { ...validPlayerCosmetics, unlockedThemes: 'not-an-array' as any };
      expect(() => canUseTheme(validTheme, 5, invalidCosmetics, validCompletedQuestIds)).toThrow('Player cosmetics unlockedThemes must be an array');
    });

    it('should throw error when theme requiredLevel is negative', () => {
      const invalidTheme = { ...validTheme, requiredLevel: -1 };
      expect(() => canUseTheme(invalidTheme, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Theme required level must be a positive number');
    });

    it('should throw error when theme requiredLevel is zero', () => {
      const invalidTheme = { ...validTheme, requiredLevel: 0 };
      expect(() => canUseTheme(invalidTheme, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Theme required level must be a positive number');
    });

    it('should throw error when theme requiredLevel is not a number', () => {
      const invalidTheme = { ...validTheme, requiredLevel: 'not-a-number' as any };
      expect(() => canUseTheme(invalidTheme, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Theme required level must be a positive number');
    });
  });

  describe('canUseSkin - Error Cases', () => {
    it('should throw error when skin is null', () => {
      expect(() => canUseSkin(null as any, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Table skin is required');
    });

    it('should throw error when skin is undefined', () => {
      expect(() => canUseSkin(undefined as any, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Table skin is required');
    });

    it('should throw error when playerLevel is negative', () => {
      expect(() => canUseSkin(validSkin, -1, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is zero', () => {
      expect(() => canUseSkin(validSkin, 0, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is not a number', () => {
      expect(() => canUseSkin(validSkin, 'not-a-number' as any, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerCosmetics is null', () => {
      expect(() => canUseSkin(validSkin, 5, null as any, validCompletedQuestIds)).toThrow('Player cosmetics is required');
    });

    it('should throw error when playerCosmetics is undefined', () => {
      expect(() => canUseSkin(validSkin, 5, undefined as any, validCompletedQuestIds)).toThrow('Player cosmetics is required');
    });

    it('should throw error when completedQuestIds is null', () => {
      expect(() => canUseSkin(validSkin, 5, validPlayerCosmetics, null as any)).toThrow('Completed quest IDs array is required');
    });

    it('should throw error when completedQuestIds is undefined', () => {
      expect(() => canUseSkin(validSkin, 5, validPlayerCosmetics, undefined as any)).toThrow('Completed quest IDs array is required');
    });

    it('should throw error when completedQuestIds is not an array', () => {
      expect(() => canUseSkin(validSkin, 5, validPlayerCosmetics, 'not-an-array' as any)).toThrow('Completed quest IDs must be an array');
    });

    it('should throw error when playerCosmetics.unlockedSkins is not an array', () => {
      const invalidCosmetics = { ...validPlayerCosmetics, unlockedSkins: 'not-an-array' as any };
      expect(() => canUseSkin(validSkin, 5, invalidCosmetics, validCompletedQuestIds)).toThrow('Player cosmetics unlockedSkins must be an array');
    });

    it('should throw error when skin requiredLevel is negative', () => {
      const invalidSkin = { ...validSkin, requiredLevel: -1 };
      expect(() => canUseSkin(invalidSkin, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Skin required level must be a positive number');
    });

    it('should throw error when skin requiredLevel is zero', () => {
      const invalidSkin = { ...validSkin, requiredLevel: 0 };
      expect(() => canUseSkin(invalidSkin, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Skin required level must be a positive number');
    });
  });

  describe('getUnlockableThemes - Error Cases', () => {
    it('should throw error when themes is null', () => {
      expect(() => getUnlockableThemes(null as any, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Themes array is required');
    });

    it('should throw error when themes is undefined', () => {
      expect(() => getUnlockableThemes(undefined as any, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Themes array is required');
    });

    it('should throw error when themes is not an array', () => {
      expect(() => getUnlockableThemes('not-an-array' as any, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Themes must be an array');
    });

    it('should throw error when playerLevel is invalid', () => {
      expect(() => getUnlockableThemes([validTheme], -1, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Player level must be a positive number');
    });

    it('should handle empty themes array', () => {
      expect(getUnlockableThemes([], 5, validPlayerCosmetics, validCompletedQuestIds)).toEqual([]);
    });
  });

  describe('getUnlockableSkins - Error Cases', () => {
    it('should throw error when skins is null', () => {
      expect(() => getUnlockableSkins(null as any, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Skins array is required');
    });

    it('should throw error when skins is undefined', () => {
      expect(() => getUnlockableSkins(undefined as any, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Skins array is required');
    });

    it('should throw error when skins is not an array', () => {
      expect(() => getUnlockableSkins('not-an-array' as any, 5, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Skins must be an array');
    });

    it('should throw error when playerLevel is invalid', () => {
      expect(() => getUnlockableSkins([validSkin], -1, validPlayerCosmetics, validCompletedQuestIds)).toThrow('Player level must be a positive number');
    });

    it('should handle empty skins array', () => {
      expect(getUnlockableSkins([], 5, validPlayerCosmetics, validCompletedQuestIds)).toEqual([]);
    });
  });
});
