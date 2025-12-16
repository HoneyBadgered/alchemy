/**
 * StripePayment Component Tests
 * 
 * Tests for Stripe payment integration including:
 * - Payment form rendering
 * - Payment submission
 * - Success and error handling
 * - Loading states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StripePayment from '@/components/StripePayment';
import { loadStripe } from '@stripe/stripe-js';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        unmount: vi.fn(),
        on: vi.fn(),
        update: vi.fn(),
      })),
      getElement: vi.fn(),
    })),
  })),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => children,
  useStripe: () => ({
    confirmPayment: vi.fn(() => Promise.resolve({ paymentIntent: { status: 'succeeded' } })),
  }),
  useElements: () => ({
    getElement: vi.fn(),
  }),
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
}));

describe('StripePayment Component', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render payment element', () => {
    render(
      <StripePayment
        clientSecret="pi_test_secret"
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByTestId('payment-element')).toBeInTheDocument();
  });

  it('should show pay button', () => {
    render(
      <StripePayment
        clientSecret="pi_test_secret"
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByRole('button', { name: /pay/i })).toBeInTheDocument();
  });

  it('should handle successful payment', async () => {
    const user = userEvent.setup();
    
    render(
      <StripePayment
        clientSecret="pi_test_secret"
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const payButton = screen.getByRole('button', { name: /pay/i });
    await user.click(payButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display amount when provided', () => {
    render(
      <StripePayment
        clientSecret="pi_test_secret"
        amount={2598}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/\$25.98/)).toBeInTheDocument();
  });

  it('should disable button while processing', async () => {
    const user = userEvent.setup();
    
    render(
      <StripePayment
        clientSecret="pi_test_secret"
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    const payButton = screen.getByRole('button', { name: /pay/i });
    await user.click(payButton);

    // Button should be disabled during processing
    expect(payButton).toBeDisabled();
  });
});
