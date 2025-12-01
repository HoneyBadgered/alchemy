/**
 * Admin Ingredient Management Routes
 * 
 * Full CRUD routes for managing ingredient configurations, inventory,
 * pairings, and computed fields.
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { adminMiddleware } from '../middleware/admin.middleware';
import { AdminIngredientService } from '../services/admin-ingredient.service';

// Validation schemas
const ingredientFiltersSchema = z.object({
  page: z.coerce.number().positive().default(1).optional(),
  perPage: z.coerce.number().positive().max(100).default(50).optional(),
  category: z.string().optional(),
  isBase: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
  search: z.string().optional(),
  caffeineLevel: z.enum(['none', 'low', 'medium', 'high']).optional(),
  status: z.enum(['active', 'archived', 'outOfStock']).optional(),
  lowStock: z.preprocess(
    (val) => val === 'true',
    z.boolean().optional()
  ),
  supplierId: z.string().optional(),
  sortBy: z.enum(['name', 'category', 'stock', 'cost', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createIngredientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['base', 'addIn', 'either']).optional().default('addIn'),
  category: z.string().min(1, 'Category is required'),
  descriptionShort: z.string().optional(),
  descriptionLong: z.string().optional(),
  image: z.string().url().optional().nullable().transform(val => val || undefined),
  
  // Flavor & Use
  flavorNotes: z.array(z.string()).optional().default([]),
  cutOrGrade: z.string().optional(),
  recommendedUsageMin: z.number().min(0).max(100).optional(),
  recommendedUsageMax: z.number().min(0).max(100).optional(),
  pairings: z.array(z.string()).optional().default([]),
  
  // Brewing
  steepTemperature: z.number().positive().optional(),
  steepTimeMin: z.number().nonnegative().optional(),
  steepTimeMax: z.number().nonnegative().optional(),
  brewNotes: z.string().optional(),
  
  // Inventory & Costing
  supplierId: z.string().optional(),
  costPerOunce: z.number().nonnegative().optional(),
  inventoryAmount: z.number().nonnegative().optional().default(0),
  minimumStockLevel: z.number().nonnegative().optional().default(0),
  status: z.enum(['active', 'archived', 'outOfStock']).optional().default('active'),
  
  // Safety
  caffeineLevel: z.enum(['none', 'low', 'medium', 'high']).optional().default('none'),
  allergens: z.array(z.string()).optional().default([]),
  internalNotes: z.string().optional(),
  
  // Legacy fields
  emoji: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  badges: z.array(z.string()).optional().default([]),
  isBase: z.boolean().optional().default(false),
  baseAmount: z.number().positive().optional(),
  incrementAmount: z.number().positive().optional(),
});

const updateIngredientSchema = createIngredientSchema.partial();

export async function adminIngredientRoutes(fastify: FastifyInstance) {
  const ingredientService = new AdminIngredientService();

  // GET /admin/ingredients - List all ingredients with filtering
  fastify.get('/admin/ingredients', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const filters = ingredientFiltersSchema.parse(request.query);
      const result = await ingredientService.getIngredients(filters);
      const defaults = ingredientService.getDefaults();
      
      return reply.send({
        ...result,
        defaults,
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

  // GET /admin/ingredients/suppliers - Get all suppliers
  fastify.get('/admin/ingredients/suppliers', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const suppliers = await ingredientService.getSuppliers();
      return reply.send({ suppliers });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/ingredients/low-stock - Get low stock ingredients
  fastify.get('/admin/ingredients/low-stock', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const ingredients = await ingredientService.getLowStockIngredients();
      return reply.send({ 
        ingredients,
        total: ingredients.length,
      });
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

  // GET /admin/ingredients/:id/usage - Get ingredient usage in recipes/blends
  fastify.get('/admin/ingredients/:id/usage', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const usage = await ingredientService.getIngredientUsage(id);
      return reply.send(usage);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // POST /admin/ingredients - Create new ingredient
  fastify.post('/admin/ingredients', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = createIngredientSchema.parse(request.body);
      const ingredient = await ingredientService.createIngredient(data);
      
      return reply.status(201).send(ingredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // PUT /admin/ingredients/:id - Update ingredient
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

  // PATCH /admin/ingredients/:id/archive - Archive ingredient
  fastify.patch('/admin/ingredients/:id/archive', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ingredient = await ingredientService.archiveIngredient(id);
      
      return reply.send(ingredient);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // PATCH /admin/ingredients/:id/unarchive - Unarchive ingredient
  fastify.patch('/admin/ingredients/:id/unarchive', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const ingredient = await ingredientService.unarchiveIngredient(id);
      
      return reply.send(ingredient);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // DELETE /admin/ingredients/:id - Delete ingredient (prefer archive)
  fastify.delete('/admin/ingredients/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await ingredientService.deleteIngredient(id);
      
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // POST /admin/ingredients/:id/reset - Reset ingredient to defaults (legacy)
  fastify.post('/admin/ingredients/:id/reset', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      // For database-backed ingredients, "reset" doesn't apply the same way
      // Return the current ingredient
      const ingredient = await ingredientService.getIngredient(id);
      
      return reply.send(ingredient);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // POST /admin/ingredients/seed - Seed database from core package
  fastify.post('/admin/ingredients/seed', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const result = await ingredientService.seedFromCore();
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
