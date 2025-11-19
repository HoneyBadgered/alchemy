/**
 * XP and Level Progression System
 * 
 * Implements the experience points and leveling mechanics for The Alchemy Table.
 */

/**
 * Calculate XP required to reach a specific level
 * Uses an exponential formula: baseXP * (level ^ exponent)
 */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  
  const baseXP = 100;
  const exponent = 1.5;
  
  return Math.floor(baseXP * Math.pow(level, exponent));
}

/**
 * Calculate total XP required to reach a specific level
 */
export function getTotalXpForLevel(level: number): number {
  let totalXp = 0;
  for (let i = 2; i <= level; i++) {
    totalXp += getXpForLevel(i);
  }
  return totalXp;
}

/**
 * Calculate current level based on total XP
 */
export function getLevelFromTotalXp(totalXp: number): number {
  let level = 1;
  let accumulatedXp = 0;
  
  while (true) {
    const xpForNextLevel = getXpForLevel(level + 1);
    if (accumulatedXp + xpForNextLevel > totalXp) {
      break;
    }
    accumulatedXp += xpForNextLevel;
    level++;
  }
  
  return level;
}

/**
 * Calculate XP progress within current level
 */
export function getXpProgressInLevel(totalXp: number): {
  currentLevel: number;
  xpInLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
} {
  const currentLevel = getLevelFromTotalXp(totalXp);
  const xpForCurrentLevel = getTotalXpForLevel(currentLevel);
  const xpInLevel = totalXp - xpForCurrentLevel;
  const xpNeededForNextLevel = getXpForLevel(currentLevel + 1);
  const progressPercent = (xpInLevel / xpNeededForNextLevel) * 100;
  
  return {
    currentLevel,
    xpInLevel,
    xpNeededForNextLevel,
    progressPercent,
  };
}

/**
 * Add XP to player and return new state
 */
export function addXp(currentTotalXp: number, xpToAdd: number): {
  newTotalXp: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
} {
  const previousLevel = getLevelFromTotalXp(currentTotalXp);
  const newTotalXp = currentTotalXp + xpToAdd;
  const newLevel = getLevelFromTotalXp(newTotalXp);
  const leveledUp = newLevel > previousLevel;
  
  return {
    newTotalXp,
    newLevel,
    previousLevel,
    leveledUp,
  };
}
