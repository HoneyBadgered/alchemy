/**
 * Payment Routes
 * Stripe payment processing endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PaymentService } from '../services/payment.service';
import { stripe, isStripeConfigured } from '../utils/stripe';
import { config } from '../config';
import { isValidSessionId, sanitizeSessionId } from '../utils/session';
import { optionalAuthMiddleware } from '../middleware/auth';

const createPaymentIntentSchema = z.object({
  orderId: z.string().min(1),
});

export async function paymentRoutes(fastify: FastifyInstance) {
  const paymentService = new PaymentService();

  /**
   * Check if Stripe payment processing is configured
   * GET /payments/config
   * Public endpoint - returns configuration status
   */
  fastify.get('/payments/config', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      configured: isStripeConfigured(),
    });
  });

  /**
   * Create a payment intent for an order
   * POST /payments/create-intent
   * Supports both authenticated users and guests (via x-session-id header)
   */
  fastify.post('/payments/create-intent', {
    preHandler: optionalAuthMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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
  fastify.get('/payments/status/:orderId', {
    preHandler: optionalAuthMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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
   * Get order by payment intent ID (for Stripe redirect)
   * GET /payments/order-by-intent/:paymentIntentId
   * Semi-public endpoint - validates the payment intent against the stored client secret
   * The client secret is passed via query parameter for verification
   */
  fastify.get('/payments/order-by-intent/:paymentIntentId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if Stripe is configured
      if (!isStripeConfigured()) {
        return reply.status(503).send({ 
          message: 'Payment processing is not available. Stripe is not configured.',
          configured: false,
        });
      }

      const { paymentIntentId } = request.params as { paymentIntentId: string };
      const { client_secret: clientSecret } = request.query as { client_secret?: string };

      // Basic validation of payment intent ID format
      if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
        return reply.status(400).send({
          message: 'Invalid payment intent ID format',
        });
      }

      const result = await paymentService.getOrderByPaymentIntent(paymentIntentId, clientSecret);
      return reply.send(result);
    } catch (error) {
      const message = (error as Error).message;
      // Return 401 for invalid credentials, 404 for not found
      const statusCode = message === 'Invalid payment credentials' ? 401 : 404;
      return reply.status(statusCode).send({ 
        message,
      });
    }
  });

  /**
   * Manually sync payment status from Stripe
   * POST /payments/sync/:orderId
   * Optional authentication - supports both authenticated users and guests
   */
  fastify.post('/payments/sync/:orderId', {
    preHandler: optionalAuthMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if Stripe is configured
      if (!isStripeConfigured()) {
        return reply.status(503).send({ 
          message: 'Payment processing is not available. Stripe is not configured.',
          configured: false,
        });
      }

      const { orderId } = request.params as { orderId: string };
      const userId = request.user?.userId;
      let sessionId = request.headers['x-session-id'] as string | undefined;

      // Validate and sanitize session ID if provided
      if (sessionId) {
        sessionId = sanitizeSessionId(sessionId);
        if (!isValidSessionId(sessionId)) {
          sessionId = undefined;
        }
      }

      const result = await paymentService.getPaymentStatus(orderId, userId, sessionId);
      return reply.send(result);
    } catch (error) {
      return reply.status(404).send({ 
        message: (error as Error).message,
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
      console.log('Received webhook request');
      
      // Check if Stripe is configured
      if (!isStripeConfigured()) {
        console.error('Stripe not configured, rejecting webhook');
        return reply.status(503).send({ 
          message: 'Payment processing is not available. Stripe is not configured.',
        });
      }

      const signature = request.headers['stripe-signature'] as string;
      
      if (!signature) {
        console.error('Missing stripe-signature header');
        return reply.status(400).send({ message: 'Missing stripe-signature header' });
      }

      if (!config.stripeWebhookSecret) {
        console.error('Webhook secret not configured');
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
        console.log(`Webhook signature verified for event: ${event.type}`);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return reply.status(400).send({ 
          message: `Webhook signature verification failed: ${(err as Error).message}` 
        });
      }

      // Handle the event
      await paymentService.handleWebhookEvent(event);
      
      console.log(`Webhook event processed successfully: ${event.type}`);
      return reply.status(200).send({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      fastify.log.error(error);
      return reply.status(500).send({ 
        message: 'Webhook processing failed',
        error: (error as Error).message,
      });
    }
  });
}
