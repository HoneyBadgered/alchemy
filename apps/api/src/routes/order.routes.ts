/**
 * Order Routes
 * Customer-facing order endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { OrderService } from '../services/order.service';
import { authMiddleware } from '../middleware/auth';

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
});

const orderListFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
});

export async function orderRoutes(fastify: FastifyInstance) {
  const orderService = new OrderService();

  /**
   * Place an order from the user's cart
   * POST /orders
   * Requires authentication
   */
  fastify.post('/orders', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = placeOrderSchema.parse(request.body);
      
      const order = await orderService.placeOrder({
        userId,
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
