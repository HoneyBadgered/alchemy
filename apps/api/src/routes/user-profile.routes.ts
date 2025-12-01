/**
 * User Profile Routes
 * API endpoints for user profile management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UserProfileService } from '../services/user-profile.service';
import { authMiddleware } from '../middleware/auth';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  flavorPreferences: z.array(z.string()).optional(),
  caffeinePreference: z.string().optional().nullable(),
  allergyNotes: z.string().max(1000).optional().nullable(),
});

const updateAccountSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(20).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

export async function userProfileRoutes(fastify: FastifyInstance) {
  const userProfileService = new UserProfileService();

  /**
   * Get user profile
   * GET /profile
   * Requires authentication
   */
  fastify.get('/profile', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const profile = await userProfileService.getProfile(userId);
      return reply.send(profile);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(500).send({ message });
    }
  });

  /**
   * Update user profile
   * PUT /profile
   * Requires authentication
   */
  fastify.put('/profile', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = updateProfileSchema.parse(request.body);
      const profile = await userProfileService.updateProfile(userId, data);
      return reply.send(profile);
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
   * Update user account (email, username, password)
   * PUT /profile/account
   * Requires authentication
   */
  fastify.put('/profile/account', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = updateAccountSchema.parse(request.body);
      const account = await userProfileService.updateAccount(userId, data);
      return reply.send(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      const message = (error as Error).message;
      if (message.includes('already in use')) {
        return reply.status(409).send({ message });
      }
      if (message.includes('incorrect')) {
        return reply.status(401).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Delete user account
   * DELETE /profile/account
   * Requires authentication
   */
  fastify.delete('/profile/account', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = deleteAccountSchema.parse(request.body);
      const result = await userProfileService.deleteAccount(userId, data.password);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      const message = (error as Error).message;
      if (message.includes('Invalid password')) {
        return reply.status(401).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });
}
