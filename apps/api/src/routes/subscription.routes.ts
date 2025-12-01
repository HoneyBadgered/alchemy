/**
 * Subscription Routes
 * API endpoints for tea subscription management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { SubscriptionService } from '../services/subscription.service';
import { authMiddleware } from '../middleware/auth';

const createSubscriptionSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(200),
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'bimonthly']),
  quantity: z.number().int().min(1).optional(),
  price: z.number().positive(),
});

const updateSubscriptionSchema = z.object({
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'bimonthly']).optional(),
  quantity: z.number().int().min(1).optional(),
});

export async function subscriptionRoutes(fastify: FastifyInstance) {
  const subscriptionService = new SubscriptionService();

  /**
   * Get all subscriptions
   * GET /subscriptions
   * Requires authentication
   */
  fastify.get('/subscriptions', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const subscriptions = await subscriptionService.getSubscriptions(userId);
      return reply.send({ subscriptions });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get active subscriptions
   * GET /subscriptions/active
   * Requires authentication
   */
  fastify.get('/subscriptions/active', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const subscriptions = await subscriptionService.getActiveSubscriptions(userId);
      return reply.send({ subscriptions });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get subscription summary
   * GET /subscriptions/summary
   * Requires authentication
   */
  fastify.get('/subscriptions/summary', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const summary = await subscriptionService.getSubscriptionSummary(userId);
      return reply.send(summary);
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get a single subscription
   * GET /subscriptions/:id
   * Requires authentication
   */
  fastify.get('/subscriptions/:id', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const subscription = await subscriptionService.getSubscription(userId, id);
      return reply.send(subscription);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(500).send({ message });
    }
  });

  /**
   * Create a new subscription
   * POST /subscriptions
   * Requires authentication
   */
  fastify.post('/subscriptions', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = createSubscriptionSchema.parse(request.body);
      const subscription = await subscriptionService.createSubscription(userId, data);
      return reply.status(201).send(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      return reply.status(400).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Update a subscription
   * PUT /subscriptions/:id
   * Requires authentication
   */
  fastify.put('/subscriptions/:id', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const data = updateSubscriptionSchema.parse(request.body);
      const subscription = await subscriptionService.updateSubscription(userId, id, data);
      return reply.send(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Pause a subscription
   * POST /subscriptions/:id/pause
   * Requires authentication
   */
  fastify.post('/subscriptions/:id/pause', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const subscription = await subscriptionService.pauseSubscription(userId, id);
      return reply.send(subscription);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Resume a subscription
   * POST /subscriptions/:id/resume
   * Requires authentication
   */
  fastify.post('/subscriptions/:id/resume', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const subscription = await subscriptionService.resumeSubscription(userId, id);
      return reply.send(subscription);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Skip next shipment
   * POST /subscriptions/:id/skip
   * Requires authentication
   */
  fastify.post('/subscriptions/:id/skip', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const subscription = await subscriptionService.skipNextShipment(userId, id);
      return reply.send(subscription);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Cancel a subscription
   * POST /subscriptions/:id/cancel
   * Requires authentication
   */
  fastify.post('/subscriptions/:id/cancel', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const subscription = await subscriptionService.cancelSubscription(userId, id);
      return reply.send(subscription);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });
}
