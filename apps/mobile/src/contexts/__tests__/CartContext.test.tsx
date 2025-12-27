/**
 * Mobile Cart Context Tests
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartProvider, useCart } from '../CartContext';
import { Text } from 'react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Test component to access cart context
function TestComponent({ testId = 'test' }: { testId?: string }) {
  const cart = useCart();
  return (
    <>
      <Text testID={`${testId}-loading`}>{cart.isLoading ? 'loading' : 'ready'}</Text>
      <Text testID={`${testId}-count`}>{cart.itemCount}</Text>
      <Text testID={`${testId}-subtotal`}>{cart.subtotal}</Text>
    </>
  );
}

describe('Mobile Cart Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        cart: {
          id: 'cart-1',
          sessionId: 'session-123',
          items: [],
        },
        subtotal: 0,
        itemCount: 0,
      }),
    });
  });

  describe('Initialization', () => {
    it('should initialize with empty cart', async () => {
      const { getByTestId } = render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      await waitFor(() => {
        expect(getByTestId('test-count').props.children).toBe(0);
      });
    });

    it('should generate session ID for guest users', async () => {
      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('cartSessionId');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'cartSessionId',
          expect.any(String)
        );
      });
    });

    it('should reuse existing session ID', async () => {
      const existingSession = 'existing-session-123';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(existingSession);

      render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      await waitFor(() => {
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      });
    });
  });

  describe('Add to Cart', () => {
    it('should add item to cart', async () => {
      const mockCart = {
        cart: {
          id: 'cart-1',
          sessionId: 'session-123',
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              quantity: 1,
              product: {
                id: 'product-1',
                name: 'Green Tea',
                price: 19.99,
              },
            },
          ],
        },
        subtotal: 19.99,
        itemCount: 1,
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ cart: { items: [] }, subtotal: 0, itemCount: 0 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCart,
        });

      const TestAddComponent = () => {
        const cart = useCart();
        
        React.useEffect(() => {
          cart.addToCart('product-1', 1);
        }, []);

        return (
          <Text testID="item-count">{cart.itemCount}</Text>
        );
      };

      const { getByTestId } = render(
        <CartProvider>
          <TestAddComponent />
        </CartProvider>
      );

      await waitFor(() => {
        expect(getByTestId('item-count').props.children).toBe(1);
      });
    });

    it('should handle add to cart errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Product out of stock' }),
      });

      const TestErrorComponent = () => {
        const cart = useCart();
        const [error, setError] = React.useState('');

        React.useEffect(() => {
          cart.addToCart('product-1', 1).catch((err) => {
            setError(err.message);
          });
        }, []);

        return <Text testID="error">{error}</Text>;
      };

      const { getByTestId } = render(
        <CartProvider>
          <TestErrorComponent />
        </CartProvider>
      );

      await waitFor(() => {
        expect(getByTestId('error').props.children).toContain('stock');
      });
    });
  });

  describe('Update Cart Item', () => {
    it('should update item quantity', async () => {
      const mockInitialCart = {
        cart: {
          id: 'cart-1',
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              quantity: 1,
              product: { id: 'product-1', name: 'Green Tea', price: 19.99 },
            },
          ],
        },
        subtotal: 19.99,
        itemCount: 1,
      };

      const mockUpdatedCart = {
        cart: {
          id: 'cart-1',
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              quantity: 3,
              product: { id: 'product-1', name: 'Green Tea', price: 19.99 },
            },
          ],
        },
        subtotal: 59.97,
        itemCount: 3,
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockInitialCart })
        .mockResolvedValueOnce({ ok: true, json: async () => mockUpdatedCart });

      const TestUpdateComponent = () => {
        const cart = useCart();

        React.useEffect(() => {
          if (cart.itemCount === 1) {
            cart.updateCartItem('product-1', 3);
          }
        }, [cart.itemCount]);

        return <Text testID="item-count">{cart.itemCount}</Text>;
      };

      const { getByTestId } = render(
        <CartProvider>
          <TestUpdateComponent />
        </CartProvider>
      );

      await waitFor(() => {
        expect(getByTestId('item-count').props.children).toBe(3);
      });
    });
  });

  describe('Remove from Cart', () => {
    it('should remove item from cart', async () => {
      const mockInitialCart = {
        cart: {
          id: 'cart-1',
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              quantity: 1,
              product: { id: 'product-1', name: 'Green Tea', price: 19.99 },
            },
          ],
        },
        subtotal: 19.99,
        itemCount: 1,
      };

      const mockEmptyCart = {
        cart: { id: 'cart-1', items: [] },
        subtotal: 0,
        itemCount: 0,
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockInitialCart })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyCart });

      const TestRemoveComponent = () => {
        const cart = useCart();

        React.useEffect(() => {
          if (cart.itemCount > 0) {
            cart.removeFromCart('product-1');
          }
        }, [cart.itemCount]);

        return <Text testID="item-count">{cart.itemCount}</Text>;
      };

      const { getByTestId } = render(
        <CartProvider>
          <TestRemoveComponent />
        </CartProvider>
      );

      await waitFor(() => {
        expect(getByTestId('item-count').props.children).toBe(0);
      });
    });
  });

  describe('Clear Cart', () => {
    it('should clear all items from cart', async () => {
      const mockInitialCart = {
        cart: {
          id: 'cart-1',
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              quantity: 2,
              product: { id: 'product-1', name: 'Green Tea', price: 19.99 },
            },
          ],
        },
        subtotal: 39.98,
        itemCount: 2,
      };

      const mockEmptyCart = {
        cart: { id: 'cart-1', items: [] },
        subtotal: 0,
        itemCount: 0,
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockInitialCart })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmptyCart });

      const TestClearComponent = () => {
        const cart = useCart();

        React.useEffect(() => {
          if (cart.itemCount > 0) {
            cart.clearCart();
          }
        }, [cart.itemCount]);

        return <Text testID="item-count">{cart.itemCount}</Text>;
      };

      const { getByTestId } = render(
        <CartProvider>
          <TestClearComponent />
        </CartProvider>
      );

      await waitFor(() => {
        expect(getByTestId('item-count').props.children).toBe(0);
      });
    });
  });

  describe('Subtotal Calculation', () => {
    it('should calculate correct subtotal', async () => {
      const mockCart = {
        cart: {
          id: 'cart-1',
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              quantity: 2,
              product: { id: 'product-1', name: 'Green Tea', price: 19.99 },
            },
            {
              id: 'item-2',
              productId: 'product-2',
              quantity: 1,
              product: { id: 'product-2', name: 'Black Tea', price: 24.99 },
            },
          ],
        },
        subtotal: 64.97,
        itemCount: 3,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCart,
      });

      const { getByTestId } = render(
        <CartProvider>
          <TestComponent />
        </CartProvider>
      );

      await waitFor(() => {
        expect(getByTestId('test-subtotal').props.children).toBe(64.97);
      });
    });
  });
});
