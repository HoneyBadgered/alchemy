/**
 * Payment Methods Routes
 * API endpoints for user payment method management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PaymentMethodService } from '../services/payment-method.service';
import { authMiddleware } from '../middleware/auth';

const addPaymentMethodSchema = z.object({
  stripePaymentId: z.string().min(1),
  type: z.string().min(1),
  last4: z.string().length(4),
  brand: z.string().optional(),
  expirationMonth: z.number().int().min(1).max(12).optional(),
  expirationYear: z.number().int().min(2020).optional(),
  isDefault: z.boolean().optional(),
  billingAddressId: z.string().optional(),
});

const updatePaymentMethodSchema = z.object({
  isDefault: z.boolean().optional(),
  billingAddressId: z.string().optional().nullable(),
});

export async function paymentMethodRoutes(fastify: FastifyInstance) {
  const paymentMethodService = new PaymentMethodService();

  /**
   * Get all payment methods
   * GET /payment-methods
   * Requires authentication
   */
  fastify.get('/payment-methods', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const methods = await paymentMethodService.getPaymentMethods(userId);
      return reply.send({ paymentMethods: methods });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get a single payment method
   * GET /payment-methods/:id
   * Requires authentication
   */
  fastify.get('/payment-methods/:id', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const method = await paymentMethodService.getPaymentMethod(userId, id);
      return reply.send(method);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(500).send({ message });
    }
  });

  /**
   * Add a new payment method
   * POST /payment-methods
   * Requires authentication
   */
  fastify.post('/payment-methods', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = addPaymentMethodSchema.parse(request.body);
      const method = await paymentMethodService.addPaymentMethod(userId, data);
      return reply.status(201).send(method);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      const message = (error as Error).message;
      if (message.includes('already exists')) {
        return reply.status(409).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Update a payment method
   * PUT /payment-methods/:id
   * Requires authentication
   */
  fastify.put('/payment-methods/:id', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const data = updatePaymentMethodSchema.parse(request.body);
      const method = await paymentMethodService.updatePaymentMethod(userId, id, data);
      return reply.send(method);
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
   * Remove a payment method
   * DELETE /payment-methods/:id
   * Requires authentication
   */
  fastify.delete('/payment-methods/:id', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const result = await paymentMethodService.removePaymentMethod(userId, id);
      return reply.send(result);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Set a payment method as default
   * POST /payment-methods/:id/default
   * Requires authentication
   */
  fastify.post('/payment-methods/:id/default', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const method = await paymentMethodService.setDefaultPaymentMethod(userId, id);
      return reply.send(method);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Get default payment method
   * GET /payment-methods/default
   * Requires authentication
   */
  fastify.get('/payment-methods/default', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const method = await paymentMethodService.getDefaultPaymentMethod(userId);
      if (!method) {
        return reply.status(404).send({ message: 'No default payment method found' });
      }
      return reply.send(method);
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });
}
