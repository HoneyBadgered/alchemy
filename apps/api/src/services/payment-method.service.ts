/**
 * Payment Methods Service
 * Handles tokenized payment method storage for users
 */

import { prisma } from '../utils/prisma';

export interface AddPaymentMethodInput {
  stripePaymentId: string;
  type: string;
  last4: string;
  brand?: string;
  expirationMonth?: number;
  expirationYear?: number;
  isDefault?: boolean;
  billingAddressId?: string;
}

export interface UpdatePaymentMethodInput {
  isDefault?: boolean;
  billingAddressId?: string | null;
}

export class PaymentMethodService {
  /**
   * Get all payment methods for a user
   */
  async getPaymentMethods(userId: string) {
    const methods = await prisma.payment_methods.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        type: true,
        last4: true,
        brand: true,
        expirationMonth: true,
        expirationYear: true,
        isDefault: true,
        billingAddressId: true,
        createdAt: true,
        // Note: stripePaymentId is not exposed for security
      },
    });

    return methods;
  }

  /**
   * Get a single payment method by ID
   */
  async getPaymentMethod(userId: string, paymentMethodId: string) {
    const method = await prisma.payment_methods.findFirst({
      where: {
        id: paymentMethodId,
        userId,
      },
      select: {
        id: true,
        type: true,
        last4: true,
        brand: true,
        expirationMonth: true,
        expirationYear: true,
        isDefault: true,
        billingAddressId: true,
        createdAt: true,
      },
    });

    if (!method) {
      throw new Error('Payment method not found');
    }

    return method;
  }

  /**
   * Add a new payment method
   */
  async addPaymentMethod(userId: string, input: AddPaymentMethodInput) {
    // Validate required fields
    if (!input.stripePaymentId) {
      throw new Error('Stripe payment ID is required');
    }
    if (!input.type) {
      throw new Error('Payment method type is required');
    }
    if (!input.last4 || input.last4.length !== 4) {
      throw new Error('Last 4 digits are required');
    }

    // Check if payment method already exists
    const existing = await prisma.payment_methods.findUnique({
      where: { stripePaymentId: input.stripePaymentId },
    });

    if (existing) {
      throw new Error('Payment method already exists');
    }

    // Validate billing address if provided
    if (input.billingAddressId) {
      const address = await prisma.addresses.findFirst({
        where: {
          id: input.billingAddressId,
          userId,
        },
      });

      if (!address) {
        throw new Error('Billing address not found');
      }
    }

    // If this is set as default, unset other defaults
    if (input.isDefault) {
      await prisma.payment_methods.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the first payment method, make it default
    const existingMethods = await prisma.payment_methods.count({ where: { userId } });
    const isDefault = input.isDefault || existingMethods === 0;

    const method = await prisma.payment_methods.create({
      data: {
        userId,
        ...input,
        isDefault,
      },
      select: {
        id: true,
        type: true,
        last4: true,
        brand: true,
        expirationMonth: true,
        expirationYear: true,
        isDefault: true,
        billingAddressId: true,
        createdAt: true,
      },
    });

    return method;
  }

  /**
   * Update a payment method
   */
  async updatePaymentMethod(userId: string, paymentMethodId: string, input: UpdatePaymentMethodInput) {
    // Check if payment method exists and belongs to user
    const existing = await prisma.payment_methods.findFirst({
      where: {
        id: paymentMethodId,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Payment method not found');
    }

    // Validate billing address if provided
    if (input.billingAddressId) {
      const address = await prisma.addresses.findFirst({
        where: {
          id: input.billingAddressId,
          userId,
        },
      });

      if (!address) {
        throw new Error('Billing address not found');
      }
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      await prisma.payment_methods.updateMany({
        where: { userId, isDefault: true, id: { not: paymentMethodId } },
        data: { isDefault: false },
      });
    }

    const method = await prisma.payment_methods.update({
      where: { id: paymentMethodId },
      data: input,
      select: {
        id: true,
        type: true,
        last4: true,
        brand: true,
        expirationMonth: true,
        expirationYear: true,
        isDefault: true,
        billingAddressId: true,
        createdAt: true,
      },
    });

    return method;
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(userId: string, paymentMethodId: string) {
    // Check if payment method exists and belongs to user
    const existing = await prisma.payment_methods.findFirst({
      where: {
        id: paymentMethodId,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Payment method not found');
    }

    await prisma.payment_methods.delete({
      where: { id: paymentMethodId },
    });

    // If deleted method was default, set another as default
    if (existing.isDefault) {
      const nextMethod = await prisma.payment_methods.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (nextMethod) {
        await prisma.payment_methods.update({
          where: { id: nextMethod.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }

  /**
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
    // Check if payment method exists and belongs to user
    const existing = await prisma.payment_methods.findFirst({
      where: {
        id: paymentMethodId,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Payment method not found');
    }

    // Unset other defaults
    await prisma.payment_methods.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this method as default
    const method = await prisma.payment_methods.update({
      where: { id: paymentMethodId },
      data: { isDefault: true },
      select: {
        id: true,
        type: true,
        last4: true,
        brand: true,
        expirationMonth: true,
        expirationYear: true,
        isDefault: true,
        billingAddressId: true,
        createdAt: true,
      },
    });

    return method;
  }

  /**
   * Get the default payment method for a user
   */
  async getDefaultPaymentMethod(userId: string) {
    const method = await prisma.payment_methods.findFirst({
      where: {
        userId,
        isDefault: true,
      },
      select: {
        id: true,
        type: true,
        last4: true,
        brand: true,
        expirationMonth: true,
        expirationYear: true,
        isDefault: true,
        billingAddressId: true,
        createdAt: true,
      },
    });

    return method;
  }

  /**
   * Get stripe payment ID (internal use only)
   */
  async getStripePaymentId(userId: string, paymentMethodId: string): Promise<string | null> {
    const method = await prisma.payment_methods.findFirst({
      where: {
        id: paymentMethodId,
        userId,
      },
      select: {
        stripePaymentId: true,
      },
    });

    return method?.stripePaymentId ?? null;
  }
}
