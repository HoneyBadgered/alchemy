/**
 * Cosmetics Routes
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CosmeticsService } from '../services/cosmetics.service';
import { authMiddleware } from '../middleware/auth';

const setThemeSchema = z.object({
  themeId: z.string(),
});

const setTableSkinSchema = z.object({
  skinId: z.string(),
});

export async function cosmeticsRoutes(fastify: FastifyInstance) {
  const cosmeticsService = new CosmeticsService();

  // GET /cosmetics/themes
  fastify.get('/cosmetics/themes', async (_request, reply) => {
    try {
      const themes = await cosmeticsService.getThemes();
      return reply.send(themes);
    } catch (error) {
      const err = error as any;
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({ 
        error: 'Failed to retrieve themes',
        message: err.message,
        statusCode
      });
    }
  });

  // GET /cosmetics/themes/:id/skins
  fastify.get('/cosmetics/themes/:id/skins', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const skins = await cosmeticsService.getThemeSkins(id);
      return reply.send(skins);
    } catch (error) {
      const err = error as any;
      const statusCode = err.statusCode || 404;
      return reply.status(statusCode).send({ 
        error: 'Failed to retrieve theme skins',
        message: err.message,
        statusCode
      });
    }
  });

  // GET /me/cosmetics (protected)
  fastify.get('/me/cosmetics', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const cosmetics = await cosmeticsService.getMyCosmetics(request.user!.userId);
      return reply.send(cosmetics);
    } catch (error) {
      const err = error as any;
      const statusCode = err.statusCode || 500;
      return reply.status(statusCode).send({ 
        error: 'Failed to retrieve cosmetics',
        message: err.message,
        statusCode
      });
    }
  });

  // POST /me/cosmetics/theme (protected)
  fastify.post('/me/cosmetics/theme', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const body = setThemeSchema.parse(request.body);
      const result = await cosmeticsService.setTheme(request.user!.userId, body.themeId);
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
        error: 'Failed to set theme',
        message: err.message,
        statusCode
      });
    }
  });

  // POST /me/cosmetics/table-skin (protected)
  fastify.post('/me/cosmetics/table-skin', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const body = setTableSkinSchema.parse(request.body);
      const result = await cosmeticsService.setTableSkin(request.user!.userId, body.skinId);
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
        error: 'Failed to set table skin',
        message: err.message,
        statusCode
      });
    }
  });
}
