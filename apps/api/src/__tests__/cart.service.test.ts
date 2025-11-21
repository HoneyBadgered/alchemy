/**
 * CartService Unit Tests
 */

import { CartService } from '../services/cart.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    cart: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    cartItem: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('CartService', () => {
  let cartService: CartService;
  let mockPrisma: any;

  beforeEach(() => {
    cartService = new CartService();
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should get cart for authenticated user', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 2,
            product: {
              id: 'product-1',
              name: 'Test Product',
              price: 10.99,
              isActive: true,
              stock: 100,
            },
          },
        ],
      };

      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);

      const result = await cartService.getCart({ userId: 'user-1' });

      expect(result.cart).toEqual(mockCart);
      expect(result.itemCount).toBe(2);
      expect(result.subtotal).toBe(21.98);
    });

    it('should create cart if not exists', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [],
      };

      mockPrisma.cart.findFirst.mockResolvedValue(null);
      mockPrisma.cart.create.mockResolvedValue(mockCart);

      const result = await cartService.getCart({ userId: 'user-1' });

      expect(result.cart).toEqual(mockCart);
      expect(result.itemCount).toBe(0);
      expect(result.subtotal).toBe(0);
    });

    it('should get cart for guest with sessionId', async () => {
      const mockCart = {
        id: 'cart-2',
        userId: null,
        sessionId: 'session-1',
        items: [],
      };

      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);

      const result = await cartService.getCart({ sessionId: 'session-1' });

      expect(result.cart).toEqual(mockCart);
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        price: 10.99,
        isActive: true,
        stock: 100,
      };

      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [],
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({});

      await cartService.addToCart({
        productId: 'product-1',
        quantity: 2,
        userId: 'user-1',
      });

      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 'cart-1',
          productId: 'product-1',
          quantity: 2,
        },
      });
    });

    it('should update quantity if item exists', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        price: 10.99,
        isActive: true,
        stock: 100,
      };

      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [],
      };

      const mockCartItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(mockCartItem);
      mockPrisma.cartItem.update.mockResolvedValue({});

      await cartService.addToCart({
        productId: 'product-1',
        quantity: 3,
        userId: 'user-1',
      });

      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 5 },
      });
    });

    it('should throw error if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        cartService.addToCart({
          productId: 'invalid-product',
          quantity: 1,
          userId: 'user-1',
        })
      ).rejects.toThrow('Product not found');
    });

    it('should throw error if product is not active', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        price: 10.99,
        isActive: false,
        stock: 100,
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        cartService.addToCart({
          productId: 'product-1',
          quantity: 1,
          userId: 'user-1',
        })
      ).rejects.toThrow('Product is not available');
    });

    it('should throw error if insufficient stock', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        price: 10.99,
        isActive: true,
        stock: 5,
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        cartService.addToCart({
          productId: 'product-1',
          quantity: 10,
          userId: 'user-1',
        })
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('updateCartItem', () => {
    it('should update item quantity', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [],
      };

      const mockCartItem = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
        product: {
          id: 'product-1',
          name: 'Test Product',
          price: 10.99,
          isActive: true,
          stock: 100,
        },
      };

      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(mockCartItem);
      mockPrisma.cartItem.update.mockResolvedValue({});

      await cartService.updateCartItem({
        productId: 'product-1',
        quantity: 5,
        userId: 'user-1',
      });

      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 5 },
      });
    });

    it('should throw error if item not in cart', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [],
      };

      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        cartService.updateCartItem({
          productId: 'product-1',
          quantity: 5,
          userId: 'user-1',
        })
      ).rejects.toThrow('Item not found in cart');
    });

    it('should throw error if quantity less than 1', async () => {
      await expect(
        cartService.updateCartItem({
          productId: 'product-1',
          quantity: 0,
          userId: 'user-1',
        })
      ).rejects.toThrow('Quantity must be at least 1');
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [],
      };

      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.deleteMany.mockResolvedValue({});

      await cartService.removeFromCart({
        productId: 'product-1',
        userId: 'user-1',
      });

      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: {
          cartId: 'cart-1',
          productId: 'product-1',
        },
      });
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [],
      };

      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.deleteMany.mockResolvedValue({});

      await cartService.clearCart({ userId: 'user-1' });

      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: {
          cartId: 'cart-1',
        },
      });
    });
  });
});
