/**
 * Cart API Client
 */

import { apiClient } from './api-client';

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  products: Product;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  cart_items: CartItem[];
}

export interface CartResponse {
  cart: Cart;
  subtotal: number;
  itemCount: number;
}

export const cartApi = {
  /**
   * Get cart
   */
  async getCart(token?: string, sessionId?: string): Promise<CartResponse> {
    const customHeaders: Record<string, string> = {};
    if (sessionId) {
      customHeaders['x-session-id'] = sessionId;
    }

    return apiClient.get<CartResponse>('/cart', token, customHeaders);
  },

  /**
   * Add item to cart
   */
  async addToCart(
    productId: string,
    quantity: number,
    token?: string,
    sessionId?: string
  ): Promise<CartResponse> {
    const customHeaders: Record<string, string> = {};
    if (sessionId) {
      customHeaders['x-session-id'] = sessionId;
    }

    return apiClient.post<CartResponse>(
      '/cart/items',
      { productId, quantity },
      token,
      customHeaders
    );
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    productId: string,
    quantity: number,
    token?: string,
    sessionId?: string
  ): Promise<CartResponse> {
    const customHeaders: Record<string, string> = {};
    if (sessionId) {
      customHeaders['x-session-id'] = sessionId;
    }

    return apiClient.patch<CartResponse>(
      '/cart/items',
      { productId, quantity },
      token,
      customHeaders
    );
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(
    productId: string,
    token?: string,
    sessionId?: string,
    retryCount = 0
  ): Promise<CartResponse> {
    const customHeaders: Record<string, string> = {};
    if (sessionId) {
      customHeaders['x-session-id'] = sessionId;
    }

    // Note: DELETE with body - need to use fetch directly since ApiClient.delete doesn't support body
    const csrfToken = typeof document !== 'undefined' ? getCookie('XSRF-TOKEN') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/cart/items`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to remove from cart' }));
      
      // Auto-retry once if backend issued a new CSRF token
      if (response.status === 403 && error.code === 'CSRF_TOKEN_REQUIRED' && retryCount === 0) {
        return this.removeFromCart(productId, token, sessionId, retryCount + 1);
      }
      
      throw new Error(error.message || 'Failed to remove from cart');
    }

    return response.json();
  },

  /**
   * Clear cart
   */
  async clearCart(token?: string, sessionId?: string): Promise<CartResponse> {
    const customHeaders: Record<string, string> = {};
    if (sessionId) {
      customHeaders['x-session-id'] = sessionId;
    }

    return apiClient.delete<CartResponse>('/cart', token, customHeaders);
  },

  /**
   * Merge guest cart with user cart (after login)
   */
  async mergeCart(sessionId: string, token: string): Promise<CartResponse> {
    return apiClient.post<CartResponse>('/cart/merge', { sessionId }, token);
  },

  /**
   * Add custom blend to cart
   */
  async addBlendToCart(
    baseTeaId: string,
    addIns: Array<{ ingredientId: string; quantity: number }>,
    token?: string,
    sessionId?: string,
    name?: string
  ): Promise<CartResponse> {
    const customHeaders: Record<string, string> = {};
    if (sessionId) {
      customHeaders['x-session-id'] = sessionId;
    }

    const requestBody = { baseTeaId, addIns, name };
    console.log('Sending blend to cart:', requestBody);

    return apiClient.post<CartResponse>('/cart/blend', requestBody, token, customHeaders);
  },
};
