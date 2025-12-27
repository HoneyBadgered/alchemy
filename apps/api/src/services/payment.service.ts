/**
 * Payment Service
 * Handles Stripe payment operations
 */

import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma';
import { stripe, STRIPE_PAYMENT_SUCCESS_STATUSES } from '../utils/stripe';
import { 
  NotFoundError, 
  PaymentError, 
  BadRequestError 
} from '../utils/errors';
import type { Prisma } from '@prisma/client';

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

    try {
      // Build query to find order - support both authenticated users and guests
      const whereClause: { id: string; userId?: string; sessionId?: string } = { id: orderId };
      if (userId) {
        whereClause.userId = userId;
      } else if (sessionId) {
        whereClause.sessionId = sessionId;
      }

      // Get the order
      const order = await prisma.orders.findFirst({
        where: whereClause,
        include: {
          users: true,
        },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // Check if order already has a payment intent
      if (order.stripePaymentId) {
        try {
          // Retrieve existing payment intent
          const existingIntent = await stripe.paymentIntents.retrieve(order.stripePaymentId);
          
          // If payment already succeeded, don't create a new one
          if (STRIPE_PAYMENT_SUCCESS_STATUSES.includes(existingIntent.status)) {
            throw new BadRequestError('Order has already been paid');
          }

          // Return existing intent if it's still valid
          if (existingIntent.status !== 'canceled' && existingIntent.client_secret) {
            return {
              clientSecret: existingIntent.client_secret,
              paymentIntentId: existingIntent.id,
            };
          }
        } catch (stripeError) {
          // If Stripe returns an error (e.g., payment intent not found), log it and create a new one
          console.warn('Failed to retrieve existing payment intent:', stripeError);
        }
      }

      // Get email for receipt (from user or guest email)
      const receiptEmail = order.users?.email || order.guestEmail;

      // Create or retrieve Stripe customer
      let customerId: string | undefined;
      if (receiptEmail) {
        // Search for existing customer by email
        const existingCustomers = await stripe.customers.list({
          email: receiptEmail,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        } else {
          // Create new customer
          const customer = await stripe.customers.create({
            email: receiptEmail,
            metadata: {
              userId: order.userId || 'guest',
              orderId: order.id,
            },
          });
          customerId = customer.id;
        }
      }

      // Create new PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(order.totalAmount) * 100), // Convert to cents
        currency: 'usd',
        customer: customerId,
        metadata: {
          orderId: order.id,
          userId: order.userId || 'guest',
          sessionId: order.sessionId || '',
        },
        description: `Order #${order.id}`,
        receipt_email: receiptEmail || undefined,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });

      // Update order with payment intent details in a transaction
      await prisma.$transaction(async (tx) => {
        await tx.orders.update({
          where: { id: orderId },
          data: {
            stripePaymentId: paymentIntent.id,
            stripePaymentStatus: paymentIntent.status,
            stripeClientSecret: paymentIntent.client_secret,
            status: 'payment_processing',
            updatedAt: new Date(),
          },
        });

        // Log status change
        await tx.order_status_logs.create({
          data: {
            id: randomUUID(),
            orderId,
            fromStatus: order.status,
            toStatus: 'payment_processing',
            changedBy: userId || null,
            notes: 'Payment intent created',
          },
        });
      }, {
        maxWait: 3000,
        timeout: 10000,
      });

      if (!paymentIntent.client_secret) {
        throw new PaymentError('Failed to create payment intent - no client secret returned');
      }

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };

    } catch (error) {
      // Log error for monitoring
      console.error('Payment intent creation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
        userId,
      });

      // Re-throw known errors
      if (error instanceof NotFoundError || 
          error instanceof BadRequestError || 
          error instanceof PaymentError) {
        throw error;
      }

      // Handle Stripe-specific errors
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentError(
          `Stripe error: ${error.message}`,
          { code: error.code, type: error.type }
        );
      }

      // Wrap unknown errors
      throw new PaymentError(
        'Failed to create payment intent',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get order by payment intent ID
   * Used when returning from Stripe redirect after payment
   */
  async getOrderByPaymentIntent(paymentIntentId: string, clientSecret?: string) {
    const order = await prisma.orders.findFirst({
      where: {
        stripePaymentId: paymentIntentId,
      },
      include: {
        order_items: {
          include: {
            products: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found for this payment');
    }

    // Validate client secret if provided (additional security measure)
    if (clientSecret && order.stripeClientSecret !== clientSecret) {
      throw new BadRequestError('Invalid payment credentials');
    }

    // Refresh payment status from Stripe
    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error: unknown) {
      console.error('Failed to retrieve payment intent from Stripe:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new PaymentError(`Unable to retrieve payment status: ${message}`);
    }

    // Update order status if payment status changed (graceful error handling)
    if (paymentIntent.status !== order.stripePaymentStatus) {
      try {
        await this.updateOrderPaymentStatus(order.id, paymentIntent);
        
        // Refetch order to get updated status
        const updatedOrder = await prisma.orders.findUnique({
          where: { id: order.id },
          select: { status: true },
        });
        
        return {
          orderId: order.id,
          orderStatus: updatedOrder?.status || order.status,
          paymentStatus: paymentIntent.status,
        };
      } catch (updateError) {
        // Log the error but don't fail the request - the order lookup was successful
        console.error('Failed to update order payment status:', updateError);
      }
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

    const order = await prisma.orders.findFirst({
      where: whereClause,
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (!order.stripePaymentId) {
      return {
        status: 'no_payment',
        orderId: order.id,
        orderStatus: order.status,
      };
    }

    // Get latest status from Stripe
    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentId);
    } catch (error: unknown) {
      console.error('Failed to retrieve payment intent from Stripe:', error);
      // Return last known status instead of failing completely
      return {
        status: order.stripePaymentStatus || 'unknown',
        orderId: order.id,
        orderStatus: order.status,
        paymentIntentId: order.stripePaymentId,
        error: 'Unable to retrieve latest payment status from Stripe',
      };
    }

    // Update local record if status changed
    if (paymentIntent.status !== order.stripePaymentStatus) {
      await this.updateOrderPaymentStatus(order.id, paymentIntent);
      
      // Refetch order to get updated status
      const updatedOrder = await prisma.orders.findUnique({
        where: { id: order.id },
        select: { status: true },
      });
      
      return {
        status: paymentIntent.status,
        orderId: order.id,
        orderStatus: updatedOrder?.status || order.status,
        paymentIntentId: paymentIntent.id,
      };
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
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
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
      console.log(`Payment succeeded for order ${orderId}, updating status to 'paid'`);
    } else if (paymentIntent.status === 'canceled') {
      newOrderStatus = 'payment_failed';
      updates.status = 'payment_failed';
      console.log(`Payment canceled for order ${orderId}, updating status to 'payment_failed'`);
    } else if (paymentIntent.status === 'processing') {
      newOrderStatus = 'payment_processing';
      updates.status = 'payment_processing';
      console.log(`Payment processing for order ${orderId}, updating status to 'payment_processing'`);
    }

    console.log(`Updating order ${orderId}: stripePaymentStatus=${paymentIntent.status}, orderStatus=${newOrderStatus}`);

    try {
      // Update order and log status change in a transaction
      await prisma.$transaction(async (tx) => {
        // Update order
        await tx.orders.update({
          where: { id: orderId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        // Log status change if it changed
        if (newOrderStatus !== order.status) {
          await tx.order_status_logs.create({
            data: {
              id: randomUUID(),
              orderId,
              fromStatus: order.status,
              toStatus: newOrderStatus,
              changedBy: order.userId,
              notes: `Payment status: ${paymentIntent.status}`,
            },
          });
        }
      });
    } catch (error) {
      console.error('Failed to update order payment status:', error);
      throw new PaymentError('Failed to update order with payment status');
    }
  }

  /**
   * Handle Stripe webhook event
   */
  async handleWebhookEvent(event: Stripe.Event) {
    try {
      // Store webhook event for idempotency
      const existingEvent = await prisma.stripe_webhook_events.findUnique({
        where: { eventId: event.id },
      });

      if (existingEvent && existingEvent.processed) {
        // Event already processed
        console.log(`Webhook event ${event.id} already processed, skipping`);
        return;
      }

      // Create or update webhook event record
      const webhookEvent = await prisma.stripe_webhook_events.upsert({
        where: { eventId: event.id },
        create: {
          id: randomUUID(),
          eventId: event.id,
          eventType: event.type,
          payload: JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue,
        },
        update: {},
      });

      try {
        // Process the event based on type
        console.log(`Processing webhook event: ${event.type} (${event.id})`);
        
        switch (event.type) {
          case 'payment_intent.succeeded':
            console.log('Handling payment_intent.succeeded');
            await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
            break;
          case 'payment_intent.payment_failed':
            console.log('Handling payment_intent.payment_failed');
            await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
            break;
          case 'payment_intent.canceled':
            console.log('Handling payment_intent.canceled');
            await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
            break;
          case 'payment_intent.processing':
            console.log('Handling payment_intent.processing');
            await this.handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent);
            break;
          case 'charge.succeeded':
            console.log('Handling charge.succeeded - extracting payment intent');
            const chargeSucceeded = event.data.object as Stripe.Charge;
            if (chargeSucceeded.payment_intent) {
              const pi = await stripe.paymentIntents.retrieve(chargeSucceeded.payment_intent as string);
              await this.handlePaymentIntentSucceeded(pi);
            }
            break;
          default:
            // Unhandled event type - log but don't fail
            console.log(`Unhandled webhook event type: ${event.type}`);
            break;
        }

        console.log(`Successfully processed webhook event: ${event.type} (${event.id})`);

        // Mark as processed
        await prisma.stripe_webhook_events.update({
          where: { id: webhookEvent.id },
          data: {
            processed: true,
            processedAt: new Date(),
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to process webhook event ${event.id}:`, error);
        
        // Mark as failed
        await prisma.stripe_webhook_events.update({
          where: { id: webhookEvent.id },
          data: {
            error: errorMessage,
          },
        });
        
        // Re-throw to signal webhook failure (Stripe will retry)
        throw new PaymentError(`Webhook processing failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Critical error in webhook handler:', error);
      // If we can't even store the webhook event, throw to signal failure
      if (error instanceof PaymentError) {
        throw error;
      }
      throw new PaymentError('Failed to process webhook event');
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      console.warn('Payment intent succeeded but no orderId in metadata:', paymentIntent.id);
      return;
    }

    try {
      await this.updateOrderPaymentStatus(orderId, paymentIntent);
    } catch (error) {
      console.error(`Failed to update order ${orderId} for succeeded payment:`, error);
      throw error;
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      console.warn('Payment intent failed but no orderId in metadata:', paymentIntent.id);
      return;
    }

    try {
      await this.updateOrderPaymentStatus(orderId, paymentIntent);
    } catch (error) {
      console.error(`Failed to update order ${orderId} for failed payment:`, error);
      throw error;
    }
  }

  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      console.warn('Payment intent canceled but no orderId in metadata:', paymentIntent.id);
      return;
    }

    try {
      await this.updateOrderPaymentStatus(orderId, paymentIntent);
    } catch (error) {
      console.error(`Failed to update order ${orderId} for canceled payment:`, error);
      throw error;
    }
  }

  private async handlePaymentIntentProcessing(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      console.warn('Payment intent processing but no orderId in metadata:', paymentIntent.id);
      return;
    }

    try {
      await this.updateOrderPaymentStatus(orderId, paymentIntent);
    } catch (error) {
      console.error(`Failed to update order ${orderId} for processing payment:`, error);
      throw error;
    }
  }

  /**
   * Create a refund for an order
   */
  async createRefund(orderId: string, amount: number, reason?: string, processedBy?: string, notes?: string) {
    // Get the order
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (!order.stripePaymentId) {
      throw new BadRequestError('Order has no payment to refund');
    }

    // Check if order was paid
    if (order.status !== 'paid' && order.status !== 'completed' && order.status !== 'shipped') {
      throw new BadRequestError('Order must be paid before refunding');
    }

    // Validate refund amount
    const orderTotal = Number(order.totalAmount);
    if (amount <= 0 || amount > orderTotal) {
      throw new BadRequestError(`Refund amount must be between 0 and ${orderTotal}`);
    }

    // Check existing refunds
    const existingRefunds = await prisma.refunds.findMany({
      where: { orderId, status: 'succeeded' },
    });

    const totalRefunded = existingRefunds.reduce(
      (sum, refund) => sum + Number(refund.amount),
      0
    );

    if (totalRefunded + amount > orderTotal) {
      throw new BadRequestError(
        `Total refund amount (${totalRefunded + amount}) would exceed order total (${orderTotal})`
      );
    }

    try {
      // Create Stripe refund
      const stripeRefund = await stripe.refunds.create({
        payment_intent: order.stripePaymentId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: reason as Stripe.RefundCreateParams.Reason || undefined,
        metadata: {
          orderId,
          processedBy: processedBy || 'system',
        },
      });

      // Create refund record in transaction
      const refund = await prisma.$transaction(async (tx) => {
        // Create refund record
        const newRefund = await tx.refunds.create({
          data: {
            id: randomUUID(),
            orderId,
            stripeRefundId: stripeRefund.id,
            amount,
            reason: reason || null,
            status: stripeRefund.status,
            processedBy: processedBy || null,
            notes: notes || null,
            updatedAt: new Date(),
          },
        });

        // Update order status if fully refunded
        const newTotalRefunded = totalRefunded + amount;
        if (newTotalRefunded >= orderTotal) {
          await tx.orders.update({
            where: { id: orderId },
            data: { 
              status: 'refunded',
              updatedAt: new Date(),
            },
          });

          // Log status change
          await tx.order_status_logs.create({
            data: {
              id: randomUUID(),
              orderId,
              fromStatus: order.status,
              toStatus: 'refunded',
              changedBy: processedBy || null,
              notes: `Full refund of $${amount}`,
            },
          });
        } else {
          // Partial refund - update status to indicate partial refund
          await tx.order_status_logs.create({
            data: {
              id: randomUUID(),
              orderId,
              fromStatus: order.status,
              toStatus: order.status, // Keep same status
              changedBy: processedBy || null,
              notes: `Partial refund of $${amount} (total refunded: $${newTotalRefunded})`,
            },
          });
        }

        return newRefund;
      });

      return refund;
    } catch (error) {
      // Handle Stripe-specific errors
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentError(
          `Stripe refund error: ${error.message}`,
          { code: error.code, type: error.type }
        );
      }
      throw error;
    }
  }

  /**
   * Get refunds for an order
   */
  async getOrderRefunds(orderId: string) {
    const refunds = await prisma.refunds.findMany({
      where: { orderId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return refunds;
  }

  /**
   * Get refund status from Stripe
   */
  async getRefundStatus(refundId: string) {
    try {
      const refund = await stripe.refunds.retrieve(refundId);
      
      // Update local record if status changed
      const localRefund = await prisma.refunds.findUnique({
        where: { stripeRefundId: refundId },
      });

      if (localRefund && localRefund.status !== refund.status) {
        await prisma.refunds.update({
          where: { stripeRefundId: refundId },
          data: { 
            status: refund.status,
            updatedAt: new Date(),
          },
        });
      }

      return refund;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentError(
          `Failed to retrieve refund: ${error.message}`,
          { code: error.code, type: error.type }
        );
      }
      throw error;
    }
  }
}
