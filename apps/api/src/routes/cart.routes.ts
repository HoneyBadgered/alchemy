/**
 * Cart Routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CartService } from '../services/cart.service';
import { authMiddleware } from '../middleware/auth';
import { isValidSessionId, sanitizeSessionId } from '../utils/session';

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).default(1),
});

const updateCartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
});

const removeFromCartSchema = z.object({
  productId: z.string(),
});

const mergeCartSchema = z.object({
  sessionId: z.string(),
});

export async function cartRoutes(fastify: FastifyInstance) {
  const cartService = new CartService();

  /**
   * Get user's or guest's cart
   * GET /cart
   * Optional authentication (supports both authenticated users and guests)
   */
  fastify.get('/cart', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      let sessionId = request.headers['x-session-id'] as string | undefined;

      if (!userId && !sessionId) {
        return reply.status(400).send({ 
          message: 'Either authentication or x-session-id header required' 
        });
      }

      // Validate and sanitize session ID if provided
      if (sessionId) {
        sessionId = sanitizeSessionId(sessionId);
        if (!isValidSessionId(sessionId)) {
          return reply.status(400).send({ 
            message: 'Invalid session ID format' 
          });
        }
      }

      const result = await cartService.getCart({ userId, sessionId });
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Add item to cart
   * POST /cart/items
   * Optional authentication (supports both authenticated users and guests)
   */
  fastify.post('/cart/items', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      let sessionId = request.headers['x-session-id'] as string | undefined;

      if (!userId && !sessionId) {
        return reply.status(400).send({ 
          message: 'Either authentication or x-session-id header required' 
        });
      }

      // Validate and sanitize session ID if provided
      if (sessionId) {
        sessionId = sanitizeSessionId(sessionId);
        if (!isValidSessionId(sessionId)) {
          return reply.status(400).send({ 
            message: 'Invalid session ID format' 
          });
        }
      }

      const data = addToCartSchema.parse(request.body);
      const result = await cartService.addToCart({
        ...data,
        userId,
        sessionId,
      });
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  /**
   * Update cart item quantity
   * PATCH /cart/items
   * Optional authentication (supports both authenticated users and guests)
   */
  fastify.patch('/cart/items', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      let sessionId = request.headers['x-session-id'] as string | undefined;

      if (!userId && !sessionId) {
        return reply.status(400).send({ 
          message: 'Either authentication or x-session-id header required' 
        });
      }

      // Validate and sanitize session ID if provided
      if (sessionId) {
        sessionId = sanitizeSessionId(sessionId);
        if (!isValidSessionId(sessionId)) {
          return reply.status(400).send({ 
            message: 'Invalid session ID format' 
          });
        }
      }

      const data = updateCartItemSchema.parse(request.body);
      const result = await cartService.updateCartItem({
        ...data,
        userId,
        sessionId,
      });
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  /**
   * Remove item from cart
   * DELETE /cart/items
   * Optional authentication (supports both authenticated users and guests)
   */
  fastify.delete('/cart/items', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      let sessionId = request.headers['x-session-id'] as string | undefined;

      if (!userId && !sessionId) {
        return reply.status(400).send({ 
          message: 'Either authentication or x-session-id header required' 
        });
      }

      // Validate and sanitize session ID if provided
      if (sessionId) {
        sessionId = sanitizeSessionId(sessionId);
        if (!isValidSessionId(sessionId)) {
          return reply.status(400).send({ 
            message: 'Invalid session ID format' 
          });
        }
      }

      const data = removeFromCartSchema.parse(request.body);
      const result = await cartService.removeFromCart({
        ...data,
        userId,
        sessionId,
      });
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  /**
   * Clear cart
   * DELETE /cart
   * Optional authentication (supports both authenticated users and guests)
   */
  fastify.delete('/cart', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      let sessionId = request.headers['x-session-id'] as string | undefined;

      if (!userId && !sessionId) {
        return reply.status(400).send({ 
          message: 'Either authentication or x-session-id header required' 
        });
      }

      // Validate and sanitize session ID if provided
      if (sessionId) {
        sessionId = sanitizeSessionId(sessionId);
        if (!isValidSessionId(sessionId)) {
          return reply.status(400).send({ 
            message: 'Invalid session ID format' 
          });
        }
      }

      const result = await cartService.clearCart({ userId, sessionId });
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Merge guest cart with user cart (after login)
   * POST /cart/merge
   * Requires authentication
   */
  fastify.post('/cart/merge', {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    try {
      const userId = request.user!.userId;
      const data = mergeCartSchema.parse(request.body);
      
      // Validate session ID
      let sessionId = sanitizeSessionId(data.sessionId);
      if (!isValidSessionId(sessionId)) {
        return reply.status(400).send({ 
          message: 'Invalid session ID format' 
        });
      }
      
      const result = await cartService.mergeGuestCart(userId, sessionId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });
}
