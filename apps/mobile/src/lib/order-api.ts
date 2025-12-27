/**
 * Order API Client for Mobile
 */

import type {
  ShippingAddress,
  PlaceOrderInput,
  Order,
  OrderListResponse,
} from '@alchemy/types';

// For Expo, we need to use environment variables differently
const API_URL = 'http://localhost:3000'; // This would be configured in app.json/app.config.js

export const orderApi = {
  /**
   * Place an order from the user's cart
   */
  async placeOrder(input: PlaceOrderInput, token: string): Promise<Order> {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to place order');
    }

    return response.json();
  },

  /**
   * Get user's order history
   */
  async getOrders(
    token: string,
    filters?: {
      page?: number;
      perPage?: number;
      status?: string;
    }
  ): Promise<OrderListResponse> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.perPage) params.append('perPage', filters.perPage.toString());
    if (filters?.status) params.append('status', filters.status);

    const url = `${API_URL}/orders${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  },

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: string, token: string): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch order');
    }

    return response.json();
  },
};
