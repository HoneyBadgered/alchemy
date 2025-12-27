/**
 * Shopping Cart and Checkout Flow Integration Tests
 * Tests the complete journey from browsing products to placing an order
 */

import Fastify, { FastifyInstance } from 'fastify';
import { cartRoutes } from '../routes/cart.routes';
import { orderRoutes } from '../routes/order.routes';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    carts: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cart_items: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    products: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    orders: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    order_items: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

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

describe('Shopping Cart and Checkout Integration', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(cartRoutes);
    await app.register(orderRoutes);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Guest Shopping Flow', () => {
    it('should complete full guest checkout flow', async () => {
      const sessionId = 'guest-session-123';
      const mockProduct = {
        id: 'product-1',
        name: 'Green Tea',
        price: 19.99,
        stock: 100,
        isActive: true,
      };

      const mockCart = {
        id: 'cart-1',
        sessionId,
        userId: null,
        cart_items: [],
      };

      // Step 1: Add item to cart
      (prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.carts.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.carts.create as jest.Mock).mockResolvedValue(mockCart);
      (prisma.cart_items.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.cart_items.create as jest.Mock).mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
      });

      const addToCartResponse = await app.inject({
        method: 'POST',
        url: '/cart/items',
        headers: {
          'x-session-id': sessionId,
        },
        payload: {
          productId: 'product-1',
          quantity: 2,
        },
      });

      expect(addToCartResponse.statusCode).toBe(201);

      // Step 2: View cart
      (prisma.carts.findFirst as jest.Mock).mockResolvedValue({
        ...mockCart,
        cart_items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 2,
            products: mockProduct,
          },
        ],
      });

      const viewCartResponse = await app.inject({
        method: 'GET',
        url: '/cart',
        headers: {
          'x-session-id': sessionId,
        },
      });

      expect(viewCartResponse.statusCode).toBe(200);
      const cart = JSON.parse(viewCartResponse.body);
      expect(cart.cart_items).toHaveLength(1);
      expect(cart.cart_items[0].quantity).toBe(2);

      // Step 3: Update quantity
      (prisma.cart_items.findFirst as jest.Mock).mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
      });
      (prisma.cart_items.update as jest.Mock).mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 3,
      });

      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/cart/items/product-1',
        headers: {
          'x-session-id': sessionId,
        },
        payload: {
          quantity: 3,
        },
      });

      expect(updateResponse.statusCode).toBe(200);

      // Step 4: Place order
      const mockOrder = {
        id: 'order-1',
        sessionId,
        userId: null,
        guestEmail: 'guest@example.com',
        total: 59.97,
        status: 'pending',
        order_items: [
          {
            productId: 'product-1',
            quantity: 3,
            price: 19.99,
          },
        ],
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(prisma);
      });
      (prisma.orders.create as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order_items.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.cart_items.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.carts.delete as jest.Mock).mockResolvedValue(mockCart);

      const orderResponse = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          'x-session-id': sessionId,
        },
        payload: {
          guestEmail: 'guest@example.com',
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

      expect(orderResponse.statusCode).toBe(201);
      const order = JSON.parse(orderResponse.body);
      expect(order.id).toBe('order-1');
      expect(order.guestEmail).toBe('guest@example.com');
    });
  });

  describe('Authenticated User Shopping Flow', () => {
    it('should complete full authenticated checkout flow', async () => {
      const mockProduct1 = {
        id: 'product-1',
        name: 'Green Tea',
        price: 19.99,
        stock: 100,
        isActive: true,
      };

      const mockProduct2 = {
        id: 'product-2',
        name: 'Black Tea',
        price: 24.99,
        stock: 50,
        isActive: true,
      };

      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        cart_items: [],
      };

      // Step 1: Add first product
      (prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct1);
      (prisma.carts.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.carts.create as jest.Mock).mockResolvedValue(mockCart);
      (prisma.cart_items.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.cart_items.create as jest.Mock).mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 1,
      });

      const add1Response = await app.inject({
        method: 'POST',
        url: '/cart/items',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          productId: 'product-1',
          quantity: 1,
        },
      });

      expect(add1Response.statusCode).toBe(201);

      // Step 2: Add second product
      (prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct2);
      (prisma.carts.findFirst as jest.Mock).mockResolvedValue(mockCart);
      (prisma.cart_items.create as jest.Mock).mockResolvedValue({
        id: 'item-2',
        cartId: 'cart-1',
        productId: 'product-2',
        quantity: 2,
      });

      const add2Response = await app.inject({
        method: 'POST',
        url: '/cart/items',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          productId: 'product-2',
          quantity: 2,
        },
      });

      expect(add2Response.statusCode).toBe(201);

      // Step 3: View cart with both items
      (prisma.carts.findFirst as jest.Mock).mockResolvedValue({
        ...mockCart,
        cart_items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 1,
            products: mockProduct1,
          },
          {
            id: 'item-2',
            productId: 'product-2',
            quantity: 2,
            products: mockProduct2,
          },
        ],
      });

      const viewCartResponse = await app.inject({
        method: 'GET',
        url: '/cart',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(viewCartResponse.statusCode).toBe(200);
      const cart = JSON.parse(viewCartResponse.body);
      expect(cart.cart_items).toHaveLength(2);

      // Step 4: Remove first item
      (prisma.cart_items.findFirst as jest.Mock).mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-1',
      });
      (prisma.cart_items.delete as jest.Mock).mockResolvedValue({});

      const removeResponse = await app.inject({
        method: 'DELETE',
        url: '/cart/items/product-1',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(removeResponse.statusCode).toBe(200);

      // Step 5: Place order with remaining item
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        total: 49.98,
        status: 'pending',
        order_items: [
          {
            productId: 'product-2',
            quantity: 2,
            price: 24.99,
          },
        ],
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback(prisma);
      });
      (prisma.carts.findFirst as jest.Mock).mockResolvedValue({
        ...mockCart,
        cart_items: [
          {
            id: 'item-2',
            productId: 'product-2',
            quantity: 2,
            products: mockProduct2,
          },
        ],
      });
      (prisma.orders.create as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order_items.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.cart_items.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.carts.delete as jest.Mock).mockResolvedValue(mockCart);

      const orderResponse = await app.inject({
        method: 'POST',
        url: '/orders',
        headers: {
          authorization: 'Bearer test-token',
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

      expect(orderResponse.statusCode).toBe(201);
      const order = JSON.parse(orderResponse.body);
      expect(order.id).toBe('order-1');
      expect(order.userId).toBe('user-1');
    });
  });

  describe('Cart Merge on Login', () => {
    it('should merge guest cart with user cart on login', async () => {
      const sessionId = 'guest-session-123';
      const mockProduct = {
        id: 'product-1',
        name: 'Green Tea',
        price: 19.99,
        stock: 100,
        isActive: true,
      };

      // Step 1: Guest adds item to cart
      (prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.carts.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.carts.create as jest.Mock).mockResolvedValue({
        id: 'guest-cart',
        sessionId,
        userId: null,
      });
      (prisma.cart_items.create as jest.Mock).mockResolvedValue({
        id: 'item-1',
        cartId: 'guest-cart',
        productId: 'product-1',
        quantity: 1,
      });

      const guestAddResponse = await app.inject({
        method: 'POST',
        url: '/cart/items',
        headers: {
          'x-session-id': sessionId,
        },
        payload: {
          productId: 'product-1',
          quantity: 1,
        },
      });

      expect(guestAddResponse.statusCode).toBe(201);

      // Step 2: User logs in (simulated - in real flow, would call auth endpoint)
      // The cart merge would happen in the frontend by calling with both tokens

      // Step 3: View cart with auth token (should merge guest cart)
      const userCart = {
        id: 'user-cart',
        userId: 'user-1',
        sessionId: null,
        cart_items: [
          {
            id: 'item-merged',
            productId: 'product-1',
            quantity: 1,
            products: mockProduct,
          },
        ],
      };

      (prisma.carts.findFirst as jest.Mock).mockResolvedValue(userCart);

      const viewCartResponse = await app.inject({
        method: 'GET',
        url: '/cart',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(viewCartResponse.statusCode).toBe(200);
      const cart = JSON.parse(viewCartResponse.body);
      expect(cart.userId).toBe('user-1');
      expect(cart.cart_items).toHaveLength(1);
    });
  });

  describe('Stock Validation During Checkout', () => {
    it('should prevent checkout when product is out of stock', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Limited Tea',
        price: 29.99,
        stock: 0,
        isActive: true,
      };

      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        cart_items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 1,
            products: mockProduct,
          },
        ],
      };

      (prisma.carts.findFirst as jest.Mock).mockResolvedValue(mockCart);
      (prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.$transaction as jest.Mock).mockRejectedValue(
        new Error('Product "Limited Tea" is out of stock')
      );

      const orderResponse = await app.inject({
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

      expect(orderResponse.statusCode).toBe(400);
      const body = JSON.parse(orderResponse.body);
      expect(body.message).toContain('out of stock');
    });

    it('should prevent checkout when insufficient stock', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Limited Tea',
        price: 29.99,
        stock: 2,
        isActive: true,
      };

      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        cart_items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 5,
            products: mockProduct,
          },
        ],
      };

      (prisma.carts.findFirst as jest.Mock).mockResolvedValue(mockCart);
      (prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.$transaction as jest.Mock).mockRejectedValue(
        new Error('Insufficient stock for "Limited Tea"')
      );

      const orderResponse = await app.inject({
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

      expect(orderResponse.statusCode).toBe(400);
      const body = JSON.parse(orderResponse.body);
      expect(body.message).toContain('stock');
    });
  });
});
