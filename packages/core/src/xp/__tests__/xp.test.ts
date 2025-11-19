import {
  getXpForLevel,
  getTotalXpForLevel,
  getLevelFromTotalXp,
  getXpProgressInLevel,
  addXp,
} from '../index';

describe('XP System', () => {
  describe('getXpForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(getXpForLevel(1)).toBe(0);
    });

    it('should return correct XP for level 2', () => {
      expect(getXpForLevel(2)).toBe(282);
    });

    it('should return increasing XP for higher levels', () => {
      const xpLevel3 = getXpForLevel(3);
      const xpLevel4 = getXpForLevel(4);
      const xpLevel5 = getXpForLevel(5);
      
      expect(xpLevel4).toBeGreaterThan(xpLevel3);
      expect(xpLevel5).toBeGreaterThan(xpLevel4);
    });
  });

  describe('getTotalXpForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(getTotalXpForLevel(1)).toBe(0);
    });

    it('should return cumulative XP for level 5', () => {
      const expected = getXpForLevel(2) + getXpForLevel(3) + getXpForLevel(4) + getXpForLevel(5);
      expect(getTotalXpForLevel(5)).toBe(expected);
    });
  });

  describe('getLevelFromTotalXp', () => {
    it('should return level 1 for 0 XP', () => {
      expect(getLevelFromTotalXp(0)).toBe(1);
    });

    it('should return level 1 for XP less than level 2 requirement', () => {
      expect(getLevelFromTotalXp(100)).toBe(1);
    });

    it('should return level 2 for XP at level 2 threshold', () => {
      const xpForLevel2 = getXpForLevel(2);
      expect(getLevelFromTotalXp(xpForLevel2)).toBe(2);
    });

    it('should return correct level for higher XP amounts', () => {
      const totalXpForLevel5 = getTotalXpForLevel(5);
      expect(getLevelFromTotalXp(totalXpForLevel5)).toBe(5);
    });
  });

  describe('getXpProgressInLevel', () => {
    it('should show 0% progress at start of level', () => {
      const totalXpForLevel3 = getTotalXpForLevel(3);
      const progress = getXpProgressInLevel(totalXpForLevel3);
      
      expect(progress.currentLevel).toBe(3);
      expect(progress.xpInLevel).toBe(0);
      expect(progress.progressPercent).toBe(0);
    });

    it('should calculate progress within level', () => {
      const totalXpForLevel2 = getTotalXpForLevel(2);
      const halfwayXp = totalXpForLevel2 + getXpForLevel(3) / 2;
      const progress = getXpProgressInLevel(halfwayXp);
      
      expect(progress.currentLevel).toBe(2);
      expect(progress.progressPercent).toBeCloseTo(50, 0);
    });
  });

  describe('addXp', () => {
    it('should add XP without leveling up', () => {
      const result = addXp(0, 100);
      
      expect(result.newTotalXp).toBe(100);
      expect(result.newLevel).toBe(1);
      expect(result.previousLevel).toBe(1);
      expect(result.leveledUp).toBe(false);
    });

    it('should detect level up', () => {
      const result = addXp(0, 300);
      
      expect(result.newTotalXp).toBe(300);
      expect(result.newLevel).toBe(2);
      expect(result.previousLevel).toBe(1);
      expect(result.leveledUp).toBe(true);
    });

    it('should handle multiple level ups', () => {
      const result = addXp(0, 2000);
      
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBeGreaterThan(result.previousLevel);
    });
  });
});
