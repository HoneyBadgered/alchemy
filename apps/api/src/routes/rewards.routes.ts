/**
 * Rewards Routes
 * API endpoints for loyalty points and rewards
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { RewardsService } from '../services/rewards.service';
import { authMiddleware } from '../middleware/auth';

const getHistorySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
});

const redeemRewardSchema = z.object({
  rewardId: z.string().min(1),
});

export async function rewardsRoutes(fastify: FastifyInstance) {
  const rewardsService = new RewardsService();

  /**
   * Get user's reward points and tier
   * GET /rewards
   * Requires authentication
   */
  fastify.get('/rewards', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const points = await rewardsService.getRewardPoints(userId);
      return reply.send(points);
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get reward history
   * GET /rewards/history
   * Requires authentication
   */
  fastify.get('/rewards/history', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const params = getHistorySchema.parse(request.query);
      const history = await rewardsService.getRewardHistory(userId, params);
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
   * Get available rewards
   * GET /rewards/available
   * Requires authentication
   */
  fastify.get('/rewards/available', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const rewards = await rewardsService.getAvailableRewards(userId);
      return reply.send({ rewards });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Redeem a reward
   * POST /rewards/redeem
   * Requires authentication
   */
  fastify.post('/rewards/redeem', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = redeemRewardSchema.parse(request.body);
      const result = await rewardsService.redeemReward(userId, data);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      const message = (error as Error).message;
      if (message.includes('not found') || message.includes('not available')) {
        return reply.status(404).send({ message });
      }
      if (message.includes('Insufficient') || message.includes('requires')) {
        return reply.status(400).send({ message });
      }
      if (message.includes('out of stock')) {
        return reply.status(409).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });
}
