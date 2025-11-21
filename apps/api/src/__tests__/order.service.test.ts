/**
 * OrderService Unit Tests
 */

import { OrderService } from '../services/order.service';

// Mock Prisma Client
jest.mock('../utils/prisma', () => {
  const mockPrisma = {
    cart: {
      findFirst: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
    shippingMethod: {
      findUnique: jest.fn(),
    },
    taxRate: {
      findFirst: jest.fn(),
    },
    discountCode: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    orderStatusLog: {
      create: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  return {
    prisma: mockPrisma,
  };
});

describe('OrderService', () => {
  let orderService: OrderService;
  let mockPrisma: any;

  beforeEach(() => {
    orderService = new OrderService();
    mockPrisma = require('../utils/prisma').prisma;
    jest.clearAllMocks();
  });

  describe('placeOrder', () => {
    it('should throw error if cart is empty', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(null);

      await expect(
        orderService.placeOrder({
          userId: 'user-1',
        })
      ).rejects.toThrow('Cart is empty');
    });

    it('should throw error if product is not active', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            product: {
              id: 'product-1',
              name: 'Test Product',
              price: 10.00,
              isActive: false,
              stock: 5,
            },
          },
        ],
      });

      await expect(
        orderService.placeOrder({
          userId: 'user-1',
        })
      ).rejects.toThrow('Test Product is no longer available');
    });

    it('should throw error if insufficient stock', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            productId: 'product-1',
            quantity: 10,
            product: {
              id: 'product-1',
              name: 'Test Product',
              price: 10.00,
              isActive: true,
              stock: 5,
            },
          },
        ],
      });

      await expect(
        orderService.placeOrder({
          userId: 'user-1',
        })
      ).rejects.toThrow('Insufficient stock for Test Product');
    });

    it('should successfully create order and clear cart', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            product: {
              id: 'product-1',
              name: 'Test Product',
              price: 10.00,
              isActive: true,
              stock: 5,
            },
          },
        ],
      };

      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: 'pending',
        totalAmount: 20.00,
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            price: 10.00,
            product: mockCart.items[0].product,
          },
        ],
      };

      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      const result = await orderService.placeOrder({
        userId: 'user-1',
      });

      expect(result).toEqual(mockOrder);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getOrders', () => {
    it('should return user orders with pagination', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          userId: 'user-1',
          status: 'completed',
          totalAmount: 50.00,
          createdAt: new Date(),
          items: [],
        },
        {
          id: 'order-2',
          userId: 'user-1',
          status: 'pending',
          totalAmount: 30.00,
          createdAt: new Date(),
          items: [],
        },
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(2);

      const result = await orderService.getOrders('user-1');

      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('getOrder', () => {
    it('should return order if it belongs to user', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: 'completed',
        totalAmount: 50.00,
        items: [],
        statusLogs: [],
      };

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await orderService.getOrder('order-1', 'user-1');

      expect(result).toEqual(mockOrder);
    });

    it('should throw error if order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        orderService.getOrder('order-1', 'user-1')
      ).rejects.toThrow('Order not found');
    });
  });
});
