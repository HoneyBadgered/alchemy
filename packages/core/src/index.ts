/**
 * The Alchemy Table - Core Game Logic
 * 
 * This package contains all shared game logic including:
 * - XP and leveling system
 * - Crafting validation
 * - Quest eligibility
 * - Cosmetics unlock rules
 */

// Export types
export * from './types';

// Export XP system
export {
  getXpForLevel,
  getTotalXpForLevel,
  getLevelFromTotalXp,
  getXpProgressInLevel,
  addXp,
} from './xp';

// Export crafting system
export {
  hasRequiredIngredients,
  meetsLevelRequirement,
  canCraftRecipe,
  craftRecipe,
} from './crafting';

// Export quest system
export {
  isQuestEligible,
  getAvailableQuests,
  calculateQuestXpReward,
} from './quests';

// Export cosmetics system
export {
  canUseTheme,
  canUseSkin,
  getUnlockableThemes,
  getUnlockableSkins,
} from './cosmetics';

// Export ingredients data
export {
  INGREDIENTS,
  CATEGORY_INFO,
  DEFAULT_BASE_AMOUNT,
  DEFAULT_INCREMENT_AMOUNT,
  getIngredientsByCategory,
  getIngredientById,
  getBaseTeas,
  getAddIns,
  getIngredientBaseAmount,
  getIngredientIncrementAmount,
} from './ingredients';
