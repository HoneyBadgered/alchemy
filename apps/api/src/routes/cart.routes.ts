/**
 * Cart Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { CartService } from '../services/cart.service';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { isValidSessionId, sanitizeSessionId } from '../utils/session';

// Helper schema for integer quantity that accepts floats and converts them to integers
// Uses Math.round() for more intuitive rounding (e.g., 2.7 -> 3, 2.3 -> 2)
const intQuantitySchema = z.preprocess(
  (val) => (typeof val === 'number' ? Math.round(val) : val),
  z.number().int().min(1)
);

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: intQuantitySchema.default(1),
});

const updateCartItemSchema = z.object({
  productId: z.string(),
  quantity: intQuantitySchema,
});

const removeFromCartSchema = z.object({
  productId: z.string(),
});

const mergeCartSchema = z.object({
  sessionId: z.string(),
});

const addBlendToCartSchema = z.object({
  baseTeaId: z.string(),
  addIns: z.array(z.object({
    ingredientId: z.string(),
    quantity: intQuantitySchema,
  })),
  name: z.string().optional(),
});

export async function cartRoutes(fastify: FastifyInstance) {
  const cartService = new CartService();

  /**
   * Helper function to validate user authentication or session ID
   */
  function validateAuthOrSession(
    request: FastifyRequest,
    reply: FastifyReply
  ): { userId?: string; sessionId?: string } | null {
    const userId = request.user?.userId;
    let sessionId = request.headers['x-session-id'] as string | undefined;

    if (!userId && !sessionId) {
      reply.status(400).send({
        message: 'Either authentication or x-session-id header required',
      });
      return null;
    }

    // Validate and sanitize session ID if provided
    if (sessionId) {
      sessionId = sanitizeSessionId(sessionId);
      if (!isValidSessionId(sessionId)) {
        reply.status(400).send({
          message: 'Invalid session ID format',
        });
        return null;
      }
    }

    return { userId, sessionId };
  }

  /**
   * Get user's or guest's cart
   * GET /cart
   * Optional authentication (supports both authenticated users and guests)
   */
  fastify.get('/cart', {
    preHandler: optionalAuthMiddleware,
  }, async (request, reply) => {
    try {
      const auth = validateAuthOrSession(request, reply);
      if (!auth) return;

      const result = await cartService.getCart(auth);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Add item to cart
   * POST /cart/items
   * Optional authentication (supports both authenticated users and guests)
   * Rate limit: 30 items per minute to prevent abuse
   */
  fastify.post('/cart/items', {
    preHandler: optionalAuthMiddleware,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    try {
      const auth = validateAuthOrSession(request, reply);
      if (!auth) return;

      const data = addToCartSchema.parse(request.body);
      const result = await cartService.addToCart({
        ...data,
        ...auth,
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
   * Rate limit: 30 updates per minute to prevent abuse
   */
  fastify.patch('/cart/items', {
    preHandler: optionalAuthMiddleware,
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    try {
      const auth = validateAuthOrSession(request, reply);
      if (!auth) return;

      const data = updateCartItemSchema.parse(request.body);
      const result = await cartService.updateCartItem({
        ...data,
        ...auth,
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
  fastify.delete('/cart/items', {
    preHandler: optionalAuthMiddleware,
  }, async (request, reply) => {
    try {
      const auth = validateAuthOrSession(request, reply);
      if (!auth) return;

      const data = removeFromCartSchema.parse(request.body);
      const result = await cartService.removeFromCart({
        ...data,
        ...auth,
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
  fastify.delete('/cart', {
    preHandler: optionalAuthMiddleware,
  }, async (request, reply) => {
    try {
      const auth = validateAuthOrSession(request, reply);
      if (!auth) return;

      const result = await cartService.clearCart(auth);
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

  /**
   * Add custom blend to cart
   * POST /cart/blend
   * Optional authentication (supports both authenticated users and guests)
   */
  fastify.post('/cart/blend', {
    preHandler: optionalAuthMiddleware,
  }, async (request, reply) => {
    try {
      const auth = validateAuthOrSession(request, reply);
      if (!auth) return;

      const data = addBlendToCartSchema.parse(request.body);
      const result = await cartService.addBlendToCart({
        baseTeaId: data.baseTeaId,
        addIns: data.addIns,
        blendName: data.name,
        ...auth,
      });
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });
}
