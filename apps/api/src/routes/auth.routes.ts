/**
 * Authentication Routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth';
import { verifyRefreshToken } from '../utils/jwt';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(20),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();

  // POST /auth/register
  fastify.post('/auth/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);
      const result = await authService.register(body);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  // POST /auth/login
  fastify.post('/auth/login', {
    config: {
      rateLimit: {
        max: 5, // Only 5 login attempts
        timeWindow: '15 minutes',
      },
    },
  }, async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const result = await authService.login(body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(401).send({ message: (error as Error).message });
    }
  });

  // POST /auth/refresh
  fastify.post('/auth/refresh', {
    config: {
      rateLimit: {
        max: 10, // 10 token refreshes
        timeWindow: '15 minutes',
      },
    },
  }, async (request, reply) => {
    try {
      const body = refreshSchema.parse(request.body);
      const payload = verifyRefreshToken(body.refreshToken);
      
      const user = await authService.getMe(payload.userId);
      const { generateAccessToken, generateRefreshToken } = await import('../utils/jwt');
      
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });
      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      return reply.send({ accessToken, refreshToken, user });
    } catch (error) {
      return reply.status(401).send({ message: 'Invalid refresh token' });
    }
  });

  // GET /me (protected)
  fastify.get('/me', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const user = await authService.getMe(request.user!.userId);
      return reply.send(user);
    } catch (error) {
      return reply.status(404).send({ message: (error as Error).message });
    }
  });
}
