/**
 * Common shared types across the application
 */

import type { Prisma } from '@prisma/client';

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Filter parameters for queries
 */
export interface FilterParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Prisma transaction client type
 */
export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Type-safe Prisma client interface
 */
export interface PrismaClient {
  $transaction<T>(fn: (prisma: PrismaTransaction) => Promise<T>): Promise<T>;
}

/**
 * Order with items type (commonly used in services)
 */
export interface OrderWithItems {
  id: string;
  userId: string;
  orderNumber: string;
  status: string;
  subtotal: number | string;
  tax: number | string;
  shipping: number | string;
  discount: number | string;
  total: number | string;
  createdAt: Date;
  updatedAt: Date;
  order_items: OrderItem[];
  shipping_address?: ShippingAddress;
  billing_address?: BillingAddress;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number | string;
  customBlend?: CustomBlendData;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface BillingAddress extends ShippingAddress {}

/**
 * Custom blend data structure
 */
export interface CustomBlendData {
  baseTeaId?: string;
  addIns?: Array<{ ingredientId: string; quantity: number }>;
}

/**
 * Cart item with product details
 */
export interface CartItemWithProduct {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  products: {
    id: string;
    name: string;
    description: string;
    price: number | string;
    imageUrl?: string | null;
    stock: number;
    isActive: boolean;
  };
}

/**
 * Cart with items
 */
export interface CartWithItems {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  cart_items: CartItemWithProduct[];
}

/**
 * Prisma include types helper
 */
export type PrismaInclude<T extends string> = {
  [K in T]: boolean | object;
};
