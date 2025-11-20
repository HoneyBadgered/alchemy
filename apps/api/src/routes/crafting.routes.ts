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
      return reply.status(500).send({ message: (error as Error).message });
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
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });
}
