/**
 * API Types for The Alchemy Table
 * 
 * This module re-exports types from @alchemy/types for backwards compatibility.
 * New code should import directly from '@alchemy/types'.
 */

// Re-export all types from centralized types package
export type {
  // User & Auth
  User,
  UserRole,
  UserProfile,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  
  // Product
  Product,
  Review,
  ReviewsResponse,
  WishlistItem,
  WishlistResponse,
  CouponValidation,
  RecommendedProduct,
  ProductsResponse,
  
  // Order & Cart
  Order,
  OrderItem,
  OrderWithItems,
  PlaceOrderInput,
  OrderListResponse,
  ShippingAddress,
  BillingAddress,
  CartItem,
  CartWithItems,
  CartResponse,
  Cart,
  
  // Game
  Player,
  Quest,
  InventoryItem,
  PlayerCosmetics,
  PlayerProgress,
  PlayerQuest,
  Ingredient,
  
  // API
  CraftRequest,
  CraftResponse,
  LabelGenerationRequest,
  LabelDesign,
  BlendingIngredient,
  LabelDesignResponse,
  CreatePaymentIntentInput,
  PaymentIntentResult,
  PaymentStatusResult,
  OrderByPaymentIntentResult,
  PaymentConfigResult,
  
  // Common
  ApiError,
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
  StockStatus,
} from '@alchemy/types';

