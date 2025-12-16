/**
 * Order Routes
 * Customer-facing order endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { OrderService } from '../services/order.service';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { isValidSessionId, sanitizeSessionId } from '../utils/session';

const shippingAddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
});

const placeOrderSchema = z.object({
  shippingAddress: shippingAddressSchema.optional(),
  shippingMethod: z.string().optional(),
  customerNotes: z.string().optional(),
  discountCode: z.string().optional(),
  guestEmail: z.string().email().optional(),
});

const orderListFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
});

export async function orderRoutes(fastify: FastifyInstance) {
  const orderService = new OrderService();

  /**
   * Place an order from the user's or guest's cart
   * POST /orders
   * Supports both authenticated users and guests (via x-session-id header)
   * Rate limit: 10 orders per hour to prevent spam
   */
  fastify.post('/orders', {
    preHandler: optionalAuthMiddleware,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 hour',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.userId;
      let sessionId = request.headers['x-session-id'] as string | undefined;
      const data = placeOrderSchema.parse(request.body);

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

      // For guest checkout, require email
      if (!userId && !data.guestEmail) {
        return reply.status(400).send({
          message: 'Guest email is required for guest checkout',
        });
      }
      
      const order = await orderService.placeOrder({
        userId,
        sessionId,
        guestEmail: data.guestEmail,
        ...data,
      });

      return reply.status(201).send(order);
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
   * Get user's order history
   * GET /orders
   * Requires authentication
   */
  fastify.get('/orders', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const filters = orderListFiltersSchema.parse(request.query);
      
      const result = await orderService.getOrders(userId, filters);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      return reply.status(500).send({ 
        message: (error as Error).message 
      });
    }
  });

  /**
   * Get a single order by ID
   * GET /orders/:id
   * Requires authentication
   */
  fastify.get('/orders/:id', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      
      const order = await orderService.getOrder(id, userId);
      return reply.send(order);
    } catch (error) {
      return reply.status(404).send({ 
        message: (error as Error).message 
      });
    }
  });
}
