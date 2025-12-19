/**
 * Product Import Service Tests
 */

import { ProductImportService } from '../services/product-import.service';

// Mock Prisma client
jest.mock('../utils/prisma', () => ({
  prisma: {
    products: {
      create: jest.fn(),
    },
  },
}));

describe('ProductImportService', () => {
  let importService: ProductImportService;

  beforeEach(() => {
    importService = new ProductImportService();
    jest.clearAllMocks();
  });

  describe('generateCSVTemplate', () => {
    it('should generate a CSV template with headers and example row', () => {
      const template = importService.generateCSVTemplate();

      expect(template).toContain('name,description,price');
      expect(template).toContain('Sample Product');
      expect(template).toContain('19.99');
      expect(template).toContain('Coffee Blends');
    });
  });

  describe('importFromCSV', () => {
    it('should successfully import valid products', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.products.create.mockResolvedValue({ id: '1' });

      const csvContent = `name,description,price,stock,category
Product 1,Description 1,19.99,50,Category 1
Product 2,Description 2,29.99,100,Category 2`;

      const result = await importService.importFromCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(prisma.products.create).toHaveBeenCalledTimes(2);
    });

    it('should handle missing required fields', async () => {
      const csvContent = `name,description,price
,Description 1,19.99
Product 2,,29.99
Product 3,Description 3,invalid`;

      const result = await importService.importFromCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.failed).toBe(3);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].error).toContain('Name is required');
      expect(result.errors[1].error).toContain('Description is required');
      expect(result.errors[2].error).toContain('Valid price is required');
    });

    it('should handle invalid price values', async () => {
      const csvContent = `name,description,price
Product 1,Description 1,abc
Product 2,Description 2,-10`;

      const result = await importService.importFromCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.errors[0].error).toContain('Valid price is required');
      expect(result.errors[1].error).toContain('Price must be positive');
    });

    it('should handle invalid stock values', async () => {
      const csvContent = `name,description,price,stock
Product 1,Description 1,19.99,abc`;

      const result = await importService.importFromCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toContain('Stock must be a non-negative number');
    });

    it('should parse optional fields correctly', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.products.create.mockResolvedValue({ id: '1' });

      const csvContent = `name,description,price,stock,category,tags,isActive,compareAtPrice
Product 1,Description 1,19.99,50,Category 1,"tag1,tag2",true,24.99`;

      const result = await importService.importFromCSV(csvContent);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      
      const createCall = prisma.products.create.mock.calls[0][0];
      expect(createCall.data.tags).toEqual(['tag1', 'tag2']);
      expect(createCall.data.isActive).toBe(true);
      expect(createCall.data.compareAtPrice).toBe(24.99);
    });

    it('should handle database errors', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.products.create.mockRejectedValue(new Error('Database error'));

      const csvContent = `name,description,price
Product 1,Description 1,19.99`;

      const result = await importService.importFromCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].error).toContain('Database error');
    });

    it('should handle empty CSV', async () => {
      const csvContent = '';

      const result = await importService.importFromCSV(csvContent);

      expect(result.success).toBe(false);
      expect(result.errors[0].error).toContain('CSV file is empty');
    });

    it('should continue importing even if some rows fail', async () => {
      const { prisma } = require('../utils/prisma');
      prisma.products.create
        .mockResolvedValueOnce({ id: '1' })
        .mockRejectedValueOnce(new Error('Duplicate'))
        .mockResolvedValueOnce({ id: '3' });

      const csvContent = `name,description,price
Product 1,Description 1,19.99
Product 2,Description 2,29.99
Product 3,Description 3,39.99`;

      const result = await importService.importFromCSV(csvContent);

      expect(result.imported).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Duplicate');
    });
  });

  describe('validateCSV', () => {
    it('should validate CSV with required columns', async () => {
      const csvContent = `name,description,price,stock
Product 1,Description 1,19.99,50`;

      const result = await importService.validateCSV(csvContent);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error for missing required columns', async () => {
      const csvContent = `name,price
Product 1,19.99`;

      const result = await importService.validateCSV(csvContent);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required column: description');
    });

    it('should return error for empty CSV', async () => {
      const csvContent = '';

      const result = await importService.validateCSV(csvContent);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CSV file is empty');
    });
  });
});
