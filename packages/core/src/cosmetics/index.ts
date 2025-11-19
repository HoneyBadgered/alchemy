/**
 * Cosmetics System
 * 
 * Theme and table skin unlock/eligibility logic for The Alchemy Table.
 */

import type { Theme, TableSkin, PlayerCosmetics } from '../types';

/**
 * Check if player can use a specific theme
 */
export function canUseTheme(
  theme: Theme,
  playerLevel: number,
  playerCosmetics: PlayerCosmetics,
  completedQuestIds: string[]
): boolean {
  // Check if already unlocked
  if (playerCosmetics.unlockedThemes.includes(theme.id)) {
    return true;
  }
  
  // Check level requirement
  if (playerLevel < theme.requiredLevel) {
    return false;
  }
  
  // Check quest requirement
  if (theme.requiredQuestId && !completedQuestIds.includes(theme.requiredQuestId)) {
    return false;
  }
  
  // Check if purchased (if it's a premium theme)
  if (theme.isPurchased === false) {
    return false;
  }
  
  return true;
}

/**
 * Check if player can use a specific table skin
 */
export function canUseSkin(
  skin: TableSkin,
  playerLevel: number,
  playerCosmetics: PlayerCosmetics,
  completedQuestIds: string[]
): boolean {
  // Check if already unlocked
  if (playerCosmetics.unlockedSkins.includes(skin.id)) {
    return true;
  }
  
  // Check level requirement
  if (playerLevel < skin.requiredLevel) {
    return false;
  }
  
  // Check quest requirement
  if (skin.requiredQuestId && !completedQuestIds.includes(skin.requiredQuestId)) {
    return false;
  }
  
  // Check if purchased (if it's a premium skin)
  if (skin.isPurchased === false) {
    return false;
  }
  
  return true;
}

/**
 * Get all unlockable themes for a player
 */
export function getUnlockableThemes(
  themes: Theme[],
  playerLevel: number,
  playerCosmetics: PlayerCosmetics,
  completedQuestIds: string[]
): Theme[] {
  return themes.filter(theme => 
    canUseTheme(theme, playerLevel, playerCosmetics, completedQuestIds)
  );
}

/**
 * Get all unlockable table skins for a player
 */
export function getUnlockableSkins(
  skins: TableSkin[],
  playerLevel: number,
  playerCosmetics: PlayerCosmetics,
  completedQuestIds: string[]
): TableSkin[] {
  return skins.filter(skin => 
    canUseSkin(skin, playerLevel, playerCosmetics, completedQuestIds)
  );
}
