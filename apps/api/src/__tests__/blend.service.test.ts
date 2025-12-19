/**
 * Blend Service Tests
 */

import { BlendService } from '../services/blend.service';
import { PrismaClient } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    blends: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('BlendService', () => {
  let blendService: BlendService;
  let mockPrisma: any;

  beforeEach(() => {
    blendService = new BlendService();
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('saveBlend', () => {
    it('should save a blend for an authenticated user', async () => {
      const mockBlend = {
        id: 'blend-1',
        userId: 'user-1',
        sessionId: null,
        name: 'My Custom Blend',
        baseTeaId: 'green-tea',
        addIns: [{ ingredientId: 'mint', quantity: 1 }],
        productId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.blends.create.mockResolvedValue(mockBlend as any);

      const result = await blendService.saveBlend({
        userId: 'user-1',
        name: 'My Custom Blend',
        baseTeaId: 'green-tea',
        addIns: [{ ingredientId: 'mint', quantity: 1 }],
      });

      expect(result).toEqual(mockBlend);
      expect(mockPrisma.blends.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          sessionId: null,
          name: 'My Custom Blend',
          baseTeaId: 'green-tea',
          addIns: [{ ingredientId: 'mint', quantity: 1 }],
          productId: null,
        },
      });
    });

    it('should save a blend for a guest with session ID', async () => {
      const mockBlend = {
        id: 'blend-2',
        userId: null,
        sessionId: 'session-123',
        name: null,
        baseTeaId: 'black-tea',
        addIns: [],
        productId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.blends.create.mockResolvedValue(mockBlend as any);

      const result = await blendService.saveBlend({
        sessionId: 'session-123',
        baseTeaId: 'black-tea',
        addIns: [],
      });

      expect(result).toEqual(mockBlend);
    });

    it('should throw error if neither userId nor sessionId provided', async () => {
      await expect(
        blendService.saveBlend({
          baseTeaId: 'green-tea',
          addIns: [],
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw error if baseTeaId is missing', async () => {
      await expect(
        blendService.saveBlend({
          userId: 'user-1',
          baseTeaId: '',
          addIns: [],
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getBlends', () => {
    it('should get blends for a user', async () => {
      const mockBlends = [
        {
          id: 'blend-1',
          userId: 'user-1',
          sessionId: null,
          name: 'Blend 1',
          baseTeaId: 'green-tea',
          addIns: [],
          productId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          products: null,
        },
      ];

      mockPrisma.blends.findMany.mockResolvedValue(mockBlends as any);

      const result = await blendService.getBlends({ userId: 'user-1' });

      expect(result).toEqual(mockBlends);
      expect(mockPrisma.blends.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { products: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should get blends for a session', async () => {
      const mockBlends = [
        {
          id: 'blend-2',
          userId: null,
          sessionId: 'session-123',
          name: null,
          baseTeaId: 'black-tea',
          addIns: [],
          productId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          products: null,
        },
      ];

      mockPrisma.blends.findMany.mockResolvedValue(mockBlends as any);

      const result = await blendService.getBlends({ sessionId: 'session-123' });

      expect(result).toEqual(mockBlends);
    });
  });

  describe('getBlendById', () => {
    it('should get a blend by ID for the owner', async () => {
      const mockBlend = {
        id: 'blend-1',
        userId: 'user-1',
        sessionId: null,
        name: 'My Blend',
        baseTeaId: 'green-tea',
        addIns: [],
        productId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        products: null,
      };

      mockPrisma.blends.findUnique.mockResolvedValue(mockBlend as any);

      const result = await blendService.getBlendById('blend-1', 'user-1');

      expect(result).toEqual(mockBlend);
    });

    it('should throw NotFoundError if blend does not exist', async () => {
      mockPrisma.blends.findUnique.mockResolvedValue(null);

      await expect(
        blendService.getBlendById('blend-1', 'user-1')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if user does not own the blend', async () => {
      const mockBlend = {
        id: 'blend-1',
        userId: 'user-2',
        sessionId: null,
        name: 'My Blend',
        baseTeaId: 'green-tea',
        addIns: [],
        productId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        products: null,
      };

      mockPrisma.blends.findUnique.mockResolvedValue(mockBlend as any);

      await expect(
        blendService.getBlendById('blend-1', 'user-1')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteBlend', () => {
    it('should delete a blend', async () => {
      const mockBlend = {
        id: 'blend-1',
        userId: 'user-1',
        sessionId: null,
        name: 'My Blend',
        baseTeaId: 'green-tea',
        addIns: [],
        productId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        products: null,
      };

      mockPrisma.blends.findUnique.mockResolvedValue(mockBlend as any);
      mockPrisma.blends.delete.mockResolvedValue(mockBlend as any);

      const result = await blendService.deleteBlend('blend-1', 'user-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.blends.delete).toHaveBeenCalledWith({
        where: { id: 'blend-1' },
      });
    });
  });

  describe('migrateGuestBlends', () => {
    it('should migrate guest blends to user account', async () => {
      const mockBlends = [
        {
          id: 'blend-1',
          userId: null,
          sessionId: 'session-123',
          name: null,
          baseTeaId: 'green-tea',
          addIns: [],
          productId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'blend-2',
          userId: null,
          sessionId: 'session-123',
          name: null,
          baseTeaId: 'black-tea',
          addIns: [],
          productId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.blends.findMany.mockResolvedValue(mockBlends as any);
      mockPrisma.blends.updateMany.mockResolvedValue({ count: 2 } as any);

      const result = await blendService.migrateGuestBlends('user-1', 'session-123');

      expect(result).toEqual({ migrated: 2 });
      expect(mockPrisma.blends.updateMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-123' },
        data: {
          userId: 'user-1',
          sessionId: null,
        },
      });
    });

    it('should return zero if no guest blends exist', async () => {
      mockPrisma.blends.findMany.mockResolvedValue([]);

      const result = await blendService.migrateGuestBlends('user-1', 'session-123');

      expect(result).toEqual({ migrated: 0 });
      expect(mockPrisma.blends.updateMany).not.toHaveBeenCalled();
    });
  });
});
