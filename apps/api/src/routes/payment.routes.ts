/**
 * Payment Routes
 * Stripe payment processing endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PaymentService } from '../services/payment.service';
import { authMiddleware } from '../middleware/auth';
import { stripe } from '../utils/stripe';
import { config } from '../config';

const createPaymentIntentSchema = z.object({
  orderId: z.string().min(1),
});

const getPaymentStatusSchema = z.object({
  orderId: z.string().min(1),
});

export async function paymentRoutes(fastify: FastifyInstance) {
  const paymentService = new PaymentService();

  /**
   * Create a payment intent for an order
   * POST /payments/create-intent
   * Requires authentication
   */
  fastify.post('/payments/create-intent', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = createPaymentIntentSchema.parse(request.body);
      
      const result = await paymentService.createPaymentIntent({
        orderId: data.orderId,
        userId,
      });

      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      return reply.status(400).send({ 
        message: (error as Error).message 
      });
    }
  });

  /**
   * Get payment status for an order
   * GET /payments/status/:orderId
   * Requires authentication
   */
  fastify.get('/payments/status/:orderId', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { orderId } = request.params as { orderId: string };
      
      const status = await paymentService.getPaymentStatus(orderId, userId);
      return reply.send(status);
    } catch (error) {
      return reply.status(404).send({ 
        message: (error as Error).message 
      });
    }
  });

  /**
   * Stripe webhook endpoint
   * POST /payments/webhook
   * Public endpoint - validated by Stripe signature
   */
  fastify.post('/payments/webhook', {
    config: {
      // Disable body parsing for raw body access
      rawBody: true,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const signature = request.headers['stripe-signature'] as string;
      
      if (!signature) {
        return reply.status(400).send({ message: 'Missing stripe-signature header' });
      }

      if (!config.stripeWebhookSecret) {
        return reply.status(500).send({ message: 'Webhook secret not configured' });
      }

      // Verify webhook signature
      let event;
      try {
        // Get raw body
        const rawBody = (request as any).rawBody || request.body;
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          config.stripeWebhookSecret
        );
      } catch (err) {
        return reply.status(400).send({ 
          message: `Webhook signature verification failed: ${(err as Error).message}` 
        });
      }

      // Handle the event
      await paymentService.handleWebhookEvent(event);

      return reply.status(200).send({ received: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ 
        message: 'Webhook processing failed',
        error: (error as Error).message,
      });
    }
  });
}
