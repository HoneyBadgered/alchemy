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
    it('should return paginated products with enhanced fields', async () => {
      const { prisma } = require('../utils/prisma');
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 10.99, isActive: true, stock: 10, lowStockThreshold: 5, trackInventory: true },
        { id: '2', name: 'Product 2', price: 20.99, isActive: true, stock: 2, lowStockThreshold: 5, trackInventory: true, compareAtPrice: 25.99 },
      ];

      prisma.products.findMany.mockResolvedValue(mockProducts);
      prisma.products.count.mockResolvedValue(2);

      const result = await catalogService.getProducts({ page: 1, perPage: 20 });

      // Check that enhanced fields are present
      expect(result.products[0].stockStatus).toBeDefined();
      expect(result.products[0].stockStatus.status).toBe('in_stock');
      expect(result.products[0].isOnSale).toBe(false);
      
      expect(result.products[1].stockStatus.status).toBe('low_stock');
      expect(result.products[1].isOnSale).toBe(true);
      expect(result.products[1].discountPercent).toBe(19); // ~19% off

      expect(result.pagination).toEqual({
        page: 1,
        perPage: 20,
        total: 2,
        totalPages: 1,
      });
      expect(prisma.products.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by category', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.products.findMany.mockResolvedValue([]);
      prisma.products.count.mockResolvedValue(0);

      await catalogService.getProducts({ category: 'teas' });

      expect(prisma.products.findMany).toHaveBeenCalledWith({
        where: { isActive: true, category: 'teas' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getProduct', () => {
    it('should return a product by id with enhanced fields', async () => {
      const { prisma } = require('../utils/prisma');
      const mockProduct = { 
        id: '1', 
        name: 'Product 1', 
        price: 10.99, 
        isActive: true, 
        stock: 10, 
        lowStockThreshold: 5, 
        trackInventory: true 
      };

      prisma.products.findUnique.mockResolvedValue(mockProduct);

      const result = await catalogService.getProduct('1');

      expect(result.id).toBe('1');
      expect(result.name).toBe('Product 1');
      expect(result.stockStatus).toBeDefined();
      expect(result.stockStatus.status).toBe('in_stock');
      expect(result.isOnSale).toBe(false);
      expect(prisma.products.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw error if product not found', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.products.findUnique.mockResolvedValue(null);

      await expect(catalogService.getProduct('999')).rejects.toThrow('Product not found');
    });

    it('should throw error if product is not active', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.products.findUnique.mockResolvedValue({ id: '1', isActive: false });

      await expect(catalogService.getProduct('1')).rejects.toThrow('Product is not available');
    });
  });

  describe('getStockStatus', () => {
    it('should return in_stock for products with stock above threshold', () => {
      const status = catalogService.getStockStatus(10, 5, true);
      expect(status.status).toBe('in_stock');
      expect(status.label).toBe('In Stock');
    });

    it('should return low_stock for products near threshold', () => {
      const status = catalogService.getStockStatus(3, 5, true);
      expect(status.status).toBe('low_stock');
      expect(status.label).toContain('Low Stock');
    });

    it('should return out_of_stock for products with no stock', () => {
      const status = catalogService.getStockStatus(0, 5, true);
      expect(status.status).toBe('out_of_stock');
      expect(status.label).toBe('Sold Out');
    });

    it('should return in_stock when inventory tracking is disabled', () => {
      const status = catalogService.getStockStatus(0, 5, false);
      expect(status.status).toBe('in_stock');
    });
  });
});
