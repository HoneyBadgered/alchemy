/**
 * Admin Dashboard Routes
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { adminMiddleware } from '../middleware/admin.middleware';
import { AdminDashboardService } from '../services/admin-dashboard.service';

export async function adminDashboardRoutes(fastify: FastifyInstance) {
  const dashboardService = new AdminDashboardService();

  // GET /admin/dashboard - Get dashboard overview
  fastify.get('/admin/dashboard', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const overview = await dashboardService.getDashboardOverview();
      return reply.send(overview);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/dashboard/revenue - Get revenue over time
  fastify.get('/admin/dashboard/revenue', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { days } = request.query as { days?: string };
      const revenueData = await dashboardService.getRevenueOverTime(
        days ? parseInt(days) : 30
      );
      return reply.send({ revenueData });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/dashboard/orders-by-status - Get orders by status
  fastify.get('/admin/dashboard/orders-by-status', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const data = await dashboardService.getOrdersByStatus();
      return reply.send({ data });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/dashboard/customer-growth - Get customer growth
  fastify.get('/admin/dashboard/customer-growth', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { days } = request.query as { days?: string };
      const growthData = await dashboardService.getCustomerGrowth(
        days ? parseInt(days) : 30
      );
      return reply.send({ growthData });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/dashboard/top-products - Get top selling products
  fastify.get('/admin/dashboard/top-products', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { days, limit } = request.query as { days?: string; limit?: string };
      const topProducts = await dashboardService.getTopSellingProducts(
        days ? parseInt(days) : 30,
        limit ? parseInt(limit) : 10
      );
      return reply.send({ topProducts });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
