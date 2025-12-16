/**
 * Address Service Tests
 */

import { AddressService } from '../services/address.service';

// Mock dependencies
jest.mock('../utils/prisma', () => ({
  prisma: {
    address: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('AddressService', () => {
  let addressService: AddressService;

  beforeEach(() => {
    addressService = new AddressService();
    jest.clearAllMocks();
  });

  describe('getAddresses', () => {
    it('should return all addresses sorted by default first', async () => {
      const { prisma } = require('../utils/prisma');
      
      const mockAddresses = [
        { id: '1', label: 'Home', isDefault: true, firstName: 'John' },
        { id: '2', label: 'Work', isDefault: false, firstName: 'John' },
      ];

      prisma.addresses.findMany.mockResolvedValue(mockAddresses);

      const result = await addressService.getAddresses('user_123');

      expect(result).toHaveLength(2);
      expect(prisma.addresses.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });
    });
  });

  describe('getAddress', () => {
    it('should return address if it belongs to user', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.addresses.findFirst.mockResolvedValue({
        id: 'addr_123',
        userId: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = await addressService.getAddress('user_123', 'addr_123');

      expect(result.firstName).toBe('John');
    });

    it('should throw error if address not found', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.addresses.findFirst.mockResolvedValue(null);

      await expect(
        addressService.getAddress('user_123', 'invalid_addr')
      ).rejects.toThrow('Address not found');
    });
  });

  describe('addAddress', () => {
    it('should create first address as default', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.addresses.count.mockResolvedValue(0);
      prisma.addresses.create.mockResolvedValue({
        id: 'addr_123',
        userId: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        isDefault: true,
      });

      const result = await addressService.addAddress('user_123', {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      });

      expect(result.isDefault).toBe(true);
    });

    it('should unset other defaults when adding new default address', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.addresses.count.mockResolvedValue(2);
      prisma.addresses.updateMany.mockResolvedValue({});
      prisma.addresses.create.mockResolvedValue({
        id: 'addr_123',
        isDefault: true,
      });

      await addressService.addAddress('user_123', {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '456 Second St',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        country: 'USA',
        isDefault: true,
      });

      expect(prisma.addresses.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user_123', isDefault: true },
        data: { isDefault: false },
      });
    });

    it('should validate required fields', async () => {
      await expect(
        addressService.addAddress('user_123', {
          firstName: '',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        })
      ).rejects.toThrow('First name is required');

      await expect(
        addressService.addAddress('user_123', {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        })
      ).rejects.toThrow('Address line 1 is required');
    });
  });

  describe('updateAddress', () => {
    it('should update address fields', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.addresses.findFirst.mockResolvedValue({
        id: 'addr_123',
        userId: 'user_123',
      });
      prisma.addresses.update.mockResolvedValue({
        id: 'addr_123',
        firstName: 'Jane',
      });

      const result = await addressService.updateAddress('user_123', 'addr_123', {
        firstName: 'Jane',
      });

      expect(result.firstName).toBe('Jane');
    });

    it('should throw error if address not found', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.addresses.findFirst.mockResolvedValue(null);

      await expect(
        addressService.updateAddress('user_123', 'invalid', { firstName: 'Jane' })
      ).rejects.toThrow('Address not found');
    });
  });

  describe('deleteAddress', () => {
    it('should delete address', async () => {
      const { prisma } = require('../utils/prisma');
      jest.clearAllMocks();
      
      prisma.addresses.findFirst.mockResolvedValue({
        id: 'addr_123',
        userId: 'user_123',
        isDefault: false,
      });
      prisma.addresses.delete.mockResolvedValue({});

      const result = await addressService.deleteAddress('user_123', 'addr_123');

      expect(result.success).toBe(true);
    });

    it('should set another address as default if deleting default', async () => {
      const { prisma } = require('../utils/prisma');
      jest.clearAllMocks();
      
      prisma.addresses.findFirst
        .mockResolvedValueOnce({
          id: 'addr_123',
          userId: 'user_123',
          isDefault: true,
        })
        .mockResolvedValueOnce({
          id: 'addr_456',
          userId: 'user_123',
          isDefault: false,
        });
      prisma.addresses.delete.mockResolvedValue({});
      prisma.addresses.update.mockResolvedValue({});

      await addressService.deleteAddress('user_123', 'addr_123');

      expect(prisma.addresses.update).toHaveBeenCalledWith({
        where: { id: 'addr_456' },
        data: { isDefault: true },
      });
    });
  });

  describe('setDefaultAddress', () => {
    it('should set address as default', async () => {
      const { prisma } = require('../utils/prisma');
      
      prisma.addresses.findFirst.mockResolvedValue({
        id: 'addr_123',
        userId: 'user_123',
      });
      prisma.addresses.updateMany.mockResolvedValue({});
      prisma.addresses.update.mockResolvedValue({
        id: 'addr_123',
        isDefault: true,
      });

      const result = await addressService.setDefaultAddress('user_123', 'addr_123');

      expect(result.isDefault).toBe(true);
      expect(prisma.addresses.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user_123', isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe('getDefaultAddress', () => {
    it('should return default address', async () => {
      const { prisma } = require('../utils/prisma');
      jest.clearAllMocks();
      
      prisma.addresses.findFirst.mockResolvedValue({
        id: 'addr_123',
        isDefault: true,
        firstName: 'John',
      });

      const result = await addressService.getDefaultAddress('user_123');

      expect(result?.isDefault).toBe(true);
      expect(prisma.addresses.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user_123', isDefault: true },
      });
    });

    it('should return null if no default address', async () => {
      const { prisma } = require('../utils/prisma');
      jest.clearAllMocks();
      
      prisma.addresses.findFirst.mockResolvedValue(null);

      const result = await addressService.getDefaultAddress('user_123');

      expect(result).toBeNull();
    });
  });
});
