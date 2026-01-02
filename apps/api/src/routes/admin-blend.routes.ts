/**
 * Admin Blend Management Routes
 * Create products from custom blends
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { adminMiddleware } from '../middleware/admin.middleware';
import { AdminBlendService } from '../services/admin-blend.service';

const createBlendProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  baseTeaId: z.string(),
  addIns: z.array(z.object({
    ingredientId: z.string(),
    quantity: z.number().min(0),
  })),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const convertBlendToProductSchema = z.object({
  blendId: z.string(),
  price: z.number().positive(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const updateBlendSchema = z.object({
  baseTeaId: z.string(),
  addIns: z.array(z.object({
    ingredientId: z.string(),
    quantity: z.number().min(0),
  })),
  name: z.string().optional(),
});

export async function adminBlendRoutes(fastify: FastifyInstance) {
  const blendService = new AdminBlendService();

  /**
   * Create a new product from a blend recipe
   * POST /admin/blends/products
   */
  fastify.post('/admin/blends/products', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = createBlendProductSchema.parse(request.body);
      const product = await blendService.createProductFromBlend(data);
      return reply.status(201).send(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Convert an existing blend to a product
   * POST /admin/blends/:blendId/convert
   */
  fastify.post('/admin/blends/:blendId/convert', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest<{
    Params: { blendId: string }
  }>, reply) => {
    try {
      const { blendId } = request.params;
      const data = convertBlendToProductSchema.parse(request.body);
      const product = await blendService.convertBlendToProduct(blendId, data);
      return reply.status(201).send(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Get all blends (including guest blends)
   * GET /admin/blends
   */
  fastify.get('/admin/blends', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { page = 1, perPage = 20, hasProduct } = request.query as {
        page?: number;
        perPage?: number;
        hasProduct?: string;
      };
      
      const blends = await blendService.getAllBlends({
        page: Number(page),
        perPage: Number(perPage),
        hasProduct: hasProduct === 'true' ? true : hasProduct === 'false' ? false : undefined,
      });
      
      return reply.send(blends);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Get blend details with ingredient information
   * GET /admin/blends/:id
   */
  fastify.get('/admin/blends/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    try {
      const { id } = request.params;
      const blend = await blendService.getBlendWithIngredients(id);
      return reply.send(blend);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Calculate cost for a blend based on ingredients
   * POST /admin/blends/calculate-cost
   */
  fastify.post('/admin/blends/calculate-cost', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = z.object({
        baseTeaId: z.string(),
        addIns: z.array(z.object({
          ingredientId: z.string(),
          quantity: z.number().min(0),
        })),
      }).parse(request.body);
      
      const cost = await blendService.calculateBlendCost(data);
      return reply.send(cost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Update a blend's composition
   * PUT /admin/blends/:id
   */
  fastify.put('/admin/blends/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    try {
      const { id } = request.params;
      const data = updateBlendSchema.parse(request.body);
      const blend = await blendService.updateBlend(id, data);
      return reply.send(blend);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
