/**
 * Address Service
 * Handles user address book management
 */

import { prisma } from '../utils/prisma';
import crypto from 'crypto';

export interface CreateAddressInput {
  label?: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string | null;
  isDefault?: boolean;
}

export class AddressService {
  /**
   * Get all addresses for a user
   */
  async getAddresses(userId: string) {
    const addresses = await prisma.addresses.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return addresses;
  }

  /**
   * Get a single address by ID
   */
  async getAddress(userId: string, addressId: string) {
    const address = await prisma.addresses.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new Error('Address not found');
    }

    return address;
  }

  /**
   * Add a new address
   */
  async addAddress(userId: string, input: CreateAddressInput) {
    // Validate required fields
    this.validateAddressFields(input);

    // If this is set as default, unset other defaults
    if (input.isDefault) {
      await prisma.addresses.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the first address, make it default
    const existingAddresses = await prisma.addresses.count({ where: { userId } });
    const isDefault = input.isDefault || existingAddresses === 0;

    const address = await prisma.addresses.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        ...input,
        isDefault,
        updatedAt: new Date(),
      },
    });

    return address;
  }

  /**
   * Update an existing address
   */
  async updateAddress(userId: string, addressId: string, input: UpdateAddressInput) {
    // Check if address exists and belongs to user
    const existing = await prisma.addresses.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Address not found');
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await prisma.addresses.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.addresses.update({
      where: { id: addressId },
      data: input,
    });

    return address;
  }

  /**
   * Delete an address
   */
  async deleteAddress(userId: string, addressId: string) {
    // Check if address exists and belongs to user
    const existing = await prisma.addresses.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Address not found');
    }

    await prisma.addresses.delete({
      where: { id: addressId },
    });

    // If deleted address was default, set another as default
    if (existing.isDefault) {
      const nextAddress = await prisma.addresses.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (nextAddress) {
        await prisma.addresses.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(userId: string, addressId: string) {
    // Check if address exists and belongs to user
    const existing = await prisma.addresses.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Address not found');
    }

    // Unset other defaults
    await prisma.addresses.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this address as default
    const address = await prisma.addresses.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    return address;
  }

  /**
   * Get the default address for a user
   */
  async getDefaultAddress(userId: string) {
    const address = await prisma.addresses.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    return address;
  }

  /**
   * Validate address fields
   */
  private validateAddressFields(input: CreateAddressInput) {
    if (!input.firstName || input.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }
    if (!input.lastName || input.lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }
    if (!input.addressLine1 || input.addressLine1.trim().length === 0) {
      throw new Error('Address line 1 is required');
    }
    if (!input.city || input.city.trim().length === 0) {
      throw new Error('City is required');
    }
    if (!input.state || input.state.trim().length === 0) {
      throw new Error('State is required');
    }
    if (!input.zipCode || input.zipCode.trim().length === 0) {
      throw new Error('Zip code is required');
    }
    if (!input.country || input.country.trim().length === 0) {
      throw new Error('Country is required');
    }
  }
}
