import {
  getXpForLevel,
  getTotalXpForLevel,
  getLevelFromTotalXp,
  getXpProgressInLevel,
  addXp,
} from '../index';

describe('XP System - Error Handling', () => {
  describe('getXpForLevel - Error Cases', () => {
    it('should throw error when level is negative', () => {
      expect(() => getXpForLevel(-1)).toThrow('Level must be at least 1');
    });

    it('should throw error when level is zero', () => {
      expect(() => getXpForLevel(0)).toThrow('Level must be at least 1');
    });

    it('should throw error when level is not a number', () => {
      expect(() => getXpForLevel('not-a-number' as any)).toThrow('Level must be a finite number');
    });

    it('should throw error when level is NaN', () => {
      expect(() => getXpForLevel(NaN)).toThrow('Level must be a finite number');
    });

    it('should throw error when level is Infinity', () => {
      expect(() => getXpForLevel(Infinity)).toThrow('Level must be a finite number');
    });

    it('should throw error when level exceeds maximum', () => {
      expect(() => getXpForLevel(10000)).toThrow('Level cannot exceed 1000');
    });
  });

  describe('getTotalXpForLevel - Error Cases', () => {
    it('should throw error when level is negative', () => {
      expect(() => getTotalXpForLevel(-1)).toThrow('Level must be at least 1');
    });

    it('should throw error when level is zero', () => {
      expect(() => getTotalXpForLevel(0)).toThrow('Level must be at least 1');
    });

    it('should throw error when level is not a number', () => {
      expect(() => getTotalXpForLevel('not-a-number' as any)).toThrow('Level must be a finite number');
    });

    it('should throw error when level is NaN', () => {
      expect(() => getTotalXpForLevel(NaN)).toThrow('Level must be a finite number');
    });

    it('should throw error when level exceeds maximum', () => {
      expect(() => getTotalXpForLevel(10000)).toThrow('Level cannot exceed 1000');
    });
  });

  describe('getLevelFromTotalXp - Error Cases', () => {
    it('should throw error when totalXp is negative', () => {
      expect(() => getLevelFromTotalXp(-100)).toThrow('Total XP cannot be negative');
    });

    it('should throw error when totalXp is not a number', () => {
      expect(() => getLevelFromTotalXp('not-a-number' as any)).toThrow('Total XP must be a finite number');
    });

    it('should throw error when totalXp is NaN', () => {
      expect(() => getLevelFromTotalXp(NaN)).toThrow('Total XP must be a finite number');
    });

    it('should throw error when totalXp is Infinity', () => {
      expect(() => getLevelFromTotalXp(Infinity)).toThrow('Total XP must be a finite number');
    });

    it('should throw error when totalXp exceeds maximum safe integer', () => {
      expect(() => getLevelFromTotalXp(Number.MAX_SAFE_INTEGER + 1)).toThrow('Total XP exceeds maximum safe value');
    });

    it('should handle zero XP without error', () => {
      expect(getLevelFromTotalXp(0)).toBe(1);
    });

    it('should handle maximum safe XP value', () => {
      expect(() => getLevelFromTotalXp(Number.MAX_SAFE_INTEGER)).not.toThrow();
    });
  });

  describe('getXpProgressInLevel - Error Cases', () => {
    it('should throw error when totalXp is negative', () => {
      expect(() => getXpProgressInLevel(-100)).toThrow('Total XP cannot be negative');
    });

    it('should throw error when totalXp is not a number', () => {
      expect(() => getXpProgressInLevel('not-a-number' as any)).toThrow('Total XP must be a finite number');
    });

    it('should throw error when totalXp is NaN', () => {
      expect(() => getXpProgressInLevel(NaN)).toThrow('Total XP must be a finite number');
    });

    it('should throw error when totalXp is Infinity', () => {
      expect(() => getXpProgressInLevel(Infinity)).toThrow('Total XP must be a finite number');
    });

    it('should handle zero XP without error', () => {
      const result = getXpProgressInLevel(0);
      expect(result.currentLevel).toBe(1);
      expect(result.xpInLevel).toBe(0);
    });
  });

  describe('addXp - Error Cases', () => {
    it('should throw error when currentTotalXp is negative', () => {
      expect(() => addXp(-100, 50)).toThrow('Current total XP cannot be negative');
    });

    it('should throw error when currentTotalXp is not a number', () => {
      expect(() => addXp('not-a-number' as any, 50)).toThrow('Current total XP must be a finite number');
    });

    it('should throw error when currentTotalXp is NaN', () => {
      expect(() => addXp(NaN, 50)).toThrow('Current total XP must be a finite number');
    });

    it('should throw error when currentTotalXp is Infinity', () => {
      expect(() => addXp(Infinity, 50)).toThrow('Current total XP must be a finite number');
    });

    it('should throw error when xpToAdd is not a number', () => {
      expect(() => addXp(100, 'not-a-number' as any)).toThrow('XP to add must be a finite number');
    });

    it('should throw error when xpToAdd is NaN', () => {
      expect(() => addXp(100, NaN)).toThrow('XP to add must be a finite number');
    });

    it('should throw error when xpToAdd is Infinity', () => {
      expect(() => addXp(100, Infinity)).toThrow('XP to add must be a finite number');
    });

    it('should throw error when result would be negative', () => {
      expect(() => addXp(100, -200)).toThrow('Resulting total XP cannot be negative');
    });

    it('should throw error when result would overflow', () => {
      expect(() => addXp(Number.MAX_SAFE_INTEGER, 1000)).toThrow('Resulting total XP exceeds maximum safe value');
    });

    it('should handle zero XP addition', () => {
      const result = addXp(100, 0);
      expect(result.newTotalXp).toBe(100);
      expect(result.leveledUp).toBe(false);
    });

    it('should handle negative XP addition within bounds', () => {
      const result = addXp(100, -50);
      expect(result.newTotalXp).toBe(50);
      expect(result.leveledUp).toBe(false);
    });
  });
});
