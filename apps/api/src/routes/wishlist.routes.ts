/**
 * Wishlist Routes
 * API endpoints for user wishlists
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { WishlistService } from '../services/wishlist.service';
import { authMiddleware } from '../middleware/auth';

const addToWishlistSchema = z.object({
  productId: z.string().min(1),
});

const getWishlistSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
});

export async function wishlistRoutes(fastify: FastifyInstance) {
  const wishlistService = new WishlistService();

  /**
   * Get user's wishlist
   * GET /wishlist
   * Requires authentication
   */
  fastify.get('/wishlist', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const params = getWishlistSchema.parse(request.query);

      const result = await wishlistService.getWishlist(userId, params);
      return reply.send(result);
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
   * Add product to wishlist
   * POST /wishlist
   * Requires authentication
   */
  fastify.post('/wishlist', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = addToWishlistSchema.parse(request.body);

      const item = await wishlistService.addToWishlist({
        userId,
        productId: data.productId,
      });

      return reply.status(201).send(item);
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
      if (message.includes('already in')) {
        return reply.status(409).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Remove product from wishlist
   * DELETE /wishlist/:productId
   * Requires authentication
   */
  fastify.delete('/wishlist/:productId', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { productId } = request.params as { productId: string };

      const result = await wishlistService.removeFromWishlist(userId, productId);
      return reply.send(result);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Check if product is in wishlist
   * GET /wishlist/check/:productId
   * Requires authentication
   */
  fastify.get('/wishlist/check/:productId', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { productId } = request.params as { productId: string };

      const isInWishlist = await wishlistService.isInWishlist(userId, productId);
      return reply.send({ isInWishlist });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get wishlist count
   * GET /wishlist/count
   * Requires authentication
   */
  fastify.get('/wishlist/count', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;

      const count = await wishlistService.getWishlistCount(userId);
      return reply.send({ count });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Move item from wishlist to cart
   * POST /wishlist/:productId/move-to-cart
   * Requires authentication
   */
  fastify.post('/wishlist/:productId/move-to-cart', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { productId } = request.params as { productId: string };

      const result = await wishlistService.moveToCart(userId, productId);
      return reply.send(result);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Clear wishlist
   * DELETE /wishlist
   * Requires authentication
   */
  fastify.delete('/wishlist', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;

      const result = await wishlistService.clearWishlist(userId);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });
}
