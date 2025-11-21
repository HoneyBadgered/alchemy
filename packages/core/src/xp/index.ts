/**
 * XP and Level Progression System
 * 
 * Implements the experience points and leveling mechanics for The Alchemy Table.
 */

const MAX_LEVEL = 1000; // Prevent infinite loops and overflow
const MAX_XP = Number.MAX_SAFE_INTEGER;

/**
 * Calculate XP required to reach a specific level
 * Uses an exponential formula: baseXP * (level ^ exponent)
 * 
 * @throws {Error} If level is not a valid positive number
 * @throws {Error} If level exceeds maximum allowed level
 */
export function getXpForLevel(level: number): number {
  if (typeof level !== 'number' || !Number.isFinite(level)) {
    throw new Error(`Level must be a finite number, got ${level}`);
  }
  
  if (level < 1) {
    throw new Error(`Level must be at least 1, got ${level}`);
  }
  
  if (level > MAX_LEVEL) {
    throw new Error(`Level cannot exceed ${MAX_LEVEL}, got ${level}`);
  }
  
  if (level <= 1) return 0;
  
  const baseXP = 100;
  const exponent = 1.5;
  
  return Math.floor(baseXP * Math.pow(level, exponent));
}

/**
 * Calculate total XP required to reach a specific level
 * 
 * @throws {Error} If level is not a valid positive number
 * @throws {Error} If level exceeds maximum allowed level
 */
export function getTotalXpForLevel(level: number): number {
  if (typeof level !== 'number' || !Number.isFinite(level)) {
    throw new Error(`Level must be a finite number, got ${level}`);
  }
  
  if (level < 1) {
    throw new Error(`Level must be at least 1, got ${level}`);
  }
  
  if (level > MAX_LEVEL) {
    throw new Error(`Level cannot exceed ${MAX_LEVEL}, got ${level}`);
  }
  
  let totalXp = 0;
  for (let i = 2; i <= level; i++) {
    totalXp += getXpForLevel(i);
  }
  return totalXp;
}

/**
 * Calculate current level based on total XP
 * 
 * @throws {Error} If totalXp is not a valid non-negative number
 * @throws {Error} If totalXp exceeds maximum safe integer
 */
export function getLevelFromTotalXp(totalXp: number): number {
  if (typeof totalXp !== 'number' || !Number.isFinite(totalXp)) {
    throw new Error(`Total XP must be a finite number, got ${totalXp}`);
  }
  
  if (totalXp < 0) {
    throw new Error(`Total XP cannot be negative, got ${totalXp}`);
  }
  
  if (totalXp > MAX_XP) {
    throw new Error(`Total XP exceeds maximum safe value, got ${totalXp}`);
  }
  
  let level = 1;
  let accumulatedXp = 0;
  
  while (level < MAX_LEVEL) {
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
 * 
 * @throws {Error} If totalXp is not a valid non-negative number
 */
export function getXpProgressInLevel(totalXp: number): {
  currentLevel: number;
  xpInLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
} {
  if (typeof totalXp !== 'number' || !Number.isFinite(totalXp)) {
    throw new Error(`Total XP must be a finite number, got ${totalXp}`);
  }
  
  if (totalXp < 0) {
    throw new Error(`Total XP cannot be negative, got ${totalXp}`);
  }
  
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
 * 
 * @throws {Error} If currentTotalXp is not a valid non-negative number
 * @throws {Error} If xpToAdd is not a valid number (can be negative for penalties)
 * @throws {Error} If result would overflow or result in negative total XP
 */
export function addXp(currentTotalXp: number, xpToAdd: number): {
  newTotalXp: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
} {
  if (typeof currentTotalXp !== 'number' || !Number.isFinite(currentTotalXp)) {
    throw new Error(`Current total XP must be a finite number, got ${currentTotalXp}`);
  }
  
  if (currentTotalXp < 0) {
    throw new Error(`Current total XP cannot be negative, got ${currentTotalXp}`);
  }
  
  if (typeof xpToAdd !== 'number' || !Number.isFinite(xpToAdd)) {
    throw new Error(`XP to add must be a finite number, got ${xpToAdd}`);
  }
  
  const newTotalXp = currentTotalXp + xpToAdd;
  
  if (newTotalXp < 0) {
    throw new Error(`Resulting total XP cannot be negative. Current: ${currentTotalXp}, adding: ${xpToAdd}`);
  }
  
  if (newTotalXp > MAX_XP) {
    throw new Error(`Resulting total XP exceeds maximum safe value, got ${newTotalXp}`);
  }
  
  const previousLevel = getLevelFromTotalXp(currentTotalXp);
  const newLevel = getLevelFromTotalXp(newTotalXp);
  const leveledUp = newLevel > previousLevel;
  
  return {
    newTotalXp,
    newLevel,
    previousLevel,
    leveledUp,
  };
}
