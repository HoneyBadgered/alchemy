/**
 * Public Ingredients Routes
 * 
 * Public endpoints for fetching ingredients for blending and display purposes.
 * Does not require authentication.
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { BlendingIngredientsService } from '../services/blending-ingredients.service';

// Validation schemas
const getIngredientsQuerySchema = z.object({
  category: z.string().optional(),
  isBase: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
  status: z.enum(['active', 'archived', 'outOfStock']).optional().default('active'),
});

export async function ingredientsRoutes(fastify: FastifyInstance) {
  const service = new BlendingIngredientsService();

  // GET /ingredients - Get all active ingredients for blending
  fastify.get('/ingredients', async (request: FastifyRequest, reply) => {
    try {
      const filters = getIngredientsQuerySchema.parse(request.query);
      const ingredients = await service.getBlendingIngredients(filters);
      
      return reply.send({
        ingredients,
        total: ingredients.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /ingredients/bases - Get all base teas
  fastify.get('/ingredients/bases', async (request: FastifyRequest, reply) => {
    try {
      const bases = await service.getBaseTeas();
      
      return reply.send({
        ingredients: bases,
        total: bases.length,
      });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /ingredients/add-ins - Get all add-ins grouped by category
  fastify.get('/ingredients/add-ins', async (request: FastifyRequest, reply) => {
    try {
      const addIns = await service.getAddIns();
      
      return reply.send(addIns);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /ingredients/:id - Get single ingredient by ID
  fastify.get('/ingredients/:id', async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    try {
      const { id } = request.params;
      const ingredient = await service.getIngredientById(id);
      
      if (!ingredient) {
        return reply.status(404).send({ message: 'Ingredient not found' });
      }
      
      return reply.send(ingredient);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
