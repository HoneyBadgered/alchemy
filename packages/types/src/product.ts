/**
 * Product catalog types
 */

import type { StockStatus } from './common';

/**
 * Product entity
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  stock: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  averageRating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stockStatus?: StockStatus;
  isOnSale?: boolean;
  discountPercent?: number;
}

/**
 * Product review
 */
export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title?: string;
  content?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
  };
}

/**
 * Reviews response with distribution
 */
export interface ReviewsResponse {
  reviews: Review[];
  ratingDistribution: Record<number, number>;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Wishlist item
 */
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: Product;
}

/**
 * Wishlist response
 */
export interface WishlistResponse {
  items: WishlistItem[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Coupon validation result
 */
export interface CouponValidation {
  valid: boolean;
  code?: string;
  description?: string;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
  discountAmount?: number;
  minOrderAmount?: number;
  message?: string;
}

/**
 * Recommended product
 */
export interface RecommendedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  stock: number;
  averageRating?: number;
  reviewCount: number;
  isOnSale?: boolean;
  discountPercent?: number;
  category?: string;
  tags?: string[];
}

/**
 * Products response with pagination
 */
export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
