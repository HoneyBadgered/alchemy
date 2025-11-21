/**
 * Cart API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  product: Product;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
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
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_URL}/cart`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }

    return response.json();
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_URL}/cart/items`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ productId, quantity }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add to cart');
    }

    return response.json();
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_URL}/cart/items`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify({ productId, quantity }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update cart item');
    }

    return response.json();
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(
    productId: string,
    token?: string,
    sessionId?: string
  ): Promise<CartResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_URL}/cart/items`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove from cart');
    }

    return response.json();
  },

  /**
   * Clear cart
   */
  async clearCart(token?: string, sessionId?: string): Promise<CartResponse> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_URL}/cart`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }

    return response.json();
  },

  /**
   * Merge guest cart with user cart (after login)
   */
  async mergeCart(sessionId: string, token: string): Promise<CartResponse> {
    const response = await fetch(`${API_URL}/cart/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to merge cart');
    }

    return response.json();
  },
};
