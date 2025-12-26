/**
 * Authentication Routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth';

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

const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

const verifyEmailSchema = z.object({
  token: z.string(),
});

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();

  // POST /auth/register
  fastify.post('/auth/register', {
    config: {
      rateLimit: {
        max: 3, // Only 3 registrations per hour
        timeWindow: '1 hour',
      },
    },
  }, async (request, reply) => {
    try {
      if (!request.body) {
        return reply.status(400).send({ message: 'Request body is required' });
      }
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
      console.log('LOGIN ATTEMPT:', request.body);
      if (!request.body) {
        console.log('No request body');
        return reply.status(400).send({ message: 'Request body is required' });
      }
      const body = loginSchema.parse(request.body);
      console.log('Parsed login body:', body);
      const result = await authService.login(body);
      console.log('Login result:', result);
      // Set refresh token as httpOnly cookie
      reply.setCookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return reply.send({
        accessToken: result.accessToken,
        user: result.users,
      });
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(401).send({ message: (error as Error).message });
    }
  });

  // POST /auth/logout
  fastify.post('/auth/logout', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      // Get refresh token from body or cookie
      const bodyToken = request.body && typeof request.body === 'object' && 'refreshToken' in request.body
        ? (request.body as { refreshToken?: string }).refreshToken
        : undefined;
      const cookieToken = request.cookies?.refreshToken;
      const refreshToken = bodyToken || cookieToken;
      
      if (!refreshToken) {
        return reply.status(400).send({ message: 'Refresh token is required (provide in body or cookie)' });
      }
      
      await authService.logout(request.user!.userId, refreshToken);
      
      // Clear refresh token cookie
      reply.clearCookie('refreshToken', { path: '/' });

      return reply.send({ message: 'Logged out successfully' });
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
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
      if (!request.body) {
        return reply.status(400).send({ message: 'Request body is required' });
      }
      const body = refreshSchema.parse(request.body);
      
      // Verify and get user from stored refresh token
      const user = await authService.verifyRefreshToken(body.refreshToken);
      
      const { generateAccessToken, generateRefreshToken } = await import('../utils/jwt');
      
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      });
      const newRefreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      // Store new refresh token and invalidate old one
      await authService.logout(user.id, body.refreshToken);
      await (authService as any).storeRefreshToken(user.id, newRefreshToken);

      // Update cookie
      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return reply.send({ accessToken, user });
    } catch (error) {
      return reply.status(401).send({ message: 'Invalid refresh token' });
    }
  });

  // GET /auth/me (protected)
  fastify.get('/auth/me', {
    preHandler: authMiddleware,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    try {
      const user = await authService.getMe(request.user!.userId);
      return reply.send(user);
    } catch (error) {
      return reply.status(404).send({ message: (error as Error).message });
    }
  });

  // POST /auth/password-reset/request
  fastify.post('/auth/password-reset/request', async (request, reply) => {
    try {
      if (!request.body) {
        return reply.status(400).send({ message: 'Request body is required' });
      }
      const body = passwordResetRequestSchema.parse(request.body);
      const result = await authService.requestPasswordReset(body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  // POST /auth/password-reset/confirm
  fastify.post('/auth/password-reset/confirm', async (request, reply) => {
    try {
      if (!request.body) {
        return reply.status(400).send({ message: 'Request body is required' });
      }
      const body = passwordResetSchema.parse(request.body);
      const result = await authService.resetPassword(body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  // POST /auth/verify-email
  fastify.post('/auth/verify-email', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
      },
    },
  }, async (request, reply) => {
    try {
      if (!request.body) {
        return reply.status(400).send({ message: 'Request body is required' });
      }
      const body = verifyEmailSchema.parse(request.body);
      const result = await authService.verifyEmail(body.token);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  // POST /auth/resend-verification
  fastify.post('/auth/resend-verification', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 hour',
      },
    },
  }, async (request, reply) => {
    try {
      if (!request.body) {
        return reply.status(400).send({ message: 'Request body is required' });
      }
      const body = resendVerificationSchema.parse(request.body);
      const result = await authService.resendVerificationEmail(body.email);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });
}
