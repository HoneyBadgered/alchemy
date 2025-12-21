/**
 * Admin Order Management Routes
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { adminMiddleware } from '../middleware/admin.middleware';
import { AdminOrderService } from '../services/admin-order.service';
import { PaymentService } from '../services/payment.service';

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

const markAsShippedSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  carrierName: z.string().min(1, 'Carrier name is required'),
  shippedAt: z.string().transform((str) => new Date(str)).optional(),
  notes: z.string().optional(),
});

const markAsDeliveredSchema = z.object({
  notes: z.string().optional(),
});

const cancelOrderSchema = z.object({
  reason: z.string().optional(),
  refundAmount: z.number().min(0).optional(),
});

const refundOrderSchema = z.object({
  amount: z.number().min(0.01, 'Refund amount must be greater than 0'),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
  notes: z.string().optional(),
});

export async function adminOrderRoutes(fastify: FastifyInstance) {
  const orderService = new AdminOrderService();
  const paymentService = new PaymentService();

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

  // POST /admin/orders/:id/ship - Mark order as shipped with tracking
  fastify.post('/admin/orders/:id/ship', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = markAsShippedSchema.parse(request.body);
      const userId = request.user!.userId;
      const order = await orderService.markAsShipped(id, userId, data);
      return reply.send(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // POST /admin/orders/:id/deliver - Mark order as delivered
  fastify.post('/admin/orders/:id/deliver', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = markAsDeliveredSchema.parse(request.body);
      const userId = request.user!.userId;
      const order = await orderService.markAsDelivered(id, userId, data.notes);
      return reply.send(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/orders/export - Export orders to CSV
  fastify.get('/admin/orders/export', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const filters = orderFiltersSchema.parse(request.query);
      const csv = await orderService.exportOrdersToCSV(filters);
      
      // Generate filename with date range if provided
      const dateFrom = filters.dateFrom ? new Date(filters.dateFrom).toISOString().split('T')[0] : '';
      const dateTo = filters.dateTo ? new Date(filters.dateTo).toISOString().split('T')[0] : '';
      const dateRange = dateFrom && dateTo ? `_${dateFrom}_to_${dateTo}` : dateFrom ? `_from_${dateFrom}` : dateTo ? `_to_${dateTo}` : '';
      const filename = `orders_export${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
      
      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(csv);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // POST /admin/orders/:id/cancel - Cancel an order
  fastify.post('/admin/orders/:id/cancel', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = cancelOrderSchema.parse(request.body);
      const userId = request.user!.userId;
      const order = await orderService.cancelOrder(id, userId, data.reason, data.refundAmount);
      return reply.send(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // POST /admin/orders/:id/refund - Process a refund
  fastify.post('/admin/orders/:id/refund', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = refundOrderSchema.parse(request.body);
      const userId = request.user!.userId;
      const refund = await paymentService.createRefund(
        id,
        data.amount,
        data.reason,
        userId,
        data.notes
      );
      return reply.send(refund);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/orders/:id/refunds - Get refunds for an order
  fastify.get('/admin/orders/:id/refunds', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const refunds = await paymentService.getOrderRefunds(id);
      return reply.send({ refunds });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
