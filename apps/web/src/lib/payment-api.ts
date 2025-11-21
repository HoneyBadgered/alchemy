/**
 * Payment API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface CreatePaymentIntentInput {
  orderId: string;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentStatusResult {
  status: string;
  orderId: string;
  orderStatus: string;
  paymentIntentId?: string;
}

export const paymentApi = {
  /**
   * Create a payment intent for an order
   */
  async createPaymentIntent(
    input: CreatePaymentIntentInput,
    token: string
  ): Promise<PaymentIntentResult> {
    const response = await fetch(`${API_URL}/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }

    return response.json();
  },

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(
    orderId: string,
    token: string
  ): Promise<PaymentStatusResult> {
    const response = await fetch(`${API_URL}/payments/status/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get payment status');
    }

    return response.json();
  },
};
