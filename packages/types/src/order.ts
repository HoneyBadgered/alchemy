/**
 * Order and cart types
 */

import type { Product } from './product';

/**
 * Shipping address
 */
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

/**
 * Billing address (same structure as shipping)
 */
export interface BillingAddress extends ShippingAddress {}

/**
 * Custom blend data structure
 */
export interface CustomBlendData {
  baseTeaId?: string;
  addIns?: Array<{ ingredientId: string; quantity: number }>;
}

/**
 * Order item
 */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number | string;
  customBlend?: CustomBlendData;
  createdAt?: string;
  product?: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    category?: string;
  };
}

/**
 * Order status log entry
 */
export interface OrderStatusLog {
  id: string;
  fromStatus?: string;
  toStatus: string;
  notes?: string;
  createdAt: string;
}

/**
 * Order entity
 */
export interface Order {
  id: string;
  userId: string;
  orderNumber?: string;
  status: string;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  total: number;
  totalAmount?: number; // Alias for total
  shippingMethod?: string;
  shippingCost?: number;
  taxAmount?: number;
  discountCode?: string;
  discountAmount?: number;
  customerNotes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  items?: OrderItem[];
  order_items?: OrderItem[]; // Database naming
  shipping_address?: ShippingAddress;
  billing_address?: BillingAddress;
  statusLogs?: OrderStatusLog[];
}

/**
 * Order with items type (commonly used in services)
 */
export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

/**
 * Place order input
 */
export interface PlaceOrderInput {
  shippingAddress?: ShippingAddress;
  billingAddress?: BillingAddress;
  shippingMethod?: string;
  customerNotes?: string;
  discountCode?: string;
}

/**
 * Order list response
 */
export interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Cart item with product details
 */
export interface CartItemWithProduct {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  products: Product;
  product?: Product; // Alias
}

/**
 * Cart item (simple)
 */
export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  product: Product;
}

/**
 * Cart with items
 */
export interface CartWithItems {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  cart_items: CartItemWithProduct[];
  items?: CartItem[]; // Alias
}

/**
 * Cart response
 */
export interface CartResponse {
  id: string;
  userId?: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Cart type (simple structure)
 */
export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}
