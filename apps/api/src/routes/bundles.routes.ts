/**
 * Bundles Routes
 * API endpoints for product bundles, upsells, and recommendations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { BundlesService } from '../services/bundles.service';

const getBundlesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
});

const getRecommendationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).optional(),
});

const getCartUpsellsSchema = z.object({
  productIds: z.string().min(1), // Comma-separated product IDs
  limit: z.coerce.number().int().min(1).max(12).optional(),
});

export async function bundlesRoutes(fastify: FastifyInstance) {
  const bundlesService = new BundlesService();

  /**
   * Get all active bundles
   * GET /bundles
   * Public endpoint
   */
  fastify.get('/bundles', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getBundlesSchema.parse(request.query);

      const result = await bundlesService.getBundles(params);
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
   * Get a specific bundle
   * GET /bundles/:id
   * Public endpoint
   */
  fastify.get('/bundles/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const bundle = await bundlesService.getBundle(id);
      return reply.send(bundle);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ message });
      }
      return reply.status(500).send({ message });
    }
  });

  /**
   * Get related products for a product
   * GET /products/:id/related
   * Public endpoint
   */
  fastify.get('/products/:id/related', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { type } = request.query as { type?: string };

      const products = await bundlesService.getRelatedProducts(id, type);
      return reply.send({ products });
    } catch (error) {
      return reply.status(500).send({
        message: (error as Error).message,
      });
    }
  });

  /**
   * Get recommendations for a product ("You May Also Like")
   * GET /products/:id/recommendations
   * Public endpoint
   */
  fastify.get('/products/:id/recommendations', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const params = getRecommendationsSchema.parse(request.query);

      const products = await bundlesService.getRecommendations(id, params.limit);
      return reply.send({ products });
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
   * Get upsell products for cart
   * GET /cart/upsells
   * Public endpoint
   */
  fastify.get('/cart/upsells', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getCartUpsellsSchema.parse(request.query);
      const productIds = params.productIds.split(',').filter(Boolean);

      if (productIds.length === 0) {
        return reply.send({ products: [] });
      }

      const products = await bundlesService.getCartUpsells(productIds, params.limit);
      return reply.send({ products });
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
}
