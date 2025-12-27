/**
 * Blend Routes Tests
 */

import Fastify, { FastifyInstance } from 'fastify';
import { blendRoutes } from '../routes/blend.routes';
import { BlendService } from '../services/blend.service';

// Mock the blend service
jest.mock('../services/blend.service');

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  optionalAuthMiddleware: async (request: any, reply: any) => {
    if (request.headers.authorization) {
      request.user = { userId: 'user-1' };
    }
  },
}));

describe('Blend Routes', () => {
  let app: FastifyInstance;
  let mockBlendService: jest.Mocked<BlendService>;

  beforeEach(async () => {
    app = Fastify();
    await app.register(blendRoutes);
    
    mockBlendService = jest.mocked(BlendService.prototype);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /blends', () => {
    it('should save blend for authenticated user', async () => {
      const mockBlend = {
        id: 'blend-1',
        userId: 'user-1',
        name: 'My Custom Blend',
        baseTeaId: 'base-1',
        addIns: [
          { ingredientId: 'ing-1', quantity: 2 },
          { ingredientId: 'ing-2', quantity: 1 },
        ],
        createdAt: new Date().toISOString(),
      };

      mockBlendService.saveBlend = jest.fn().mockResolvedValue(mockBlend);

      const response = await app.inject({
        method: 'POST',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          name: 'My Custom Blend',
          baseTeaId: 'base-1',
          addIns: [
            { ingredientId: 'ing-1', quantity: 2 },
            { ingredientId: 'ing-2', quantity: 1 },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('blend-1');
      expect(body.name).toBe('My Custom Blend');
    });

    it('should save blend for guest with session ID', async () => {
      const mockBlend = {
        id: 'blend-2',
        sessionId: 'session-123',
        baseTeaId: 'base-1',
        addIns: [{ ingredientId: 'ing-1', quantity: 1 }],
        createdAt: new Date().toISOString(),
      };

      mockBlendService.saveBlend = jest.fn().mockResolvedValue(mockBlend);

      const response = await app.inject({
        method: 'POST',
        url: '/blends',
        headers: {
          'x-session-id': 'session-123',
        },
        payload: {
          baseTeaId: 'base-1',
          addIns: [{ ingredientId: 'ing-1', quantity: 1 }],
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('blend-2');
    });

    it('should require authentication or session ID', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/blends',
        payload: {
          baseTeaId: 'base-1',
          addIns: [],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('authentication or x-session-id');
    });

    it('should validate baseTeaId is provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          addIns: [],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation error');
    });

    it('should validate addIns is an array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          baseTeaId: 'base-1',
          addIns: 'not-an-array',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation error');
    });

    it('should save blend with product ID for cart integration', async () => {
      const mockBlend = {
        id: 'blend-3',
        userId: 'user-1',
        baseTeaId: 'base-1',
        addIns: [],
        productId: 'product-1',
        createdAt: new Date().toISOString(),
      };

      mockBlendService.saveBlend = jest.fn().mockResolvedValue(mockBlend);

      const response = await app.inject({
        method: 'POST',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          baseTeaId: 'base-1',
          addIns: [],
          productId: 'product-1',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.productId).toBe('product-1');
    });
  });

  describe('GET /blends', () => {
    it('should get all blends for authenticated user', async () => {
      const mockBlends = [
        {
          id: 'blend-1',
          userId: 'user-1',
          name: 'Blend 1',
          baseTeaId: 'base-1',
          addIns: [],
        },
        {
          id: 'blend-2',
          userId: 'user-1',
          name: 'Blend 2',
          baseTeaId: 'base-2',
          addIns: [],
        },
      ];

      mockBlendService.getBlends = jest.fn().mockResolvedValue(mockBlends);

      const response = await app.inject({
        method: 'GET',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.blends).toHaveLength(2);
    });

    it('should get blends for guest with session ID', async () => {
      const mockBlends = [
        {
          id: 'blend-3',
          sessionId: 'session-123',
          baseTeaId: 'base-1',
          addIns: [],
        },
      ];

      mockBlendService.getBlends = jest.fn().mockResolvedValue(mockBlends);

      const response = await app.inject({
        method: 'GET',
        url: '/blends',
        headers: {
          'x-session-id': 'session-123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.blends).toHaveLength(1);
    });

    it('should return empty array when no blends exist', async () => {
      mockBlendService.getBlends = jest.fn().mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/blends',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.blends).toEqual([]);
    });
  });

  describe('GET /blends/:id', () => {
    it('should get specific blend by ID', async () => {
      const mockBlend = {
        id: 'blend-1',
        userId: 'user-1',
        name: 'My Blend',
        baseTeaId: 'base-1',
        addIns: [{ ingredientId: 'ing-1', quantity: 2 }],
        createdAt: new Date().toISOString(),
      };

      mockBlendService.getBlendById = jest.fn().mockResolvedValue(mockBlend);

      const response = await app.inject({
        method: 'GET',
        url: '/blends/blend-1',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe('blend-1');
      expect(body.name).toBe('My Blend');
    });

    it('should return 404 for non-existent blend', async () => {
      mockBlendService.getBlendById = jest.fn().mockRejectedValue(
        new Error('Blend not found')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/blends/non-existent',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should prevent access to other users blends', async () => {
      mockBlendService.getBlendById = jest.fn().mockRejectedValue(
        new Error('Blend not found or access denied')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/blends/other-user-blend',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /blends/:id', () => {
    it('should update blend name', async () => {
      const mockBlend = {
        id: 'blend-1',
        userId: 'user-1',
        name: 'Updated Blend Name',
        baseTeaId: 'base-1',
        addIns: [],
      };

      mockBlendService.updateBlendName = jest.fn().mockResolvedValue(mockBlend);

      const response = await app.inject({
        method: 'PATCH',
        url: '/blends/blend-1',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          name: 'Updated Blend Name',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Updated Blend Name');
    });

    it('should validate name is not empty', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/blends/blend-1',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          name: '',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation error');
    });
  });

  describe('DELETE /blends/:id', () => {
    it('should delete blend', async () => {
      mockBlendService.deleteBlend = jest.fn().mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'DELETE',
        url: '/blends/blend-1',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Blend deleted successfully');
    });

    it('should return 404 when deleting non-existent blend', async () => {
      mockBlendService.deleteBlend = jest.fn().mockRejectedValue(
        new Error('Blend not found')
      );

      const response = await app.inject({
        method: 'DELETE',
        url: '/blends/non-existent',
        headers: {
          authorization: 'Bearer test-token',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /blends/migrate', () => {
    it('should migrate guest blends to user account on login', async () => {
      mockBlendService.migrateGuestBlends = jest.fn().mockResolvedValue({
        migratedCount: 3,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/blends/migrate',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          sessionId: 'guest-session-123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.migratedCount).toBe(3);
      expect(mockBlendService.migrateGuestBlends).toHaveBeenCalledWith(
        'user-1',
        'guest-session-123'
      );
    });

    it('should require authentication for migration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/blends/migrate',
        payload: {
          sessionId: 'guest-session-123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate sessionId is provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/blends/migrate',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation error');
    });
  });
});
