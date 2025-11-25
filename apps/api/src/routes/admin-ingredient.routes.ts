/**
 * Admin Ingredient Management Routes
 * 
 * Routes for managing ingredient configurations (baseAmount, incrementAmount)
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { adminMiddleware } from '../middleware/admin.middleware';
import { AdminIngredientService } from '../services/admin-ingredient.service';
import type { IngredientCategory } from '@alchemy/core';

const ingredientFiltersSchema = z.object({
  category: z.enum(['base', 'floral', 'fruit', 'herbal', 'spice', 'special']).optional(),
  isBase: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

const updateIngredientSchema = z.object({
  baseAmount: z.number().positive().min(0.1).optional(),
  incrementAmount: z.number().positive().min(0.1).optional(),
});

export async function adminIngredientRoutes(fastify: FastifyInstance) {
  const ingredientService = new AdminIngredientService();

  // GET /admin/ingredients - List all ingredients with filtering
  fastify.get('/admin/ingredients', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const filters = ingredientFiltersSchema.parse(request.query);
      const ingredients = await ingredientService.getIngredients(filters as { category?: IngredientCategory; isBase?: boolean; search?: string });
      const defaults = ingredientService.getDefaults();
      
      return reply.send({
        ingredients,
        defaults,
        total: ingredients.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/ingredients/add-ins - Get all add-ins (non-base ingredients)
  fastify.get('/admin/ingredients/add-ins', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const addIns = await ingredientService.getAddIns();
      const defaults = ingredientService.getDefaults();
      
      return reply.send({
        ingredients: addIns,
        defaults,
        total: addIns.length,
      });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/ingredients/categories - Get all ingredient categories
  fastify.get('/admin/ingredients/categories', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const categories = await ingredientService.getCategories();
      return reply.send({ categories });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/ingredients/defaults - Get default values
  fastify.get('/admin/ingredients/defaults', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const defaults = ingredientService.getDefaults();
      return reply.send(defaults);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/ingredients/:id - Get single ingredient
  fastify.get('/admin/ingredients/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ingredient = await ingredientService.getIngredient(id);
      const defaults = ingredientService.getDefaults();
      
      return reply.send({
        ingredient,
        defaults,
      });
    } catch (error) {
      return reply.status(404).send({ message: (error as Error).message });
    }
  });

  // PUT /admin/ingredients/:id - Update ingredient configuration
  fastify.put('/admin/ingredients/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateIngredientSchema.parse(request.body);
      const ingredient = await ingredientService.updateIngredient(id, data);
      
      return reply.send(ingredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // POST /admin/ingredients/:id/reset - Reset ingredient to defaults
  fastify.post('/admin/ingredients/:id/reset', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ingredient = await ingredientService.resetIngredient(id);
      
      return reply.send(ingredient);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
