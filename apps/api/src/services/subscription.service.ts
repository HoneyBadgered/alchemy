/**
 * Subscription Service
 * Handles tea subscription management
 */

import { prisma } from '../utils/prisma';

export interface CreateSubscriptionInput {
  productId: string;
  name: string;
  frequency: string;
  quantity?: number;
  price: number;
}

export interface UpdateSubscriptionInput {
  frequency?: string;
  quantity?: number;
}

const VALID_FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'bimonthly'];

export class SubscriptionService {
  /**
   * Get all subscriptions for a user
   */
  async getSubscriptions(userId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions.map((sub) => ({
      ...sub,
      price: Number(sub.price),
    }));
  }

  /**
   * Get active subscriptions for a user
   */
  async getActiveSubscriptions(userId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: 'active',
      },
      orderBy: { nextShipmentDate: 'asc' },
    });

    return subscriptions.map((sub) => ({
      ...sub,
      price: Number(sub.price),
    }));
  }

  /**
   * Get a single subscription
   */
  async getSubscription(userId: string, subscriptionId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return {
      ...subscription,
      price: Number(subscription.price),
    };
  }

  /**
   * Create a new subscription
   */
  async createSubscription(userId: string, input: CreateSubscriptionInput) {
    // Validate frequency
    if (!VALID_FREQUENCIES.includes(input.frequency.toLowerCase())) {
      throw new Error(`Invalid frequency. Valid options are: ${VALID_FREQUENCIES.join(', ')}`);
    }

    // Calculate next shipment date
    const nextShipmentDate = this.calculateNextShipmentDate(input.frequency);

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        productId: input.productId,
        name: input.name,
        frequency: input.frequency.toLowerCase(),
        quantity: input.quantity || 1,
        price: input.price,
        status: 'active',
        nextShipmentDate,
      },
    });

    return {
      ...subscription,
      price: Number(subscription.price),
    };
  }

  /**
   * Update subscription frequency or quantity
   */
  async updateSubscription(userId: string, subscriptionId: string, input: UpdateSubscriptionInput) {
    const existing = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Subscription not found');
    }

    if (existing.status === 'cancelled') {
      throw new Error('Cannot update a cancelled subscription');
    }

    // Validate frequency if provided
    if (input.frequency && !VALID_FREQUENCIES.includes(input.frequency.toLowerCase())) {
      throw new Error(`Invalid frequency. Valid options are: ${VALID_FREQUENCIES.join(', ')}`);
    }

    const updateData: {
      frequency?: string;
      quantity?: number;
      nextShipmentDate?: Date;
    } = {};

    if (input.frequency) {
      updateData.frequency = input.frequency.toLowerCase();
      // Recalculate next shipment date if frequency changes
      updateData.nextShipmentDate = this.calculateNextShipmentDate(input.frequency, existing.lastShipmentDate || undefined);
    }

    if (input.quantity !== undefined) {
      if (input.quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }
      updateData.quantity = input.quantity;
    }

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
    });

    return {
      ...subscription,
      price: Number(subscription.price),
    };
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(userId: string, subscriptionId: string) {
    const existing = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Subscription not found');
    }

    if (existing.status !== 'active') {
      throw new Error('Only active subscriptions can be paused');
    }

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'paused',
        pausedAt: new Date(),
      },
    });

    return {
      ...subscription,
      price: Number(subscription.price),
    };
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(userId: string, subscriptionId: string) {
    const existing = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Subscription not found');
    }

    if (existing.status !== 'paused') {
      throw new Error('Only paused subscriptions can be resumed');
    }

    // Recalculate next shipment date
    const nextShipmentDate = this.calculateNextShipmentDate(existing.frequency);

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        pausedAt: null,
        nextShipmentDate,
      },
    });

    return {
      ...subscription,
      price: Number(subscription.price),
    };
  }

  /**
   * Skip next shipment
   */
  async skipNextShipment(userId: string, subscriptionId: string) {
    const existing = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Subscription not found');
    }

    if (existing.status !== 'active') {
      throw new Error('Only active subscriptions can skip shipments');
    }

    // Calculate next shipment date (skip one cycle)
    const newNextShipmentDate = this.calculateNextShipmentDate(
      existing.frequency,
      existing.nextShipmentDate || undefined
    );

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        skipNextShipment: true,
        nextShipmentDate: newNextShipmentDate,
      },
    });

    return {
      ...subscription,
      price: Number(subscription.price),
      message: 'Next shipment will be skipped',
    };
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string, subscriptionId: string) {
    const existing = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Subscription not found');
    }

    if (existing.status === 'cancelled') {
      throw new Error('Subscription is already cancelled');
    }

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        nextShipmentDate: null,
      },
    });

    return {
      ...subscription,
      price: Number(subscription.price),
      message: 'Subscription has been cancelled',
    };
  }

  /**
   * Get subscription summary (next shipments)
   */
  async getSubscriptionSummary(userId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: 'active',
        nextShipmentDate: { not: null },
      },
      orderBy: { nextShipmentDate: 'asc' },
    });

    const upcomingShipments = subscriptions.map((sub) => ({
      subscriptionId: sub.id,
      name: sub.name,
      quantity: sub.quantity,
      price: Number(sub.price),
      nextShipmentDate: sub.nextShipmentDate,
      frequency: sub.frequency,
      skipNextShipment: sub.skipNextShipment,
    }));

    const totalMonthlyValue = subscriptions.reduce((sum, sub) => {
      const monthlyMultiplier = this.getMonthlyMultiplier(sub.frequency);
      return sum + Number(sub.price) * sub.quantity * monthlyMultiplier;
    }, 0);

    return {
      activeCount: subscriptions.length,
      upcomingShipments,
      estimatedMonthlyValue: totalMonthlyValue,
    };
  }

  /**
   * Calculate next shipment date based on frequency
   */
  private calculateNextShipmentDate(frequency: string, fromDate?: Date): Date {
    const startDate = fromDate || new Date();
    const nextDate = new Date(startDate);

    switch (frequency.toLowerCase()) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'bimonthly':
        nextDate.setMonth(nextDate.getMonth() + 2);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return nextDate;
  }

  /**
   * Get monthly multiplier for pricing calculations
   * Uses approximate values (52 weeks / 12 months ≈ 4.33 weeks per month)
   */
  private getMonthlyMultiplier(frequency: string): number {
    switch (frequency.toLowerCase()) {
      case 'weekly':
        return 4.33; // ~4.33 weeks per month on average
      case 'biweekly':
        return 2.17; // ~2.17 biweekly periods per month
      case 'monthly':
        return 1;
      case 'bimonthly':
        return 0.5;
      default:
        return 1;
    }
  }
}
