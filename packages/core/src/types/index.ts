/**
 * Core types for The Alchemy Table game system
 * 
 * This module re-exports types from @alchemy/types for backwards compatibility.
 * New code should import directly from '@alchemy/types' or '@alchemy/types/game'.
 */

// Re-export game types from centralized types package
export type {
  Player,
  Quest,
  IngredientReward,
  Recipe,
  RecipeIngredient,
  InventoryItem,
  Theme,
  TableSkin,
  PlayerCosmetics,
  IngredientCategory,
  IngredientRole,
  IngredientStatus,
  CaffeineLevel,
  CutOrGrade,
  Ingredient,
  Supplier,
  SelectedIngredient,
  BlendState,
  PlayerProgress,
  PlayerQuest,
} from '@alchemy/types/game';

// Re-export blog types
export type {
  PostType,
  PostStatus,
  BlogPost,
  Tag,
  PostWithRelations,
  CreatePostInput,
  UpdatePostInput,
  PostFilters,
  PublicPostFilters,
  Pagination,
  BlogStats,
  PreviewToken,
} from '@alchemy/types/blog';

// Re-export common types
export type {
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
  FilterParams,
  OrderWithItems,
  OrderItem,
  ShippingAddress,
  BillingAddress,
  CustomBlendData,
  CartItemWithProduct,
  CartWithItems,
} from '@alchemy/types';

// Also export the PostCategory enum
export { PostCategory } from '@alchemy/types/blog';
