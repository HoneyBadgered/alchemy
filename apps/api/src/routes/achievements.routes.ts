/**
 * Achievements Routes
 * API endpoints for user achievements and badges
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AchievementsService } from '../services/achievements.service';
import { authMiddleware } from '../middleware/auth';

export async function achievementsRoutes(fastify: FastifyInstance) {
  const achievementsService = new AchievementsService();

  /**
   * Get all achievements with progress
   * GET /achievements
   * Requires authentication
   */
  fastify.get('/achievements', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const achievements = await achievementsService.getAchievements(userId);
      return reply.send({ achievements });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get earned achievements (badges)
   * GET /achievements/earned
   * Requires authentication
   */
  fastify.get('/achievements/earned', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const earned = await achievementsService.getEarnedAchievements(userId);
      return reply.send({ achievements: earned });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get achievements in progress
   * GET /achievements/in-progress
   * Requires authentication
   */
  fastify.get('/achievements/in-progress', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const inProgress = await achievementsService.getAchievementsInProgress(userId);
      return reply.send({ achievements: inProgress });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get achievement statistics
   * GET /achievements/stats
   * Requires authentication
   */
  fastify.get('/achievements/stats', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const stats = await achievementsService.getAchievementStats(userId);
      return reply.send(stats);
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });
}
