/**
 * Payment Routes
 * Stripe payment processing endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PaymentService } from '../services/payment.service';
import { authMiddleware } from '../middleware/auth';
import { stripe, isStripeConfigured } from '../utils/stripe';
import { config } from '../config';
import { isValidSessionId, sanitizeSessionId } from '../utils/session';

const createPaymentIntentSchema = z.object({
  orderId: z.string().min(1),
});

export async function paymentRoutes(fastify: FastifyInstance) {
  const paymentService = new PaymentService();

  /**
   * Create a payment intent for an order
   * POST /payments/create-intent
   * Supports both authenticated users and guests (via x-session-id header)
   */
  fastify.post('/payments/create-intent', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if Stripe is configured
      if (!isStripeConfigured()) {
        return reply.status(503).send({ 
          message: 'Payment processing is not available. Stripe is not configured.',
          configured: false,
        });
      }

      const userId = request.user?.userId;
      let sessionId = request.headers['x-session-id'] as string | undefined;
      const data = createPaymentIntentSchema.parse(request.body);

      // Validate and sanitize session ID if provided
      if (sessionId) {
        sessionId = sanitizeSessionId(sessionId);
        if (!isValidSessionId(sessionId)) {
          return reply.status(400).send({
            message: 'Invalid session ID format',
          });
        }
      }

      // Require either authentication or session ID
      if (!userId && !sessionId) {
        return reply.status(400).send({
          message: 'Either authentication or x-session-id header required',
        });
      }
      
      const result = await paymentService.createPaymentIntent({
        orderId: data.orderId,
        userId,
        sessionId,
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
   * Supports both authenticated users and guests (via x-session-id header)
   */
  fastify.get('/payments/status/:orderId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if Stripe is configured
      if (!isStripeConfigured()) {
        return reply.status(503).send({ 
          message: 'Payment processing is not available. Stripe is not configured.',
          configured: false,
        });
      }

      const userId = request.user?.userId;
      let sessionId = request.headers['x-session-id'] as string | undefined;
      const { orderId } = request.params as { orderId: string };

      // Validate and sanitize session ID if provided
      if (sessionId) {
        sessionId = sanitizeSessionId(sessionId);
        if (!isValidSessionId(sessionId)) {
          return reply.status(400).send({
            message: 'Invalid session ID format',
          });
        }
      }

      // Require either authentication or session ID
      if (!userId && !sessionId) {
        return reply.status(400).send({
          message: 'Either authentication or x-session-id header required',
        });
      }
      
      const status = await paymentService.getPaymentStatus(orderId, userId, sessionId);
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
      // Check if Stripe is configured
      if (!isStripeConfigured()) {
        return reply.status(503).send({ 
          message: 'Payment processing is not available. Stripe is not configured.',
        });
      }

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
        // Get raw body - rawBody is added by fastify-raw-body plugin
        interface RequestWithRawBody extends FastifyRequest {
          rawBody?: string | Buffer;
        }
        const rawBody = (request as RequestWithRawBody).rawBody || request.body;
        event = stripe.webhooks.constructEvent(
          rawBody as string | Buffer,
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
