/**
 * Order API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface PlaceOrderInput {
  shippingAddress?: ShippingAddress;
  shippingMethod?: string;
  customerNotes?: string;
  discountCode?: string;
  guestEmail?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: string;
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    category?: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  shippingMethod?: string;
  shippingCost?: number;
  taxAmount?: number;
  discountCode?: string;
  discountAmount?: number;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
  order_items: OrderItem[];
  statusLogs?: Array<{
    id: string;
    fromStatus?: string;
    toStatus: string;
    notes?: string;
    createdAt: string;
  }>;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export const orderApi = {
  /**
   * Place an order from the user's or guest's cart
   */
  async placeOrder(input: PlaceOrderInput, token?: string, sessionId?: string): Promise<Order> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }
    
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers,
      credentials: 'include',
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
      credentials: 'include',
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
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch order');
    }

    return response.json();
  },
};
