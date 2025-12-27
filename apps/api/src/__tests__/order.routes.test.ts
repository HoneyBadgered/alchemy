/**
 * Order Routes Tests
 */

import Fastify, { FastifyInstance } from 'fastify';
import { orderRoutes } from '../routes/order.routes';
import { OrderService } from '../services/order.service';

// Mock the order service
jest.mock('../services/order.service');

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  authMiddleware: async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
    request.user = { userId: 'user-1' };
  },
  optionalAuthMiddleware: async (request: any, reply: any) => {
    if (request.headers.authorization) {
      request.user = { userId: 'user-1' };
    }
  },
}));

describe('Order Routes', () => {
  let app: FastifyInstance;
  let mockOrderService: jest.Mocked<OrderService>;

  beforeEach(async () => {
    app = Fastify();
    await app.register(orderRoutes);
    
    mockOrderService = jest.mocked(OrderService.prototype);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /orders', () => {
    it('should create order for authenticated user', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        total: 49.99,
        status: 'pending',
        order_items: [],
      };

      mockOrderService.createOrderFromCart = jest.fn().mockResolvedValue(mockOrder);

      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('order-1');
      expect(mockOrderService.createOrderFromCart).toHaveBeenCalled();
    });

    it('should create order for guest with session ID', async () => {
      const mockOrder = {
        id: 'order-2',
        sessionId: 'session-123',
        total: 29.99,
        status: 'pending',
        order_items: [],
      };

      mockOrderService.createOrderFromCart = jest.fn().mockResolvedValue(mockOrder);

      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          'x-session-id': 'session-123',
        },
        payload: {
          guestEmail: 'guest@example.com',
          shippingAddress: {
            firstName: 'Jane',
            lastName: 'Smith',
            addressLine1: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90001',
            country: 'US',
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('order-2');
    });

    it('should require guest email for guest orders', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          'x-session-id': 'session-123',
        },
        payload: {
          shippingAddress: {
            firstName: 'Jane',
            lastName: 'Smith',
            addressLine1: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90001',
            country: 'US',
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('email');
    });

    it('should validate shipping address fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          shippingAddress: {
            firstName: '',
            lastName: 'Doe',
            addressLine1: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle out of stock errors', async () => {
      mockOrderService.createOrderFromCart = jest.fn().mockRejectedValue(
        new Error('Product out of stock')
      );

      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Product out of stock');
    });

    it('should include customer notes in order', async () => {
      const mockOrder = {
        id: 'order-3',
        userId: 'user-1',
        total: 39.99,
        status: 'pending',
        customerNotes: 'Please gift wrap',
        order_items: [],
      };

      mockOrderService.createOrderFromCart = jest.fn().mockResolvedValue(mockOrder);

      const response = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
          customerNotes: 'Please gift wrap',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.customerNotes).toBe('Please gift wrap');
    });
  });

  describe('GET /orders', () => {
    it('should list user orders with authentication', async () => {
      const mockOrders = {
        orders: [
          { id: 'order-1', total: 49.99, status: 'completed' },
          { id: 'order-2', total: 29.99, status: 'pending' },
        ],
        total: 2,
        page: 1,
        perPage: 10,
        totalPages: 1,
      };

      mockOrderService.getUserOrders = jest.fn().mockResolvedValue(mockOrders);

      const response = await app.inject({
        method: 'GET',
        url: '/orders',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.orders).toHaveLength(2);
      expect(body.total).toBe(2);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/orders',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should support pagination', async () => {
      const mockOrders = {
        orders: [{ id: 'order-1', total: 49.99, status: 'completed' }],
        total: 15,
        page: 2,
        perPage: 5,
        totalPages: 3,
      };

      mockOrderService.getUserOrders = jest.fn().mockResolvedValue(mockOrders);

      const response = await app.inject({
        method: 'GET',
        url: '/orders?page=2&perPage=5',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.page).toBe(2);
      expect(body.perPage).toBe(5);
    });

    it('should filter by status', async () => {
      const mockOrders = {
        orders: [{ id: 'order-1', total: 49.99, status: 'completed' }],
        total: 1,
        page: 1,
        perPage: 10,
        totalPages: 1,
      };

      mockOrderService.getUserOrders = jest.fn().mockResolvedValue(mockOrders);

      const response = await app.inject({
        method: 'GET',
        url: '/orders?status=completed',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.orders[0].status).toBe('completed');
    });
  });

  describe('GET /orders/:id', () => {
    it('should get order details for authenticated user', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        total: 49.99,
        status: 'completed',
        order_items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            quantity: 2,
            price: 24.99,
            products: {
              id: 'prod-1',
              name: 'Green Tea',
            },
          },
        ],
      };

      mockOrderService.getOrderById = jest.fn().mockResolvedValue(mockOrder);

      const response = await app.inject({
        method: 'GET',
        url: '/orders/order-1',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('order-1');
      expect(body.order_items).toHaveLength(1);
    });

    it('should return 404 for non-existent order', async () => {
      mockOrderService.getOrderById = jest.fn().mockRejectedValue(
        new Error('Order not found')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/orders/non-existent',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should prevent access to other users orders', async () => {
      mockOrderService.getOrderById = jest.fn().mockRejectedValue(
        new Error('Order not found or access denied')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/orders/other-user-order',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/orders/order-1',
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
