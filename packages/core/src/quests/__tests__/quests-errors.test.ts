import {
  isQuestEligible,
  getAvailableQuests,
  calculateQuestXpReward,
} from '../index';
import type { Quest } from '../../types';

describe('Quest System - Error Handling', () => {
  const validQuest: Quest = {
    id: 'quest-1',
    name: 'First Steps',
    description: 'Complete your first craft',
    requiredLevel: 1,
    xpReward: 100,
    ingredientRewards: [],
    cosmeticRewards: [],
  };

  const validQuests: Quest[] = [
    validQuest,
    {
      id: 'quest-2',
      name: 'Apprentice Crafter',
      description: 'Craft 5 items',
      requiredLevel: 3,
      xpReward: 250,
      ingredientRewards: [],
      cosmeticRewards: [],
    },
  ];

  describe('isQuestEligible - Error Cases', () => {
    it('should throw error when quest is null', () => {
      expect(() => isQuestEligible(null as any, 5)).toThrow('Quest is required');
    });

    it('should throw error when quest is undefined', () => {
      expect(() => isQuestEligible(undefined as any, 5)).toThrow('Quest is required');
    });

    it('should throw error when playerLevel is negative', () => {
      expect(() => isQuestEligible(validQuest, -1)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is zero', () => {
      expect(() => isQuestEligible(validQuest, 0)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is not a number', () => {
      expect(() => isQuestEligible(validQuest, 'not-a-number' as any)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is NaN', () => {
      expect(() => isQuestEligible(validQuest, NaN)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is Infinity', () => {
      expect(() => isQuestEligible(validQuest, Infinity)).toThrow('Player level must be a positive number');
    });

    it('should throw error when quest requiredLevel is negative', () => {
      const invalidQuest = { ...validQuest, requiredLevel: -1 };
      expect(() => isQuestEligible(invalidQuest, 5)).toThrow('Quest required level must be a positive number');
    });

    it('should throw error when quest requiredLevel is zero', () => {
      const invalidQuest = { ...validQuest, requiredLevel: 0 };
      expect(() => isQuestEligible(invalidQuest, 5)).toThrow('Quest required level must be a positive number');
    });

    it('should throw error when quest requiredLevel is not a number', () => {
      const invalidQuest = { ...validQuest, requiredLevel: 'not-a-number' as any };
      expect(() => isQuestEligible(invalidQuest, 5)).toThrow('Quest required level must be a positive number');
    });
  });

  describe('getAvailableQuests - Error Cases', () => {
    it('should throw error when quests is null', () => {
      expect(() => getAvailableQuests(null as any, 5)).toThrow('Quests array is required');
    });

    it('should throw error when quests is undefined', () => {
      expect(() => getAvailableQuests(undefined as any, 5)).toThrow('Quests array is required');
    });

    it('should throw error when quests is not an array', () => {
      expect(() => getAvailableQuests('not-an-array' as any, 5)).toThrow('Quests must be an array');
    });

    it('should throw error when playerLevel is negative', () => {
      expect(() => getAvailableQuests(validQuests, -1)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is zero', () => {
      expect(() => getAvailableQuests(validQuests, 0)).toThrow('Player level must be a positive number');
    });

    it('should throw error when playerLevel is not a number', () => {
      expect(() => getAvailableQuests(validQuests, 'not-a-number' as any)).toThrow('Player level must be a positive number');
    });

    it('should handle empty quests array', () => {
      expect(getAvailableQuests([], 5)).toEqual([]);
    });

    it('should throw error when quest in array has invalid requiredLevel', () => {
      const invalidQuests = [{ ...validQuest, requiredLevel: -1 }];
      expect(() => getAvailableQuests(invalidQuests, 5)).toThrow('Quest required level must be a positive number');
    });
  });

  describe('calculateQuestXpReward - Error Cases', () => {
    it('should throw error when quests is null', () => {
      expect(() => calculateQuestXpReward(null as any)).toThrow('Quests array is required');
    });

    it('should throw error when quests is undefined', () => {
      expect(() => calculateQuestXpReward(undefined as any)).toThrow('Quests array is required');
    });

    it('should throw error when quests is not an array', () => {
      expect(() => calculateQuestXpReward('not-an-array' as any)).toThrow('Quests must be an array');
    });

    it('should throw error when quest in array is null', () => {
      const invalidQuests = [validQuest, null as any];
      expect(() => calculateQuestXpReward(invalidQuests)).toThrow('Quest in array cannot be null/undefined');
    });

    it('should throw error when quest in array is undefined', () => {
      const invalidQuests = [validQuest, undefined as any];
      expect(() => calculateQuestXpReward(invalidQuests)).toThrow('Quest in array cannot be null/undefined');
    });

    it('should throw error when quest has negative xpReward', () => {
      const invalidQuests = [{ ...validQuest, xpReward: -100 }];
      expect(() => calculateQuestXpReward(invalidQuests)).toThrow('Quest XP reward must be a non-negative number');
    });

    it('should throw error when quest has non-numeric xpReward', () => {
      const invalidQuests = [{ ...validQuest, xpReward: 'not-a-number' as any }];
      expect(() => calculateQuestXpReward(invalidQuests)).toThrow('Quest XP reward must be a non-negative number');
    });

    it('should throw error when quest has NaN xpReward', () => {
      const invalidQuests = [{ ...validQuest, xpReward: NaN }];
      expect(() => calculateQuestXpReward(invalidQuests)).toThrow('Quest XP reward must be a non-negative number');
    });

    it('should throw error when quest has Infinity xpReward', () => {
      const invalidQuests = [{ ...validQuest, xpReward: Infinity }];
      expect(() => calculateQuestXpReward(invalidQuests)).toThrow('Quest XP reward must be a non-negative number');
    });

    it('should handle empty quests array', () => {
      expect(calculateQuestXpReward([])).toBe(0);
    });

    it('should handle zero XP reward', () => {
      const zeroRewardQuests = [{ ...validQuest, xpReward: 0 }];
      expect(calculateQuestXpReward(zeroRewardQuests)).toBe(0);
    });
  });
});
