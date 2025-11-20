/**
 * Admin Order Management Routes
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { adminMiddleware } from '../middleware/admin.middleware';
import { AdminOrderService } from '../services/admin-order.service';

const orderFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'totalAmount', 'status', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

export async function adminOrderRoutes(fastify: FastifyInstance) {
  const orderService = new AdminOrderService();

  // GET /admin/orders - List all orders with filtering
  fastify.get('/admin/orders', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const filters = orderFiltersSchema.parse(request.query);
      const result = await orderService.getOrders(filters);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/orders/stats - Get order statistics
  fastify.get('/admin/orders/stats', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { dateFrom, dateTo } = request.query as { dateFrom?: string; dateTo?: string };
      const stats = await orderService.getOrderStats(dateFrom, dateTo);
      return reply.send(stats);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/orders/customers/recent - Get recent customers
  fastify.get('/admin/orders/customers/recent', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { limit } = request.query as { limit?: string };
      const customers = await orderService.getRecentCustomers(
        limit ? parseInt(limit) : 10
      );
      return reply.send({ customers });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/orders/:id - Get single order with full details
  fastify.get('/admin/orders/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const order = await orderService.getOrder(id);
      return reply.send(order);
    } catch (error) {
      return reply.status(404).send({ message: (error as Error).message });
    }
  });

  // GET /admin/orders/:id/status-logs - Get order status logs
  fastify.get('/admin/orders/:id/status-logs', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const logs = await orderService.getOrderStatusLogs(id);
      return reply.send({ logs });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // PATCH /admin/orders/:id/status - Update order status
  fastify.patch('/admin/orders/:id/status', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateOrderStatusSchema.parse(request.body);
      const userId = request.user!.userId;
      const order = await orderService.updateOrderStatus(id, userId, data);
      return reply.send(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
