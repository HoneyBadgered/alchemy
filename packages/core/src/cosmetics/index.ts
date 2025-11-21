/**
 * Cosmetics System
 * 
 * Theme and table skin unlock/eligibility logic for The Alchemy Table.
 */

import type { Theme, TableSkin, PlayerCosmetics } from '../types';

/**
 * Check if player can use a specific theme
 * 
 * @throws {Error} If theme is null/undefined
 * @throws {Error} If playerLevel is not a valid positive number
 * @throws {Error} If playerCosmetics is null/undefined
 * @throws {Error} If completedQuestIds is null/undefined
 */
export function canUseTheme(
  theme: Theme,
  playerLevel: number,
  playerCosmetics: PlayerCosmetics,
  completedQuestIds: string[]
): boolean {
  if (!theme) {
    throw new Error('Theme is required');
  }
  
  if (typeof playerLevel !== 'number' || !Number.isFinite(playerLevel) || playerLevel < 1) {
    throw new Error(`Player level must be a positive number, got ${playerLevel}`);
  }
  
  if (!playerCosmetics) {
    throw new Error('Player cosmetics is required');
  }
  
  if (!completedQuestIds) {
    throw new Error('Completed quest IDs array is required');
  }
  
  if (!Array.isArray(completedQuestIds)) {
    throw new Error('Completed quest IDs must be an array');
  }
  
  if (!Array.isArray(playerCosmetics.unlockedThemes)) {
    throw new Error('Player cosmetics unlockedThemes must be an array');
  }
  
  if (typeof theme.requiredLevel !== 'number' || !Number.isFinite(theme.requiredLevel) || theme.requiredLevel < 1) {
    throw new Error(`Theme required level must be a positive number, got ${theme.requiredLevel}`);
  }
  
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
 * 
 * @throws {Error} If skin is null/undefined
 * @throws {Error} If playerLevel is not a valid positive number
 * @throws {Error} If playerCosmetics is null/undefined
 * @throws {Error} If completedQuestIds is null/undefined
 */
export function canUseSkin(
  skin: TableSkin,
  playerLevel: number,
  playerCosmetics: PlayerCosmetics,
  completedQuestIds: string[]
): boolean {
  if (!skin) {
    throw new Error('Table skin is required');
  }
  
  if (typeof playerLevel !== 'number' || !Number.isFinite(playerLevel) || playerLevel < 1) {
    throw new Error(`Player level must be a positive number, got ${playerLevel}`);
  }
  
  if (!playerCosmetics) {
    throw new Error('Player cosmetics is required');
  }
  
  if (!completedQuestIds) {
    throw new Error('Completed quest IDs array is required');
  }
  
  if (!Array.isArray(completedQuestIds)) {
    throw new Error('Completed quest IDs must be an array');
  }
  
  if (!Array.isArray(playerCosmetics.unlockedSkins)) {
    throw new Error('Player cosmetics unlockedSkins must be an array');
  }
  
  if (typeof skin.requiredLevel !== 'number' || !Number.isFinite(skin.requiredLevel) || skin.requiredLevel < 1) {
    throw new Error(`Skin required level must be a positive number, got ${skin.requiredLevel}`);
  }
  
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
 * 
 * @throws {Error} If themes is null/undefined
 * @throws {Error} If playerLevel is not a valid positive number
 * @throws {Error} If playerCosmetics is null/undefined
 * @throws {Error} If completedQuestIds is null/undefined
 */
export function getUnlockableThemes(
  themes: Theme[],
  playerLevel: number,
  playerCosmetics: PlayerCosmetics,
  completedQuestIds: string[]
): Theme[] {
  if (!themes) {
    throw new Error('Themes array is required');
  }
  
  if (!Array.isArray(themes)) {
    throw new Error('Themes must be an array');
  }
  
  return themes.filter(theme => 
    canUseTheme(theme, playerLevel, playerCosmetics, completedQuestIds)
  );
}

/**
 * Get all unlockable table skins for a player
 * 
 * @throws {Error} If skins is null/undefined
 * @throws {Error} If playerLevel is not a valid positive number
 * @throws {Error} If playerCosmetics is null/undefined
 * @throws {Error} If completedQuestIds is null/undefined
 */
export function getUnlockableSkins(
  skins: TableSkin[],
  playerLevel: number,
  playerCosmetics: PlayerCosmetics,
  completedQuestIds: string[]
): TableSkin[] {
  if (!skins) {
    throw new Error('Skins array is required');
  }
  
  if (!Array.isArray(skins)) {
    throw new Error('Skins must be an array');
  }
  
  return skins.filter(skin => 
    canUseSkin(skin, playerLevel, playerCosmetics, completedQuestIds)
  );
}
