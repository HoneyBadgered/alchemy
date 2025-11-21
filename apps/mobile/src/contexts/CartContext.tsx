/**
 * Cart Context for React Native
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface Product {
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

interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

interface CartResponse {
  cart: Cart;
  subtotal: number;
  itemCount: number;
}

interface CartContextValue {
  cart: CartResponse | null;
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize or get session ID
  useEffect(() => {
    const initSessionId = async () => {
      let guestSessionId = await AsyncStorage.getItem('cartSessionId');
      if (!guestSessionId) {
        // Generate a simple UUID
        guestSessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        await AsyncStorage.setItem('cartSessionId', guestSessionId);
      }
      setSessionId(guestSessionId);
    };

    initSessionId();
  }, []);

  // Fetch cart
  const fetchCart = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'GET',
        headers: {
          'x-session-id': sessionId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const result = await response.json();
      setCart(result);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchCart();
    }
  }, [sessionId, fetchCart]);

  const addToCart = async (productId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to cart');
      }

      const result = await response.json();
      setCart(result);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/cart/items`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update cart item');
      }

      const result = await response.json();
      setCart(result);
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/cart/items`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove from cart');
      }

      const result = await response.json();
      setCart(result);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'DELETE',
        headers: {
          'x-session-id': sessionId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      const result = await response.json();
      setCart(result);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount: cart?.itemCount || 0,
        subtotal: cart?.subtotal || 0,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
