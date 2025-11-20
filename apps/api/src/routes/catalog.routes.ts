/**
 * Catalog Routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CatalogService } from '../services/catalog.service';

const getProductsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  category: z.string().optional(),
});

export async function catalogRoutes(fastify: FastifyInstance) {
  const catalogService = new CatalogService();

  // GET /catalog/products
  fastify.get('/catalog/products', async (request, reply) => {
    try {
      const params = getProductsSchema.parse(request.query);
      const result = await catalogService.getProducts(params);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /catalog/products/:id
  fastify.get('/catalog/products/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const product = await catalogService.getProduct(id);
      return reply.send(product);
    } catch (error) {
      return reply.status(404).send({ message: (error as Error).message });
    }
  });
}
