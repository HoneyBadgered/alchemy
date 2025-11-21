/**
 * Quest System
 * 
 * Quest eligibility and completion logic for The Alchemy Table.
 */

import type { Quest } from '../types';

/**
 * Check if player is eligible to start a quest
 * 
 * @throws {Error} If quest is null/undefined
 * @throws {Error} If playerLevel is not a valid positive number
 * @throws {Error} If quest.requiredLevel is not a valid positive number
 */
export function isQuestEligible(quest: Quest, playerLevel: number): boolean {
  if (!quest) {
    throw new Error('Quest is required');
  }
  
  if (typeof playerLevel !== 'number' || !Number.isFinite(playerLevel) || playerLevel < 1) {
    throw new Error(`Player level must be a positive number, got ${playerLevel}`);
  }
  
  if (typeof quest.requiredLevel !== 'number' || !Number.isFinite(quest.requiredLevel) || quest.requiredLevel < 1) {
    throw new Error(`Quest required level must be a positive number, got ${quest.requiredLevel}`);
  }
  
  return playerLevel >= quest.requiredLevel;
}

/**
 * Filter quests available to player based on level
 * 
 * @throws {Error} If quests is null/undefined
 * @throws {Error} If playerLevel is not a valid positive number
 */
export function getAvailableQuests(
  quests: Quest[],
  playerLevel: number
): Quest[] {
  if (!quests) {
    throw new Error('Quests array is required');
  }
  
  if (!Array.isArray(quests)) {
    throw new Error('Quests must be an array');
  }
  
  if (typeof playerLevel !== 'number' || !Number.isFinite(playerLevel) || playerLevel < 1) {
    throw new Error(`Player level must be a positive number, got ${playerLevel}`);
  }
  
  return quests.filter(quest => isQuestEligible(quest, playerLevel));
}

/**
 * Calculate total XP reward from completing quests
 * 
 * @throws {Error} If quests is null/undefined
 * @throws {Error} If any quest has invalid xpReward
 */
export function calculateQuestXpReward(quests: Quest[]): number {
  if (!quests) {
    throw new Error('Quests array is required');
  }
  
  if (!Array.isArray(quests)) {
    throw new Error('Quests must be an array');
  }
  
  return quests.reduce((total, quest) => {
    if (!quest) {
      throw new Error('Quest in array cannot be null/undefined');
    }
    
    if (typeof quest.xpReward !== 'number' || !Number.isFinite(quest.xpReward) || quest.xpReward < 0) {
      throw new Error(`Quest XP reward must be a non-negative number, got ${quest.xpReward}`);
    }
    
    return total + quest.xpReward;
  }, 0);
}
