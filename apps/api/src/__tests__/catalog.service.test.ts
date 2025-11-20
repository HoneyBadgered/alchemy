/**
 * Catalog Service Tests
 */

import { CatalogService } from '../services/catalog.service';

// Mock Prisma client
jest.mock('../utils/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('CatalogService', () => {
  let catalogService: CatalogService;

  beforeEach(() => {
    catalogService = new CatalogService();
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const { prisma } = require('../utils/prisma');
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 10.99, isActive: true },
        { id: '2', name: 'Product 2', price: 20.99, isActive: true },
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(2);

      const result = await catalogService.getProducts({ page: 1, perPage: 20 });

      expect(result.products).toEqual(mockProducts);
      expect(result.pagination).toEqual({
        page: 1,
        perPage: 20,
        total: 2,
        totalPages: 1,
      });
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by category', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await catalogService.getProducts({ category: 'teas' });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true, category: 'teas' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getProduct', () => {
    it('should return a product by id', async () => {
      const { prisma } = require('../utils/prisma');
      const mockProduct = { id: '1', name: 'Product 1', price: 10.99, isActive: true };

      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await catalogService.getProduct('1');

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw error if product not found', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(catalogService.getProduct('999')).rejects.toThrow('Product not found');
    });

    it('should throw error if product is not active', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.product.findUnique.mockResolvedValue({ id: '1', isActive: false });

      await expect(catalogService.getProduct('1')).rejects.toThrow('Product is not available');
    });
  });
});
