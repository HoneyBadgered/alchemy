/**
 * Admin Theme Management Routes
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { adminMiddleware } from '../middleware/admin.middleware';
import { AdminThemeService } from '../services/admin-theme.service';

const createThemeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  backgroundUrl: z.string().url().optional(),
  colorPalette: z.any().optional(),
  requiredLevel: z.number().int().nonnegative().optional(),
  requiredQuestId: z.string().optional(),
  isPremium: z.boolean().optional(),
  price: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const updateThemeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  backgroundUrl: z.string().url().optional(),
  colorPalette: z.any().optional(),
  requiredLevel: z.number().int().nonnegative().optional(),
  requiredQuestId: z.string().optional(),
  isPremium: z.boolean().optional(),
  price: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const createTableSkinSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  themeId: z.string(),
  imageUrl: z.string().url().optional(),
  requiredLevel: z.number().int().nonnegative().optional(),
  requiredQuestId: z.string().optional(),
  isPremium: z.boolean().optional(),
  price: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export async function adminThemeRoutes(fastify: FastifyInstance) {
  const themeService = new AdminThemeService();

  // GET /admin/themes - List all themes
  fastify.get('/admin/themes', {
    preHandler: adminMiddleware,
  }, async (_request: FastifyRequest, reply) => {
    try {
      const themes = await themeService.getThemes();
      return reply.send({ themes });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // GET /admin/themes/:id - Get single theme
  fastify.get('/admin/themes/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const theme = await themeService.getTheme(id);
      return reply.send(theme);
    } catch (error) {
      return reply.status(404).send({ message: (error as Error).message });
    }
  });

  // POST /admin/themes - Create new theme
  fastify.post('/admin/themes', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = createThemeSchema.parse(request.body);
      const theme = await themeService.createTheme(data);
      return reply.status(201).send(theme);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // PUT /admin/themes/:id - Update theme
  fastify.put('/admin/themes/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateThemeSchema.parse(request.body);
      const theme = await themeService.updateTheme(id, data);
      return reply.send(theme);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // DELETE /admin/themes/:id - Delete theme
  fastify.delete('/admin/themes/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await themeService.deleteTheme(id);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // POST /admin/table-skins - Create table skin
  fastify.post('/admin/table-skins', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const data = createTableSkinSchema.parse(request.body);
      const tableSkin = await themeService.createTableSkin(data);
      return reply.status(201).send(tableSkin);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // PUT /admin/table-skins/:id - Update table skin
  fastify.put('/admin/table-skins/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = createTableSkinSchema.partial().parse(request.body);
      const tableSkin = await themeService.updateTableSkin(id, data);
      return reply.send(tableSkin);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  // DELETE /admin/table-skins/:id - Delete table skin
  fastify.delete('/admin/table-skins/:id', {
    preHandler: adminMiddleware,
  }, async (request: FastifyRequest, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await themeService.deleteTableSkin(id);
      return reply.send(result);
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });
}
