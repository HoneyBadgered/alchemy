/**
 * Purchase History Routes ("Apothecary Shelf")
 * API endpoints for purchase history and recommendations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PurchaseHistoryService } from '../services/purchase-history.service';
import { authMiddleware } from '../middleware/auth';

const getPurchaseHistorySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  category: z.string().optional(),
});

const getRecommendationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function purchaseHistoryRoutes(fastify: FastifyInstance) {
  const purchaseHistoryService = new PurchaseHistoryService();

  /**
   * Get purchase history (Apothecary Shelf)
   * GET /purchase-history
   * Requires authentication
   */
  fastify.get('/purchase-history', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const params = getPurchaseHistorySchema.parse(request.query);
      const history = await purchaseHistoryService.getPurchaseHistory(userId, params);
      return reply.send(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get purchase statistics
   * GET /purchase-history/stats
   * Requires authentication
   */
  fastify.get('/purchase-history/stats', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const stats = await purchaseHistoryService.getPurchaseStats(userId);
      return reply.send(stats);
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get purchase frequency metrics
   * GET /purchase-history/frequency
   * Requires authentication
   */
  fastify.get('/purchase-history/frequency', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const metrics = await purchaseHistoryService.getPurchaseFrequencyMetrics(userId);
      return reply.send({ metrics });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get personalized recommendations
   * GET /purchase-history/recommendations
   * Requires authentication
   */
  fastify.get('/purchase-history/recommendations', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const params = getRecommendationsSchema.parse(request.query);
      const recommendations = await purchaseHistoryService.getRecommendations(
        userId,
        params.limit
      );
      return reply.send({ recommendations });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get reorder data for an order
   * GET /purchase-history/reorder/:orderId
   * Requires authentication
   */
  fastify.get('/purchase-history/reorder/:orderId', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { orderId } = request.params as { orderId: string };
      const reorderData = await purchaseHistoryService.getReorderData(userId, orderId);
      return reply.send(reorderData);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(500).send({ message });
    }
  });
}
