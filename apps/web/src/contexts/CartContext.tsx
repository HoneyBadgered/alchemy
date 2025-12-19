'use client';

/**
 * Cart Context Provider
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { cartApi, CartResponse } from '@/lib/cart-api';

interface CartContextValue {
  cart: CartResponse | null;
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  sessionId: string;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  addBlendToCart: (baseTeaId: string, addIns: Array<{ ingredientId: string; quantity: number }>, name?: string) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize or get session ID for guest users
  useEffect(() => {
    if (!isAuthenticated) {
      let guestSessionId = localStorage.getItem('cartSessionId');
      if (!guestSessionId) {
        guestSessionId = crypto.randomUUID();
        localStorage.setItem('cartSessionId', guestSessionId);
      }
      setSessionId(guestSessionId);
    }
  }, [isAuthenticated]);

  // Fetch cart on mount and when auth state changes
  const fetchCart = useCallback(async () => {
    if (!accessToken && !sessionId) return;

    setIsLoading(true);
    try {
      const result = await cartApi.getCart(accessToken || undefined, sessionId || undefined);
      setCart(result);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, sessionId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Merge guest cart with user cart after login
  useEffect(() => {
    const mergeGuestCart = async () => {
      const guestSessionId = localStorage.getItem('cartSessionId');
      if (isAuthenticated && accessToken && guestSessionId) {
        try {
          await cartApi.mergeCart(guestSessionId, accessToken);
          localStorage.removeItem('cartSessionId');
          setSessionId('');
          await fetchCart();
        } catch (error) {
          console.error('Failed to merge cart:', error);
        }
      }
    };

    mergeGuestCart();
  }, [isAuthenticated, accessToken, fetchCart]);

  const addToCart = async (productId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const result = await cartApi.addToCart(
        productId,
        quantity,
        accessToken || undefined,
        sessionId || undefined
      );
      setCart(result);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addBlendToCart = async (baseTeaId: string, addIns: Array<{ ingredientId: string; quantity: number }>, name?: string) => {
    setIsLoading(true);
    try {
      const result = await cartApi.addBlendToCart(
        baseTeaId,
        addIns,
        accessToken || undefined,
        sessionId || undefined,
        name
      );
      setCart(result);
    } catch (error) {
      console.error('Failed to add blend to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const result = await cartApi.updateCartItem(
        productId,
        quantity,
        accessToken || undefined,
        sessionId || undefined
      );
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
      const result = await cartApi.removeFromCart(
        productId,
        accessToken || undefined,
        sessionId || undefined
      );
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
      const result = await cartApi.clearCart(
        accessToken || undefined,
        sessionId || undefined
      );
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
        sessionId,
        addToCart,
        addBlendToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
      {/* ARIA live region for cart updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {cart && cart.itemCount > 0
          ? `Shopping cart updated. ${cart.itemCount} ${cart.itemCount === 1 ? 'item' : 'items'} in cart. Subtotal: $${cart.subtotal.toFixed(2)}`
          : 'Shopping cart is empty'}
      </div>
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
