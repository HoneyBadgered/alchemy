/**
 * Blending Page Components
 * 
 * Components for the immersive tea blending experience
 */

// Types
export * from './types';

// Mock Data
export { MOCK_BASES, MOCK_ADDINS, getAllBlendingIngredients, getBlendingIngredientById, getAddInsByTab } from './mockData';
export type { BlendingIngredient } from './mockData';

// Hooks
export { useBlendPricing, DEFAULT_PRICING } from './useBlendPricing';
export { useFlavorProfile, DEFAULT_STATUS } from './useFlavorProfile';

// Components
export { ImmersiveHeader } from './ImmersiveHeader';
export { BaseColumn } from './BaseColumn';
export { CenterScene } from './CenterScene';
export { AddinsColumn } from './AddinsColumn';
export { BottomActionBar } from './BottomActionBar';
export { BlendingPage } from './BlendingPage';

// Collapsible Panel Components
export { CollapsiblePanel, PanelTrigger } from './CollapsiblePanel';
export { CollapsibleBaseColumn } from './CollapsibleBaseColumn';
export { CollapsibleMagicColumn } from './CollapsibleMagicColumn';
