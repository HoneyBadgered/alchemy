/**
 * Notification Preferences Routes
 * API endpoints for user notification preferences
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { authMiddleware } from '../middleware/auth';

const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  marketingEnabled: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  backInStock: z.boolean().optional(),
  announcements: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  phoneNumber: z.string().max(20).optional().nullable(),
});

export async function notificationPreferencesRoutes(fastify: FastifyInstance) {
  const notificationPreferencesService = new NotificationPreferencesService();

  /**
   * Get notification preferences
   * GET /notifications/preferences
   * Requires authentication
   */
  fastify.get('/notifications/preferences', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const preferences = await notificationPreferencesService.getPreferences(userId);
      return reply.send(preferences);
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Update notification preferences
   * PUT /notifications/preferences
   * Requires authentication
   */
  fastify.put('/notifications/preferences', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = updatePreferencesSchema.parse(request.body);
      const preferences = await notificationPreferencesService.updatePreferences(userId, data);
      return reply.send(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      return reply.status(400).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Check if opted in to a notification type
   * GET /notifications/preferences/:type
   * Requires authentication
   */
  fastify.get('/notifications/preferences/:type', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { type } = request.params as { type: string };
      const isOptedIn = await notificationPreferencesService.isOptedIn(userId, type);
      return reply.send({ type, isOptedIn });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });
}
