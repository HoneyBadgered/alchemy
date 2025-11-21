import {
  isQuestEligible,
  getAvailableQuests,
  calculateQuestXpReward,
} from '../index';
import type { Quest } from '../../types';

describe('Quest System', () => {
  const mockQuests: Quest[] = [
    {
      id: 'quest-1',
      name: 'First Steps',
      description: 'Complete your first craft',
      requiredLevel: 1,
      xpReward: 100,
      ingredientRewards: [],
      cosmeticRewards: [],
    },
    {
      id: 'quest-2',
      name: 'Apprentice Crafter',
      description: 'Craft 5 items',
      requiredLevel: 3,
      xpReward: 250,
      ingredientRewards: [],
      cosmeticRewards: [],
    },
    {
      id: 'quest-3',
      name: 'Master Alchemist',
      description: 'Reach level 10',
      requiredLevel: 10,
      xpReward: 500,
      ingredientRewards: [],
      cosmeticRewards: [],
    },
  ];

  describe('isQuestEligible', () => {
    it('should return true when player level meets requirement', () => {
      expect(isQuestEligible(mockQuests[0], 1)).toBe(true);
    });

    it('should return true when player level exceeds requirement', () => {
      expect(isQuestEligible(mockQuests[0], 5)).toBe(true);
    });

    it('should return false when player level is below requirement', () => {
      expect(isQuestEligible(mockQuests[2], 5)).toBe(false);
    });

    it('should handle edge case of exact level match', () => {
      expect(isQuestEligible(mockQuests[1], 3)).toBe(true);
    });
  });

  describe('getAvailableQuests', () => {
    it('should return all quests for high level player', () => {
      const available = getAvailableQuests(mockQuests, 15);
      expect(available.length).toBe(3);
      expect(available).toEqual(mockQuests);
    });

    it('should return only level 1 quest for level 1 player', () => {
      const available = getAvailableQuests(mockQuests, 1);
      expect(available.length).toBe(1);
      expect(available[0].id).toBe('quest-1');
    });

    it('should return quests up to player level', () => {
      const available = getAvailableQuests(mockQuests, 5);
      expect(available.length).toBe(2);
      expect(available[0].id).toBe('quest-1');
      expect(available[1].id).toBe('quest-2');
    });

    it('should return empty array when no quests are eligible', () => {
      const highLevelQuests: Quest[] = [
        {
          id: 'quest-high',
          name: 'High Level Quest',
          description: 'For experienced players',
          requiredLevel: 20,
          xpReward: 1000,
          ingredientRewards: [],
          cosmeticRewards: [],
        },
      ];

      const available = getAvailableQuests(highLevelQuests, 5);
      expect(available.length).toBe(0);
    });

    it('should handle empty quest list', () => {
      const available = getAvailableQuests([], 10);
      expect(available.length).toBe(0);
    });
  });

  describe('calculateQuestXpReward', () => {
    it('should sum XP rewards from all quests', () => {
      const totalXp = calculateQuestXpReward(mockQuests);
      expect(totalXp).toBe(850); // 100 + 250 + 500
    });

    it('should return 0 for empty quest list', () => {
      const totalXp = calculateQuestXpReward([]);
      expect(totalXp).toBe(0);
    });

    it('should handle single quest', () => {
      const totalXp = calculateQuestXpReward([mockQuests[0]]);
      expect(totalXp).toBe(100);
    });

    it('should handle quests with various XP amounts', () => {
      const quests: Quest[] = [
        { ...mockQuests[0], xpReward: 50 },
        { ...mockQuests[0], xpReward: 150 },
        { ...mockQuests[0], xpReward: 300 },
      ];

      const totalXp = calculateQuestXpReward(quests);
      expect(totalXp).toBe(500);
    });
  });
});
