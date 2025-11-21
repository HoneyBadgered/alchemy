/**
 * Gamification Routes
 */

import { FastifyInstance } from 'fastify';
import { GamificationService } from '../services/gamification.service';
import { authMiddleware } from '../middleware/auth';

export async function gamificationRoutes(fastify: FastifyInstance) {
  const gamificationService = new GamificationService();

  // GET /me/progress (protected)
  fastify.get('/me/progress', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const progress = await gamificationService.getProgress(request.user!.userId);
      return reply.send(progress);
    } catch (error) {
      const err = error as any;
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({ 
        error: 'Failed to retrieve progress',
        message: err.message,
        statusCode
      });
    }
  });

  // GET /me/quests (protected)
  fastify.get('/me/quests', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const quests = await gamificationService.getQuests(request.user!.userId);
      return reply.send(quests);
    } catch (error) {
      const err = error as any;
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({ 
        error: 'Failed to retrieve quests',
        message: err.message,
        statusCode
      });
    }
  });

  // POST /me/quests/:id/claim (protected)
  fastify.post('/me/quests/:id/claim', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await gamificationService.claimQuest(request.user!.userId, id);
      return reply.send(result);
    } catch (error) {
      const err = error as any;
      const statusCode = err.statusCode || 400;
      return reply.status(statusCode).send({ 
        error: 'Failed to claim quest',
        message: err.message,
        statusCode
      });
    }
  });

  // GET /me/inventory (protected)
  fastify.get('/me/inventory', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const inventory = await gamificationService.getInventory(request.user!.userId);
      return reply.send(inventory);
    } catch (error) {
      const err = error as any;
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({ 
        error: 'Failed to retrieve inventory',
        message: err.message,
        statusCode
      });
    }
  });
}
