/**
 * Payment API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

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

export interface OrderByPaymentIntentResult {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
}

export interface PaymentConfigResult {
  configured: boolean;
}

export const paymentApi = {
  /**
   * Check if payment processing is configured
   */
  async getConfig(): Promise<PaymentConfigResult> {
    const response = await fetch(`${API_URL}/payments/config`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      // If we can't get config, assume not configured
      return { configured: false };
    }

    return response.json();
  },

  /**
   * Create a payment intent for an order
   */
  async createPaymentIntent(
    input: CreatePaymentIntentInput,
    token?: string,
    sessionId?: string
  ): Promise<PaymentIntentResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }
    
    // Add CSRF token for state-changing requests
    const csrfToken = typeof document !== 'undefined' ? getCookie('XSRF-TOKEN') : null;
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    const response = await fetch(`${API_URL}/payments/create-intent`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create payment intent' }));
      
      // Log technical details for debugging
      console.error('Payment API error:', error);
      
      // Show user-friendly message
      const userMessage = error.code?.startsWith('CSRF_') 
        ? 'Your session has expired. Please refresh the page and try again.'
        : error.message || 'Unable to process payment. Please try again.';
      
      throw new Error(userMessage);
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

  /**
   * Get order by payment intent ID (used after Stripe redirect)
   */
  async getOrderByPaymentIntent(
    paymentIntentId: string,
    clientSecret?: string
  ): Promise<OrderByPaymentIntentResult> {
    const params = new URLSearchParams();
    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }
    const queryString = params.toString();
    const url = `${API_URL}/payments/order-by-intent/${paymentIntentId}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get order details');
    }

    return response.json();
  },

  /**
   * Manually sync payment status from Stripe
   */
  async syncPaymentStatus(orderId: string, sessionId?: string): Promise<PaymentStatusResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const response = await fetch(`${API_URL}/payments/sync/${orderId}`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync payment status');
    }

    return response.json();
  },
};
