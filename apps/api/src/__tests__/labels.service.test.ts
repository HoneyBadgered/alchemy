/**
 * LabelsService Unit Tests
 */

import { LabelsService } from '../services/labels.service';

// Mock Prisma Client
jest.mock('../utils/prisma', () => {
  const mockPrisma = {
    order: {
      findFirst: jest.fn(),
    },
    labelDesign: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    prisma: mockPrisma,
  };
});

describe('LabelsService', () => {
  let labelsService: LabelsService;
  let mockPrisma: any;

  beforeEach(() => {
    labelsService = new LabelsService();
    mockPrisma = require('../utils/prisma').prisma;
    jest.clearAllMocks();
  });

  describe('getOrderLabels', () => {
    it('should return labels for a valid order', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: 'paid',
      };

      const mockLabels = [
        {
          id: 'label-1',
          orderId: 'order-1',
          name: 'Custom Blend #1',
          tagline: 'A whimsical creation',
          description: 'A beautiful blend',
          status: 'draft',
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.labelDesign.findMany.mockResolvedValue(mockLabels);

      const result = await labelsService.getOrderLabels('user-1', 'order-1');

      expect(result).toEqual(mockLabels);
      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'order-1',
          userId: 'user-1',
        },
      });
    });

    it('should throw error if order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        labelsService.getOrderLabels('user-1', 'order-1')
      ).rejects.toThrow('Order not found');
    });

    it('should throw error if order belongs to different user', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        labelsService.getOrderLabels('user-2', 'order-1')
      ).rejects.toThrow('Order not found');
    });
  });

  describe('generateLabel', () => {
    const mockOrder = {
      id: 'order-1',
      userId: 'user-1',
      status: 'paid',
    };

    it('should generate label for paid order', async () => {
      const input = {
        stylePreset: 'vintage',
        tonePreset: 'elegant',
        flavorNotes: 'citrus and herbs',
        customPrompt: 'Make it fancy',
      };

      const mockLabel = {
        id: 'label-1',
        orderId: 'order-1',
        name: 'Custom Blend #12345',
        tagline: 'An elegant creation',
        description: 'This blend was crafted with vintage style featuring citrus and herbs. Make it fancy',
        stylePreset: 'vintage',
        tonePreset: 'elegant',
        status: 'draft',
      };

      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.labelDesign.create.mockResolvedValue(mockLabel);

      const result = await labelsService.generateLabel('user-1', 'order-1', input);

      expect(result.stylePreset).toBe('vintage');
      expect(result.tonePreset).toBe('elegant');
      expect(result.status).toBe('draft');
      expect(mockPrisma.labelDesign.create).toHaveBeenCalled();
    });

    it('should use default values when input is empty', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.labelDesign.create.mockResolvedValue({
        id: 'label-1',
        orderId: 'order-1',
        name: 'Custom Blend #12345',
        tagline: 'A whimsical creation',
        description: 'This blend was crafted with classic style. ',
        stylePreset: 'classic',
        tonePreset: 'whimsical',
        status: 'draft',
      });

      await labelsService.generateLabel('user-1', 'order-1', {});

      expect(mockPrisma.labelDesign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-1',
          stylePreset: 'classic',
          tonePreset: 'whimsical',
          status: 'draft',
        }),
      });
    });

    it('should throw error if order not found', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        labelsService.generateLabel('user-1', 'order-1', {})
      ).rejects.toThrow('Order not found or not paid');
    });

    it('should throw error if order not paid', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(
        labelsService.generateLabel('user-1', 'order-1', {})
      ).rejects.toThrow('Order not found or not paid');
    });
  });

  describe('updateLabel', () => {
    const mockLabel = {
      id: 'label-1',
      orderId: 'order-1',
      name: 'Original Name',
      tagline: 'Original Tagline',
      description: 'Original Description',
      status: 'draft',
      order: {
        id: 'order-1',
        userId: 'user-1',
      },
    };

    it('should update label with new values', async () => {
      const updateInput = {
        name: 'Updated Name',
        tagline: 'Updated Tagline',
      };

      const updatedLabel = {
        ...mockLabel,
        ...updateInput,
      };

      mockPrisma.labelDesign.findUnique.mockResolvedValue(mockLabel);
      mockPrisma.labelDesign.update.mockResolvedValue(updatedLabel);

      const result = await labelsService.updateLabel('user-1', 'label-1', updateInput);

      expect(result.name).toBe('Updated Name');
      expect(result.tagline).toBe('Updated Tagline');
      expect(mockPrisma.labelDesign.update).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        data: updateInput,
      });
    });

    it('should throw error if label not found', async () => {
      mockPrisma.labelDesign.findUnique.mockResolvedValue(null);

      await expect(
        labelsService.updateLabel('user-1', 'label-1', { name: 'New Name' })
      ).rejects.toThrow('Label not found');
    });

    it('should throw error if user not authorized', async () => {
      mockPrisma.labelDesign.findUnique.mockResolvedValue(mockLabel);

      await expect(
        labelsService.updateLabel('user-2', 'label-1', { name: 'New Name' })
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error if label already approved', async () => {
      mockPrisma.labelDesign.findUnique.mockResolvedValue({
        ...mockLabel,
        status: 'approved',
      });

      await expect(
        labelsService.updateLabel('user-1', 'label-1', { name: 'New Name' })
      ).rejects.toThrow('Cannot update approved label');
    });
  });

  describe('approveLabel', () => {
    const mockLabel = {
      id: 'label-1',
      orderId: 'order-1',
      name: 'Custom Blend',
      status: 'draft',
      order: {
        id: 'order-1',
        userId: 'user-1',
      },
    };

    it('should approve a draft label', async () => {
      mockPrisma.labelDesign.findUnique.mockResolvedValue(mockLabel);
      mockPrisma.labelDesign.update.mockResolvedValue({
        ...mockLabel,
        status: 'approved',
      });

      const result = await labelsService.approveLabel('user-1', 'label-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.labelDesign.update).toHaveBeenCalledWith({
        where: { id: 'label-1' },
        data: { status: 'approved' },
      });
    });

    it('should throw error if label not found', async () => {
      mockPrisma.labelDesign.findUnique.mockResolvedValue(null);

      await expect(
        labelsService.approveLabel('user-1', 'label-1')
      ).rejects.toThrow('Label not found');
    });

    it('should throw error if user not authorized', async () => {
      mockPrisma.labelDesign.findUnique.mockResolvedValue(mockLabel);

      await expect(
        labelsService.approveLabel('user-2', 'label-1')
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error if label already approved', async () => {
      mockPrisma.labelDesign.findUnique.mockResolvedValue({
        ...mockLabel,
        status: 'approved',
      });

      await expect(
        labelsService.approveLabel('user-1', 'label-1')
      ).rejects.toThrow('Label already approved');
    });
  });
});
