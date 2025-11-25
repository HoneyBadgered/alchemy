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
      findFirst: jest.fn(),
      create: jest.fn(),
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

  describe('addBlendToCart', () => {
    it('should create a new blend product and add to cart', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [],
      };

      const mockCreatedProduct = {
        id: 'blend-product-1',
        name: 'Custom Green Tea Blend with 2 Add-ins',
        description: 'Custom blend with green-tea base and 2 add-ins',
        price: 15.99,
        category: 'custom-blend',
        tags: ['blend:green-tea:lavender:5,mint:5', 'custom', 'blend'],
        isActive: true,
        stock: 999,
      };

      // No existing blend found
      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue(mockCreatedProduct);
      mockPrisma.product.findUnique.mockResolvedValue(mockCreatedProduct);
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({});

      await cartService.addBlendToCart({
        baseTeaId: 'green-tea',
        addIns: [
          { ingredientId: 'lavender', quantity: 5 },
          { ingredientId: 'mint', quantity: 5 },
        ],
        userId: 'user-1',
      });

      // Should create a new blend product
      expect(mockPrisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: expect.stringContaining('Custom Green Tea'),
          category: 'custom-blend',
          isActive: true,
          stock: 999,
        }),
      });

      // Should add to cart
      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 'cart-1',
          productId: 'blend-product-1',
          quantity: 1,
        },
      });
    });

    it('should use existing blend product if same composition exists', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [],
      };

      const existingBlendProduct = {
        id: 'existing-blend-1',
        name: 'Custom Black Tea Blend with 1 Add-in',
        description: 'Custom blend with black-tea base and 1 add-in',
        price: 14.49,
        category: 'custom-blend',
        isActive: true,
        stock: 999,
      };

      // Existing blend found
      mockPrisma.product.findFirst.mockResolvedValue(existingBlendProduct);
      mockPrisma.product.findUnique.mockResolvedValue(existingBlendProduct);
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({});

      await cartService.addBlendToCart({
        baseTeaId: 'black-tea',
        addIns: [{ ingredientId: 'cinnamon', quantity: 3 }],
        userId: 'user-1',
      });

      // Should NOT create a new product
      expect(mockPrisma.product.create).not.toHaveBeenCalled();

      // Should add existing product to cart
      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 'cart-1',
          productId: 'existing-blend-1',
          quantity: 1,
        },
      });
    });

    it('should work for guest users with sessionId', async () => {
      const mockCart = {
        id: 'cart-2',
        userId: null,
        sessionId: 'guest-session-123',
        items: [],
      };

      const mockCreatedProduct = {
        id: 'blend-product-2',
        name: 'Custom White Tea',
        price: 12.99,
        category: 'custom-blend',
        isActive: true,
        stock: 999,
      };

      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue(mockCreatedProduct);
      mockPrisma.product.findUnique.mockResolvedValue(mockCreatedProduct);
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({});

      await cartService.addBlendToCart({
        baseTeaId: 'white-tea',
        addIns: [],
        sessionId: 'guest-session-123',
      });

      // Should create product and add to guest cart
      expect(mockPrisma.product.create).toHaveBeenCalled();
      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 'cart-2',
          productId: 'blend-product-2',
          quantity: 1,
        },
      });
    });

    it('should calculate price based on add-ins with increment pricing', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [],
      };

      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.product.create.mockImplementation((args: any) => Promise.resolve({
        id: 'new-blend',
        ...args.data,
      }));
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'new-blend',
        isActive: true,
        stock: 999,
      });
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({});

      await cartService.addBlendToCart({
        baseTeaId: 'oolong-tea',
        addIns: [
          // ginger: baseAmount=2, incrementAmount=0.5, quantity=5 => 6 increments above base => 6 * 0.25 = 1.50
          { ingredientId: 'ginger', quantity: 5 },
          // honey-dust: baseAmount=2, incrementAmount=1, quantity=3 => 1 increment above base => 1 * 0.25 = 0.25
          { ingredientId: 'honey-dust', quantity: 3 },
          // vanilla: baseAmount=1, incrementAmount=0.5, quantity=2 => 2 increments above base => 2 * 0.25 = 0.50
          { ingredientId: 'vanilla', quantity: 2 },
        ],
        userId: 'user-1',
      });

      // Price should be:
      // Base price: 12.99
      // + 3 add-in base prices (3 * 1.00) = 3.00
      // + ginger increments (6 * 0.25) = 1.50
      // + honey-dust increments (1 * 0.25) = 0.25
      // + vanilla increments (2 * 0.25) = 0.50
      // Total = 12.99 + 3.00 + 1.50 + 0.25 + 0.50 = 18.24
      const createCall = mockPrisma.product.create.mock.calls[0][0];
      expect(createCall.data.price).toBeCloseTo(18.24, 2);
    });

    it('should calculate base price only when add-ins are at base amount', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        sessionId: null,
        items: [],
      };

      mockPrisma.product.findFirst.mockResolvedValue(null);
      mockPrisma.product.create.mockImplementation((args: any) => Promise.resolve({
        id: 'new-blend',
        ...args.data,
      }));
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'new-blend',
        isActive: true,
        stock: 999,
      });
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null);
      mockPrisma.cartItem.create.mockResolvedValue({});

      await cartService.addBlendToCart({
        baseTeaId: 'green-tea',
        addIns: [
          // lavender: baseAmount=2, at base amount => no increment charge
          { ingredientId: 'lavender', quantity: 2 },
        ],
        userId: 'user-1',
      });

      // Price should be:
      // Base price: 12.99
      // + 1 add-in base price (1 * 1.00) = 1.00
      // + 0 increments = 0
      // Total = 12.99 + 1.00 = 13.99
      const createCall = mockPrisma.product.create.mock.calls[0][0];
      expect(createCall.data.price).toBeCloseTo(13.99, 2);
    });
  });
});
