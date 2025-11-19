/**
 * Quest System
 * 
 * Quest eligibility and completion logic for The Alchemy Table.
 */

import type { Quest } from '../types';

/**
 * Check if player is eligible to start a quest
 */
export function isQuestEligible(quest: Quest, playerLevel: number): boolean {
  return playerLevel >= quest.requiredLevel;
}

/**
 * Filter quests available to player based on level
 */
export function getAvailableQuests(
  quests: Quest[],
  playerLevel: number
): Quest[] {
  return quests.filter(quest => isQuestEligible(quest, playerLevel));
}

/**
 * Calculate total XP reward from completing quests
 */
export function calculateQuestXpReward(quests: Quest[]): number {
  return quests.reduce((total, quest) => total + quest.xpReward, 0);
}
