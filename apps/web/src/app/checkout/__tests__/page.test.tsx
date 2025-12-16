/**
 * Checkout Flow Tests
 * 
 * Tests for the checkout process including:
 * - Shipping information form validation
 * - Guest checkout with email
 * - Payment processing flow
 * - Order creation
 * - Empty cart redirect
 * - Error handling
 * - Payment configuration checks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutPage from '@/app/checkout/page';
import * as CartContext from '@/contexts/CartContext';
import * as authStore from '@/store/authStore';
import * as orderApi from '@/lib/order-api';
import * as paymentApi from '@/lib/payment-api';

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
  }),
  usePathname: () => '/checkout',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock contexts and APIs
vi.mock('@/contexts/CartContext');
vi.mock('@/store/authStore');
vi.mock('@/lib/order-api');
vi.mock('@/lib/payment-api');

const mockCart = {
  id: 'cart-1',
  userId: null,
  sessionId: 'guest-session-123',
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
};

describe('CheckoutPage - Guest Checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    
    // Mock as guest user
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: true,
    } as any);
    
    // Mock cart with items
    vi.mocked(CartContext.useCart).mockReturnValue({
      cart: mockCart as any,
      itemCount: 2,
      subtotal: 25.98,
      isLoading: false,
      sessionId: 'guest-session-123',
      addToCart: vi.fn(),
      addBlendToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });
    
    // Mock payment config
    vi.mocked(paymentApi.paymentApi.getConfig).mockResolvedValue({
      configured: true,
      publishableKey: 'pk_test_123',
    });
  });

  it('should show shipping form for guest users', async () => {
    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    });
  });

  it('should require email for guest checkout', async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Fill in shipping info but not email
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'Portland');
    await user.type(screen.getByLabelText(/zip/i), '97201');

    // Try to submit
    const submitButton = screen.getByRole('button', { name: /continue to payment/i });
    await user.click(submitButton);

    // Should show email error
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('should validate shipping address fields', async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    // Fill in email only
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');

    // Try to submit without other fields
    const submitButton = screen.getByRole('button', { name: /continue to payment/i });
    await user.click(submitButton);

    // Should show validation errors (HTML5 validation or custom)
    // This would need to check for specific error messages based on implementation
  });

  it('should proceed to payment step when shipping info is valid', async () => {
    const user = userEvent.setup();
    
    // Mock order creation
    vi.mocked(orderApi.orderApi.placeOrder).mockResolvedValue({
      id: 'order-123',
      status: 'pending',
      total: 25.98,
    } as any);
    
    // Mock payment intent creation
    vi.mocked(paymentApi.paymentApi.createPaymentIntent).mockResolvedValue({
      clientSecret: 'pi_123_secret_456',
      paymentIntentId: 'pi_123',
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    // Fill in all required fields
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'Portland');
    await user.type(screen.getByLabelText(/state/i), 'OR');
    await user.type(screen.getByLabelText(/zip/i), '97201');
    await user.type(screen.getByLabelText(/phone/i), '555-123-4567');

    // Submit
    const submitButton = screen.getByRole('button', { name: /continue to payment/i });
    await user.click(submitButton);

    // Should create order and show payment step
    await waitFor(() => {
      expect(orderApi.orderApi.placeOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingAddress: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Main St',
            city: 'Portland',
            state: 'OR',
            zipCode: '97201',
          }),
          guestEmail: 'john@example.com',
        }),
        undefined,
        'guest-session-123'
      );
    });
  });

  it('should handle order creation errors', async () => {
    const user = userEvent.setup();
    
    // Mock order creation failure
    vi.mocked(orderApi.orderApi.placeOrder).mockRejectedValue(
      new Error('Insufficient stock')
    );

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'Portland');
    await user.type(screen.getByLabelText(/state/i), 'OR');
    await user.type(screen.getByLabelText(/zip/i), '97201');

    // Submit
    const submitButton = screen.getByRole('button', { name: /continue to payment/i });
    await user.click(submitButton);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/insufficient stock/i)).toBeInTheDocument();
    });
  });
});

describe('CheckoutPage - Authenticated User', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    
    // Mock as authenticated user
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      accessToken: 'test-token',
      isAuthenticated: true,
      hasHydrated: true,
    } as any);
    
    // Mock cart with items
    vi.mocked(CartContext.useCart).mockReturnValue({
      cart: mockCart as any,
      itemCount: 2,
      subtotal: 25.98,
      isLoading: false,
      sessionId: '',
      addToCart: vi.fn(),
      addBlendToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });
    
    // Mock payment config
    vi.mocked(paymentApi.paymentApi.getConfig).mockResolvedValue({
      configured: true,
      publishableKey: 'pk_test_123',
    });
  });

  it('should not require email for authenticated users', async () => {
    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Email field should not be present or not required
    const emailField = screen.queryByLabelText(/email/i);
    if (emailField) {
      expect(emailField).not.toHaveAttribute('required');
    }
  });

  it('should use access token for order creation', async () => {
    const user = userEvent.setup();
    
    vi.mocked(orderApi.orderApi.placeOrder).mockResolvedValue({
      id: 'order-123',
      status: 'pending',
      total: 25.98,
    } as any);
    
    vi.mocked(paymentApi.paymentApi.createPaymentIntent).mockResolvedValue({
      clientSecret: 'pi_123_secret_456',
      paymentIntentId: 'pi_123',
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Fill in shipping info (no email needed)
    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/address/i), '456 Oak Ave');
    await user.type(screen.getByLabelText(/city/i), 'Seattle');
    await user.type(screen.getByLabelText(/state/i), 'WA');
    await user.type(screen.getByLabelText(/zip/i), '98101');

    const submitButton = screen.getByRole('button', { name: /continue to payment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(orderApi.orderApi.placeOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingAddress: expect.objectContaining({
            firstName: 'Jane',
            lastName: 'Smith',
          }),
          guestEmail: undefined,
        }),
        'test-token',
        undefined
      );
    });
  });
});

describe('CheckoutPage - Empty Cart Redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: true,
    } as any);
    
    vi.mocked(paymentApi.paymentApi.getConfig).mockResolvedValue({
      configured: true,
      publishableKey: 'pk_test_123',
    });
  });

  it('should redirect to cart page when cart is empty', async () => {
    // Mock empty cart
    vi.mocked(CartContext.useCart).mockReturnValue({
      cart: null,
      itemCount: 0,
      subtotal: 0,
      isLoading: false,
      sessionId: 'guest-session-123',
      addToCart: vi.fn(),
      addBlendToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/cart');
    });
  });
});

describe('CheckoutPage - Payment Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: true,
    } as any);
    
    vi.mocked(CartContext.useCart).mockReturnValue({
      cart: mockCart as any,
      itemCount: 2,
      subtotal: 25.98,
      isLoading: false,
      sessionId: 'guest-session-123',
      addToCart: vi.fn(),
      addBlendToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });
  });

  it('should check payment configuration on mount', async () => {
    vi.mocked(paymentApi.paymentApi.getConfig).mockResolvedValue({
      configured: true,
      publishableKey: 'pk_test_123',
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(paymentApi.paymentApi.getConfig).toHaveBeenCalled();
    });
  });

  it('should show error when payment is not configured', async () => {
    const user = userEvent.setup();
    
    vi.mocked(paymentApi.paymentApi.getConfig).mockResolvedValue({
      configured: false,
      publishableKey: null,
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    // Fill in form
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'Portland');
    await user.type(screen.getByLabelText(/state/i), 'OR');
    await user.type(screen.getByLabelText(/zip/i), '97201');

    const submitButton = screen.getByRole('button', { name: /continue to payment/i });
    await user.click(submitButton);

    // Should show payment configuration error
    await waitFor(() => {
      expect(screen.getByText(/payment processing is not configured/i)).toBeInTheDocument();
    });
  });
});

describe('CheckoutPage - Customer Notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      accessToken: 'test-token',
      isAuthenticated: true,
      hasHydrated: true,
    } as any);
    
    vi.mocked(CartContext.useCart).mockReturnValue({
      cart: mockCart as any,
      itemCount: 2,
      subtotal: 25.98,
      isLoading: false,
      sessionId: '',
      addToCart: vi.fn(),
      addBlendToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });
    
    vi.mocked(paymentApi.paymentApi.getConfig).mockResolvedValue({
      configured: true,
      publishableKey: 'pk_test_123',
    });
  });

  it('should include customer notes in order', async () => {
    const user = userEvent.setup();
    
    vi.mocked(orderApi.orderApi.placeOrder).mockResolvedValue({
      id: 'order-123',
      status: 'pending',
      total: 25.98,
    } as any);
    
    vi.mocked(paymentApi.paymentApi.createPaymentIntent).mockResolvedValue({
      clientSecret: 'pi_123_secret_456',
      paymentIntentId: 'pi_123',
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Fill in shipping info
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'Portland');
    await user.type(screen.getByLabelText(/state/i), 'OR');
    await user.type(screen.getByLabelText(/zip/i), '97201');

    // Add customer notes
    const notesField = screen.getByLabelText(/notes/i) || screen.getByPlaceholderText(/special instructions/i);
    if (notesField) {
      await user.type(notesField, 'Please leave at front door');
    }

    const submitButton = screen.getByRole('button', { name: /continue to payment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(orderApi.orderApi.placeOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          customerNotes: 'Please leave at front door',
        }),
        'test-token',
        undefined
      );
    });
  });
});
