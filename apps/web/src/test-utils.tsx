/**
 * Test Utilities
 * 
 * Common utilities and helpers for testing
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { CartProvider } from '@/contexts/CartContext';

// Custom render function that includes common providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <CartProvider>{children}</CartProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock ingredient data generator
export function createMockIngredient(overrides?: Partial<any>) {
  return {
    id: 'test-ingredient',
    name: 'Test Ingredient',
    category: 'addIn',
    isBase: false,
    baseAmount: 2,
    incrementAmount: 1,
    flavorProfile: {
      earthy: 0,
      floral: 0,
      spicy: 0,
      sweet: 0,
      citrus: 0,
    },
    ...overrides,
  };
}

// Mock product data generator
export function createMockProduct(overrides?: Partial<any>) {
  return {
    id: 'test-product',
    name: 'Test Product',
    price: 12.99,
    image: '/images/test.jpg',
    isActive: true,
    stock: 50,
    description: 'Test product description',
    ...overrides,
  };
}

// Mock cart data generator
export function createMockCart(overrides?: Partial<any>) {
  return {
    cart: {
      id: 'test-cart',
      userId: null,
      sessionId: 'test-session',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides?.cart,
    },
    subtotal: 0,
    itemCount: 0,
    ...overrides,
  };
}

// Mock order data generator
export function createMockOrder(overrides?: Partial<any>) {
  return {
    id: 'test-order',
    userId: null,
    sessionId: 'test-session',
    status: 'pending',
    total: 0,
    subtotal: 0,
    shippingCost: 0,
    tax: 0,
    items: [],
    shippingAddress: {
      firstName: 'Test',
      lastName: 'User',
      addressLine1: '123 Test St',
      addressLine2: '',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'US',
      phone: '555-1234',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Wait for async operations
export async function waitForAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
