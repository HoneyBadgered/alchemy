/**
 * Payment Service
 * Handles Stripe payment operations
 */

import Stripe from 'stripe';
import { prisma } from '../utils/prisma';
import { stripe, STRIPE_PAYMENT_SUCCESS_STATUSES } from '../utils/stripe';

export interface CreatePaymentIntentInput {
  orderId: string;
  userId?: string;
  sessionId?: string;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export class PaymentService {
  /**
   * Create a Stripe PaymentIntent for an order
   */
  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const { orderId, userId, sessionId } = input;

    // Build query to find order - support both authenticated users and guests
    const whereClause: { id: string; userId?: string; sessionId?: string } = { id: orderId };
    if (userId) {
      whereClause.userId = userId;
    } else if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    // Get the order
    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        user: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if order already has a payment intent
    if (order.stripePaymentId) {
      // Retrieve existing payment intent
      const existingIntent = await stripe.paymentIntents.retrieve(order.stripePaymentId);
      
      // If payment already succeeded, don't create a new one
      if (STRIPE_PAYMENT_SUCCESS_STATUSES.includes(existingIntent.status)) {
        throw new Error('Order has already been paid');
      }

      // Return existing intent if it's still valid
      if (existingIntent.status !== 'canceled' && existingIntent.client_secret) {
        return {
          clientSecret: existingIntent.client_secret,
          paymentIntentId: existingIntent.id,
        };
      }
    }

    // Get email for receipt (from user or guest email)
    const receiptEmail = order.user?.email || order.guestEmail;

    // Create new PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.totalAmount) * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        userId: order.userId || 'guest',
        sessionId: order.sessionId || '',
      },
      description: `Order #${order.id}`,
      receipt_email: receiptEmail || undefined,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent details
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentId: paymentIntent.id,
        stripePaymentStatus: paymentIntent.status,
        stripeClientSecret: paymentIntent.client_secret,
        status: 'payment_processing',
      },
    });

    // Log status change
    await prisma.orderStatusLog.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: 'payment_processing',
        changedBy: userId || null,
        notes: 'Payment intent created',
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Failed to create payment intent');
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Get order by payment intent ID
   * Used when returning from Stripe redirect after payment
   */
  async getOrderByPaymentIntent(paymentIntentId: string) {
    const order = await prisma.order.findFirst({
      where: {
        stripePaymentId: paymentIntentId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found for this payment');
    }

    // Refresh payment status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update order status if payment status changed
    if (paymentIntent.status !== order.stripePaymentStatus) {
      await this.updateOrderPaymentStatus(order.id, paymentIntent);
    }

    return {
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: paymentIntent.status,
    };
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: string, userId?: string, sessionId?: string) {
    // Build query to find order - support both authenticated users and guests
    const whereClause: { id: string; userId?: string; sessionId?: string } = { id: orderId };
    if (userId) {
      whereClause.userId = userId;
    } else if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.stripePaymentId) {
      return {
        status: 'no_payment',
        orderId: order.id,
        orderStatus: order.status,
      };
    }

    // Get latest status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentId);

    // Update local record if status changed
    if (paymentIntent.status !== order.stripePaymentStatus) {
      await this.updateOrderPaymentStatus(order.id, paymentIntent);
    }

    return {
      status: paymentIntent.status,
      orderId: order.id,
      orderStatus: order.status,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Update order payment status based on Stripe PaymentIntent
   */
  async updateOrderPaymentStatus(orderId: string, paymentIntent: Stripe.PaymentIntent) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    interface OrderUpdate {
      stripePaymentStatus: string;
      status?: string;
    }

    const updates: OrderUpdate = {
      stripePaymentStatus: paymentIntent.status,
    };

    let newOrderStatus = order.status;

    // Update order status based on payment status
    if (STRIPE_PAYMENT_SUCCESS_STATUSES.includes(paymentIntent.status)) {
      newOrderStatus = 'paid';
      updates.status = 'paid';
    } else if (paymentIntent.status === 'canceled') {
      newOrderStatus = 'payment_failed';
      updates.status = 'payment_failed';
    } else if (paymentIntent.status === 'processing') {
      newOrderStatus = 'payment_processing';
      updates.status = 'payment_processing';
    }

    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: updates,
    });

    // Log status change if it changed
    if (newOrderStatus !== order.status) {
      await prisma.orderStatusLog.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: newOrderStatus,
          changedBy: order.userId,
          notes: `Payment status: ${paymentIntent.status}`,
        },
      });
    }
  }

  /**
   * Handle Stripe webhook event
   */
  async handleWebhookEvent(event: Stripe.Event) {
    // Store webhook event for idempotency
    const existingEvent = await prisma.stripeWebhookEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existingEvent && existingEvent.processed) {
      // Event already processed
      return;
    }

    // Create or update webhook event record
    const webhookEvent = await prisma.stripeWebhookEvent.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
        eventType: event.type,
        payload: event as any,
      },
      update: {},
    });

    try {
      // Process the event based on type
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.processing':
          await this.handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent);
          break;
        default:
          // Unhandled event type
          break;
      }

      // Mark as processed
      await prisma.stripeWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      // Mark as failed
      await prisma.stripeWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          error: (error as Error).message,
        },
      });
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    await this.updateOrderPaymentStatus(orderId, paymentIntent);
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    await this.updateOrderPaymentStatus(orderId, paymentIntent);
  }

  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    await this.updateOrderPaymentStatus(orderId, paymentIntent);
  }

  private async handlePaymentIntentProcessing(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) return;

    await this.updateOrderPaymentStatus(orderId, paymentIntent);
  }
}
