/**
 * Reviews Routes
 * API endpoints for product reviews and ratings
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ReviewsService } from '../services/reviews.service';
import { authMiddleware } from '../middleware/auth';

const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().max(2000).optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  content: z.string().max(2000).optional(),
});

const getReviewsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).optional(),
});

export async function reviewsRoutes(fastify: FastifyInstance) {
  const reviewsService = new ReviewsService();

  /**
   * Get reviews for a product
   * GET /products/:id/reviews
   * Public endpoint
   */
  fastify.get('/products/:id/reviews', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const params = getReviewsSchema.parse(request.query);

      const result = await reviewsService.getProductReviews(id, params);
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
   * Create a new review
   * POST /reviews
   * Requires authentication
   * Rate limit: 5 reviews per hour per user
   */
  fastify.post('/reviews', {
    preHandler: authMiddleware,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const data = createReviewSchema.parse(request.body);

      const review = await reviewsService.createReview({
        userId,
        ...data,
      });

      return reply.status(201).send(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      const message = (error as Error).message;
      if (message.includes('already reviewed')) {
        return reply.status(409).send({ message });
      }
      if (message.includes('not found') || message.includes('not available')) {
        return reply.status(404).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Get user's own review for a product
   * GET /reviews/my/:productId
   * Requires authentication
   */
  fastify.get('/reviews/my/:productId', {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { productId } = request.params as { productId: string };

      const review = await reviewsService.getUserReview(userId, productId);
      return reply.send(review);
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Update a review
   * PATCH /reviews/:id
   * Requires authentication
   * Rate limit: 10 updates per hour per user
   */
  fastify.patch('/reviews/:id', {
    preHandler: authMiddleware,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 hour',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };
      const data = updateReviewSchema.parse(request.body);

      const review = await reviewsService.updateReview(id, userId, data);
      return reply.send(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      if (message.includes('only edit your own')) {
        return reply.status(403).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });

  /**
   * Delete a review
   * DELETE /reviews/:id
   * Requires authentication
   * Rate limit: 10 deletions per hour per user
   */
  fastify.delete('/reviews/:id', {
    preHandler: authMiddleware,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 hour',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { id } = request.params as { id: string };

      const result = await reviewsService.deleteReview(id, userId);
      return reply.send(result);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      if (message.includes('only delete your own')) {
        return reply.status(403).send({ message });
      }
      return reply.status(400).send({ message });
    }
  });
}
