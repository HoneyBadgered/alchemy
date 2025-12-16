/**
 * Cart Context Tests
 * 
 * Tests for cart functionality including:
 * - Adding items to cart
 * - Updating item quantities
 * - Removing items
 * - Clearing cart
 * - Guest cart session management
 * - Cart merge on login
 * - Price calculations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import * as cartApi from '@/lib/cart-api';
import * as authStore from '@/store/authStore';

// Mock cart API
vi.mock('@/lib/cart-api', () => ({
  cartApi: {
    getCart: vi.fn(),
    addToCart: vi.fn(),
    addBlendToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    mergeCart: vi.fn(),
  },
}));

// Mock auth store
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    accessToken: null,
    isAuthenticated: false,
  })),
}));

const mockEmptyCart = {
  cart: {
    id: 'cart-1',
    userId: null,
    sessionId: 'session-123',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  subtotal: 0,
  itemCount: 0,
};

const mockCartWithItems = {
  cart: {
    id: 'cart-1',
    userId: null,
    sessionId: 'session-123',
    items: [
      {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
        product: {
          id: 'product-1',
          name: 'Green Tea',
          price: 12.99,
          image: '/images/green-tea.jpg',
          isActive: true,
          stock: 50,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  subtotal: 25.98,
  itemCount: 2,
};

describe('CartContext - Guest User', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock as guest user
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
    } as any);
  });

  it('should generate and store session ID for guest users', async () => {
    vi.mocked(cartApi.cartApi.getCart).mockResolvedValue(mockEmptyCart);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.sessionId).toBeTruthy();
      expect(localStorage.getItem('cartSessionId')).toBeTruthy();
    });
  });

  it('should fetch cart on mount', async () => {
    vi.mocked(cartApi.cartApi.getCart).mockResolvedValue(mockEmptyCart);

    renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(cartApi.cartApi.getCart).toHaveBeenCalled();
    });
  });

  it('should add item to cart', async () => {
    vi.mocked(cartApi.cartApi.getCart).mockResolvedValue(mockEmptyCart);
    vi.mocked(cartApi.cartApi.addToCart).mockResolvedValue(mockCartWithItems);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.sessionId).toBeTruthy();
    });

    await act(async () => {
      await result.current.addToCart('product-1', 2);
    });

    await waitFor(() => {
      expect(cartApi.cartApi.addToCart).toHaveBeenCalledWith(
        'product-1',
        2,
        undefined,
        expect.any(String)
      );
      expect(result.current.itemCount).toBe(2);
      expect(result.current.subtotal).toBe(25.98);
    });
  });

  it('should update cart item quantity', async () => {
    vi.mocked(cartApi.cartApi.getCart).mockResolvedValue(mockCartWithItems);
    
    const updatedCart = {
      ...mockCartWithItems,
      cart: {
        ...mockCartWithItems.cart,
        items: [{
          ...mockCartWithItems.cart.items[0],
          quantity: 5,
        }],
      },
      subtotal: 64.95,
      itemCount: 5,
    };
    vi.mocked(cartApi.cartApi.updateCartItem).mockResolvedValue(updatedCart);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.itemCount).toBe(2);
    });

    await act(async () => {
      await result.current.updateCartItem('product-1', 5);
    });

    await waitFor(() => {
      expect(cartApi.cartApi.updateCartItem).toHaveBeenCalledWith(
        'product-1',
        5,
        undefined,
        expect.any(String)
      );
      expect(result.current.itemCount).toBe(5);
    });
  });

  it('should remove item from cart', async () => {
    vi.mocked(cartApi.cartApi.getCart).mockResolvedValue(mockCartWithItems);
    vi.mocked(cartApi.cartApi.removeFromCart).mockResolvedValue(mockEmptyCart);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.itemCount).toBe(2);
    });

    await act(async () => {
      await result.current.removeFromCart('product-1');
    });

    await waitFor(() => {
      expect(cartApi.cartApi.removeFromCart).toHaveBeenCalledWith(
        'product-1',
        undefined,
        expect.any(String)
      );
      expect(result.current.itemCount).toBe(0);
    });
  });

  it('should clear entire cart', async () => {
    vi.mocked(cartApi.cartApi.getCart).mockResolvedValue(mockCartWithItems);
    vi.mocked(cartApi.cartApi.clearCart).mockResolvedValue(mockEmptyCart);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.itemCount).toBe(2);
    });

    await act(async () => {
      await result.current.clearCart();
    });

    await waitFor(() => {
      expect(cartApi.cartApi.clearCart).toHaveBeenCalled();
      expect(result.current.itemCount).toBe(0);
    });
  });

  it('should add custom blend to cart', async () => {
    vi.mocked(cartApi.cartApi.getCart).mockResolvedValue(mockEmptyCart);
    
    const blendCart = {
      ...mockCartWithItems,
      cart: {
        ...mockCartWithItems.cart,
        items: [{
          ...mockCartWithItems.cart.items[0],
          product: {
            ...mockCartWithItems.cart.items[0].product,
            name: 'Custom Blend - Green Tea with Lavender',
          },
        }],
      },
    };
    vi.mocked(cartApi.cartApi.addBlendToCart).mockResolvedValue(blendCart);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.sessionId).toBeTruthy();
    });

    await act(async () => {
      await result.current.addBlendToCart('green-tea', [
        { ingredientId: 'lavender', quantity: 2 },
      ]);
    });

    await waitFor(() => {
      expect(cartApi.cartApi.addBlendToCart).toHaveBeenCalledWith(
        'green-tea',
        [{ ingredientId: 'lavender', quantity: 2 }],
        undefined,
        expect.any(String)
      );
      expect(result.current.cart?.cart.items[0].product.name).toContain('Custom Blend');
    });
  });
});

describe('CartContext - Authenticated User', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock as authenticated user
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      accessToken: 'test-token',
      isAuthenticated: true,
    } as any);
  });

  it('should not generate session ID for authenticated users', async () => {
    vi.mocked(cartApi.cartApi.getCart).mockResolvedValue(mockEmptyCart);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.sessionId).toBe('');
      expect(localStorage.getItem('cartSessionId')).toBeNull();
    });
  });

  it('should use access token for cart operations', async () => {
    vi.mocked(cartApi.cartApi.getCart).mockResolvedValue(mockEmptyCart);
    vi.mocked(cartApi.cartApi.addToCart).mockResolvedValue(mockCartWithItems);

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(cartApi.cartApi.getCart).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.addToCart('product-1', 2);
    });

    await waitFor(() => {
      expect(cartApi.cartApi.addToCart).toHaveBeenCalledWith(
        'product-1',
        2,
        'test-token',
        undefined
      );
    });
  });
});

describe('CartContext - Cart Merge on Login', () => {
  it('should merge guest cart when user logs in', async () => {
    // Start as guest
    const guestSessionId = 'guest-session-123';
    localStorage.setItem('cartSessionId', guestSessionId);
    
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
    } as any);

    vi.mocked(cartApi.cartApi.getCart).mockResolvedValue(mockCartWithItems);
    vi.mocked(cartApi.cartApi.mergeCart).mockResolvedValue(mockCartWithItems);

    const { rerender } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(localStorage.getItem('cartSessionId')).toBe(guestSessionId);
    });

    // Simulate login
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      accessToken: 'new-auth-token',
      isAuthenticated: true,
    } as any);

    rerender();

    await waitFor(() => {
      expect(cartApi.cartApi.mergeCart).toHaveBeenCalledWith(
        guestSessionId,
        'new-auth-token'
      );
      expect(localStorage.getItem('cartSessionId')).toBeNull();
    });
  });
});

describe('CartContext - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
    } as any);
  });

  it('should handle cart fetch errors gracefully', async () => {
    vi.mocked(cartApi.cartApi.getCart).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.cart).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle add to cart errors and throw', async () => {
    vi.mocked(cartApi.cartApi.getCart).mockResolvedValue(mockEmptyCart);
    vi.mocked(cartApi.cartApi.addToCart).mockRejectedValue(new Error('Out of stock'));

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    await waitFor(() => {
      expect(result.current.sessionId).toBeTruthy();
    });

    await expect(async () => {
      await act(async () => {
        await result.current.addToCart('product-1', 100);
      });
    }).rejects.toThrow();
  });
});
