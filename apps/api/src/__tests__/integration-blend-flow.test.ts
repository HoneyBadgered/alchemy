/**
 * Blend Creation Flow Integration Tests
 * Tests the complete journey from selecting base tea to saving custom blend
 */

import Fastify, { FastifyInstance } from 'fastify';
import { blendRoutes } from '../routes/blend.routes';
import { cartRoutes } from '../routes/cart.routes';
import { BlendService } from '../services/blend.service';
import { CartService } from '../services/cart.service';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    blends: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    ingredients: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    carts: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    cart_items: {
      create: jest.fn(),
    },
    products: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  optionalAuthMiddleware: async (request: any, reply: any) => {
    if (request.headers.authorization) {
      request.user = { userId: 'user-1' };
    }
  },
}));

describe('Blend Creation Flow Integration', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(blendRoutes);
    await app.register(cartRoutes);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Complete Blend Creation Journey', () => {
    it('should create, save, and add blend to cart', async () => {
      const mockBaseTea = {
        id: 'base-1',
        name: 'Green Tea',
        type: 'BASE',
        price: 10.00,
        isActive: true,
      };

      const mockIngredient1 = {
        id: 'ing-1',
        name: 'Lavender',
        type: 'ADD_IN',
        price: 2.00,
        isActive: true,
      };

      const mockIngredient2 = {
        id: 'ing-2',
        name: 'Honey',
        type: 'ADD_IN',
        price: 1.50,
        isActive: true,
      };

      // Step 1: Create and save a custom blend
      const mockBlend = {
        id: 'blend-1',
        userId: 'user-1',
        name: 'Relaxing Lavender Tea',
        baseTeaId: 'base-1',
        addIns: [
          { ingredientId: 'ing-1', quantity: 2 },
          { ingredientId: 'ing-2', quantity: 1 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.ingredients.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockBaseTea)
        .mockResolvedValueOnce(mockIngredient1)
        .mockResolvedValueOnce(mockIngredient2);
      
      (prisma.blends.create as jest.Mock).mockResolvedValue(mockBlend);

      const saveBlendResponse = await app.inject({
        method: 'POST',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          name: 'Relaxing Lavender Tea',
          baseTeaId: 'base-1',
          addIns: [
            { ingredientId: 'ing-1', quantity: 2 },
            { ingredientId: 'ing-2', quantity: 1 },
          ],
        },
      });

      expect(saveBlendResponse.statusCode).toBe(201);
      const savedBlend = JSON.parse(saveBlendResponse.body);
      expect(savedBlend.id).toBe('blend-1');
      expect(savedBlend.name).toBe('Relaxing Lavender Tea');

      // Step 2: View saved blends
      (prisma.blends.findMany as jest.Mock).mockResolvedValue([mockBlend]);

      const listBlendsResponse = await app.inject({
        method: 'GET',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(listBlendsResponse.statusCode).toBe(200);
      const blendsList = JSON.parse(listBlendsResponse.body);
      expect(blendsList.blends).toHaveLength(1);
      expect(blendsList.blends[0].id).toBe('blend-1');

      // Step 3: Add blend to cart as a custom product
      const mockProduct = {
        id: 'product-custom-blend-1',
        name: 'Custom Blend - Relaxing Lavender Tea',
        price: 15.50,
        stock: 999,
        isActive: true,
      };

      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        cart_items: [],
      };

      (prisma.products.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.carts.findFirst as jest.Mock).mockResolvedValue(mockCart);
      (prisma.cart_items.create as jest.Mock).mockResolvedValue({
        id: 'cart-item-1',
        cartId: 'cart-1',
        productId: 'product-custom-blend-1',
        quantity: 1,
        blendId: 'blend-1',
      });

      const addToCartResponse = await app.inject({
        method: 'POST',
        url: '/cart/items',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          productId: 'product-custom-blend-1',
          quantity: 1,
          blendId: 'blend-1',
        },
      });

      expect(addToCartResponse.statusCode).toBe(201);
    });
  });

  describe('Guest Blend Creation and Migration', () => {
    it('should create blends as guest and migrate on login', async () => {
      const sessionId = 'guest-session-123';

      // Step 1: Guest creates a blend
      const mockGuestBlend = {
        id: 'guest-blend-1',
        sessionId,
        baseTeaId: 'base-1',
        addIns: [{ ingredientId: 'ing-1', quantity: 1 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.blends.create as jest.Mock).mockResolvedValue(mockGuestBlend);

      const guestCreateResponse = await app.inject({
        method: 'POST',
        url: '/blends',
        headers: {
          'x-session-id': sessionId,
        },
        payload: {
          baseTeaId: 'base-1',
          addIns: [{ ingredientId: 'ing-1', quantity: 1 }],
        },
      });

      expect(guestCreateResponse.statusCode).toBe(201);
      const guestBlend = JSON.parse(guestCreateResponse.body);
      expect(guestBlend.sessionId).toBe(sessionId);

      // Step 2: Guest logs in and migrates blends
      const mockUserBlend = {
        ...mockGuestBlend,
        userId: 'user-1',
        sessionId: null,
      };

      (prisma.blends.findMany as jest.Mock).mockResolvedValue([mockGuestBlend]);
      (prisma.blends.update as jest.Mock).mockResolvedValue(mockUserBlend);

      const migrateResponse = await app.inject({
        method: 'POST',
        url: '/blends/migrate',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          sessionId,
        },
      });

      expect(migrateResponse.statusCode).toBe(200);
      const migrationResult = JSON.parse(migrateResponse.body);
      expect(migrationResult.migratedCount).toBeGreaterThan(0);

      // Step 3: Verify blends now belong to user
      (prisma.blends.findMany as jest.Mock).mockResolvedValue([mockUserBlend]);

      const userBlendsResponse = await app.inject({
        method: 'GET',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(userBlendsResponse.statusCode).toBe(200);
      const userBlends = JSON.parse(userBlendsResponse.body);
      expect(userBlends.blends[0].userId).toBe('user-1');
      expect(userBlends.blends[0].sessionId).toBeNull();
    });
  });

  describe('Blend Editing and Management', () => {
    it('should create, edit, and delete blends', async () => {
      // Step 1: Create initial blend
      const mockBlend = {
        id: 'blend-1',
        userId: 'user-1',
        name: 'Original Name',
        baseTeaId: 'base-1',
        addIns: [{ ingredientId: 'ing-1', quantity: 1 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.blends.create as jest.Mock).mockResolvedValue(mockBlend);

      const createResponse = await app.inject({
        method: 'POST',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          name: 'Original Name',
          baseTeaId: 'base-1',
          addIns: [{ ingredientId: 'ing-1', quantity: 1 }],
        },
      });

      expect(createResponse.statusCode).toBe(201);

      // Step 2: Get blend details
      (prisma.blends.findFirst as jest.Mock).mockResolvedValue(mockBlend);

      const getResponse = await app.inject({
        method: 'GET',
        url: '/blends/blend-1',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(getResponse.statusCode).toBe(200);
      const blend = JSON.parse(getResponse.body);
      expect(blend.name).toBe('Original Name');

      // Step 3: Update blend name
      const mockUpdatedBlend = {
        ...mockBlend,
        name: 'Updated Name',
      };

      (prisma.blends.update as jest.Mock).mockResolvedValue(mockUpdatedBlend);

      const updateResponse = await app.inject({
        method: 'PATCH',
        url: '/blends/blend-1',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(updateResponse.statusCode).toBe(200);
      const updatedBlend = JSON.parse(updateResponse.body);
      expect(updatedBlend.name).toBe('Updated Name');

      // Step 4: Delete blend
      (prisma.blends.delete as jest.Mock).mockResolvedValue(mockBlend);

      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: '/blends/blend-1',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(deleteResponse.statusCode).toBe(200);

      // Step 5: Verify blend is deleted
      (prisma.blends.findFirst as jest.Mock).mockResolvedValue(null);

      const verifyResponse = await app.inject({
        method: 'GET',
        url: '/blends/blend-1',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(verifyResponse.statusCode).toBe(404);
    });
  });

  describe('Multiple Blends Management', () => {
    it('should handle creating and managing multiple blends', async () => {
      const mockBlends = [
        {
          id: 'blend-1',
          userId: 'user-1',
          name: 'Morning Blend',
          baseTeaId: 'base-1',
          addIns: [{ ingredientId: 'ing-1', quantity: 1 }],
        },
        {
          id: 'blend-2',
          userId: 'user-1',
          name: 'Evening Blend',
          baseTeaId: 'base-2',
          addIns: [{ ingredientId: 'ing-2', quantity: 2 }],
        },
        {
          id: 'blend-3',
          userId: 'user-1',
          name: 'Relaxation Blend',
          baseTeaId: 'base-3',
          addIns: [
            { ingredientId: 'ing-3', quantity: 1 },
            { ingredientId: 'ing-4', quantity: 1 },
          ],
        },
      ];

      // Create multiple blends
      for (let i = 0; i < mockBlends.length; i++) {
        (prisma.blends.create as jest.Mock).mockResolvedValueOnce(mockBlends[i]);

        const response = await app.inject({
          method: 'POST',
          url: '/blends',
          headers: {
            authorization: 'Bearer test-token',
          },
          payload: {
            name: mockBlends[i].name,
            baseTeaId: mockBlends[i].baseTeaId,
            addIns: mockBlends[i].addIns,
          },
        });

        expect(response.statusCode).toBe(201);
      }

      // Get all blends
      (prisma.blends.findMany as jest.Mock).mockResolvedValue(mockBlends);

      const listResponse = await app.inject({
        method: 'GET',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(listResponse.statusCode).toBe(200);
      const blendsList = JSON.parse(listResponse.body);
      expect(blendsList.blends).toHaveLength(3);
      expect(blendsList.blends.map((b: any) => b.name)).toEqual([
        'Morning Blend',
        'Evening Blend',
        'Relaxation Blend',
      ]);
    });
  });

  describe('Error Handling in Blend Creation', () => {
    it('should handle invalid base tea ID', async () => {
      (prisma.ingredients.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          name: 'Invalid Blend',
          baseTeaId: 'non-existent-base',
          addIns: [],
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle inactive ingredients', async () => {
      const mockInactiveIngredient = {
        id: 'ing-1',
        name: 'Discontinued Item',
        type: 'ADD_IN',
        price: 2.00,
        isActive: false,
      };

      (prisma.ingredients.findUnique as jest.Mock).mockResolvedValue(mockInactiveIngredient);

      const response = await app.inject({
        method: 'POST',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          baseTeaId: 'base-1',
          addIns: [{ ingredientId: 'ing-1', quantity: 1 }],
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
