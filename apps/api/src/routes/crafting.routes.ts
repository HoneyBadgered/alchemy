/**
 * Crafting Routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CraftingService } from '../services/crafting.service';
import { authMiddleware } from '../middleware/auth';

const craftSchema = z.object({
  recipeId: z.string(),
});

export async function craftingRoutes(fastify: FastifyInstance) {
  const craftingService = new CraftingService();

  // GET /recipes (protected)
  fastify.get('/recipes', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const recipes = await craftingService.getRecipes(request.user!.userId);
      return reply.send(recipes);
    } catch (error) {
      const err = error as any;
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({ 
        error: 'Failed to retrieve recipes',
        message: err.message,
        statusCode 
      });
    }
  });

  // POST /craft (protected)
  fastify.post('/craft', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const body = craftSchema.parse(request.body);
      const result = await craftingService.craft(request.user!.userId, body);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation error',
          message: 'Invalid request data',
          details: error.errors,
          statusCode: 400
        });
      }
      const err = error as any;
      const statusCode = err.statusCode || 400;
      return reply.status(statusCode).send({ 
        error: 'Crafting failed',
        message: err.message,
        statusCode
      });
    }
  });
}
