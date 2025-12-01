/**
 * Admin Orders Page Tests
 * Tests that the orders page properly handles orders with null users (guest orders)
 */

import { render, screen, waitFor } from '@testing-library/react';
import AdminOrdersPage from '../page';
import { useAuthStore } from '@/store/authStore';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AdminOrdersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store with authenticated admin state
    useAuthStore.setState({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        username: 'adminuser',
        role: 'admin',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      },
      accessToken: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      hasHydrated: true,
    });
  });

  it('should handle orders with registered users', async () => {
    const ordersWithUsers = {
      orders: [
        {
          id: 'order-1',
          status: 'pending',
          totalAmount: 100,
          createdAt: new Date().toISOString(),
          guestEmail: null,
          user: {
            username: 'testuser',
            email: 'testuser@example.com',
          },
          items: [
            {
              product: { name: 'Test Product' },
              quantity: 1,
              price: 100,
            },
          ],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(ordersWithUsers),
    });

    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('testuser@example.com')).toBeInTheDocument();
    });
  });

  it('should handle orders with null users (guest orders) without crashing', async () => {
    const ordersWithNullUsers = {
      orders: [
        {
          id: 'order-1',
          status: 'pending',
          totalAmount: 100,
          createdAt: new Date().toISOString(),
          guestEmail: 'guest@example.com',
          user: null,
          items: [
            {
              product: { name: 'Test Product' },
              quantity: 1,
              price: 100,
            },
          ],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(ordersWithNullUsers),
    });

    render(<AdminOrdersPage />);

    await waitFor(() => {
      // Should display guest email instead of crashing
      // guest@example.com appears twice (as username fallback and as email)
      expect(screen.getAllByText('guest@example.com').length).toBe(2);
    });
  });

  it('should display Guest when both user and guestEmail are null', async () => {
    const ordersWithNoUserInfo = {
      orders: [
        {
          id: 'order-1',
          status: 'pending',
          totalAmount: 100,
          createdAt: new Date().toISOString(),
          guestEmail: null,
          user: null,
          items: [
            {
              product: { name: 'Test Product' },
              quantity: 1,
              price: 100,
            },
          ],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(ordersWithNoUserInfo),
    });

    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Guest')).toBeInTheDocument();
      expect(screen.getByText('No email')).toBeInTheDocument();
    });
  });

  it('should handle mixed orders (some with users, some without)', async () => {
    const mixedOrders = {
      orders: [
        {
          id: 'order-1',
          status: 'pending',
          totalAmount: 100,
          createdAt: new Date().toISOString(),
          guestEmail: null,
          user: {
            username: 'testuser',
            email: 'testuser@example.com',
          },
          items: [
            { product: { name: 'Product 1' }, quantity: 1, price: 50 },
          ],
        },
        {
          id: 'order-2',
          status: 'completed',
          totalAmount: 200,
          createdAt: new Date().toISOString(),
          guestEmail: 'guest@example.com',
          user: null,
          items: [
            { product: { name: 'Product 2' }, quantity: 2, price: 100 },
          ],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mixedOrders),
    });

    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('testuser@example.com')).toBeInTheDocument();
      // guest@example.com appears twice (as username fallback and as email)
      expect(screen.getAllByText('guest@example.com').length).toBe(2);
    });
  });
});
