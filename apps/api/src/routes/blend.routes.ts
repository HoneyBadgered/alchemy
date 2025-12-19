/**
 * Blend Routes
 * API endpoints for managing custom tea blends
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { BlendService } from '../services/blend.service';
import { optionalAuthMiddleware } from '../middleware/auth';
import { isValidSessionId, sanitizeSessionId } from '../utils/session';

// Validation schemas
const saveBlendSchema = z.object({
  name: z.string().optional(),
  baseTeaId: z.string(),
  addIns: z.array(z.object({
    ingredientId: z.string(),
    quantity: z.number().min(0),
  })),
  productId: z.string().optional(),
});

const updateBlendNameSchema = z.object({
  name: z.string().min(1),
});

const migrateGuestBlendsSchema = z.object({
  sessionId: z.string(),
});

export async function blendRoutes(fastify: FastifyInstance) {
  const blendService = new BlendService();

  /**
   * Helper function to validate user authentication or session ID
   */
  function validateAuthOrSession(
    request: FastifyRequest,
    reply: FastifyReply
  ): { userId?: string; sessionId?: string } | null {
    const userId = request.user?.userId;
    let sessionId = request.headers['x-session-id'] as string | undefined;

    if (!userId && !sessionId) {
      reply.status(400).send({
        message: 'Either authentication or x-session-id header required',
      });
      return null;
    }

    // Validate and sanitize session ID if provided
    if (sessionId) {
      sessionId = sanitizeSessionId(sessionId);
      if (!isValidSessionId(sessionId)) {
        reply.status(400).send({
          message: 'Invalid session ID format',
        });
        return null;
      }
    }

    return { userId, sessionId };
  }

  /**
   * Get all blends for user or session
   * GET /blends
   */
  fastify.get('/blends', {
    preHandler: optionalAuthMiddleware,
  }, async (request, reply) => {
    try {
      const auth = validateAuthOrSession(request, reply);
      if (!auth) return;

      const blends = await blendService.getBlends(auth);
      return reply.send({ blends });
    } catch (error) {
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Get a specific blend by ID
   * GET /blends/:id
   */
  fastify.get('/blends/:id', {
    preHandler: optionalAuthMiddleware,
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    try {
      const auth = validateAuthOrSession(request, reply);
      if (!auth) return;

      const { id } = request.params;
      const blend = await blendService.getBlendById(id, auth.userId, auth.sessionId);
      return reply.send(blend);
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return reply.status(404).send({ message: (error as Error).message });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Save a new blend
   * POST /blends
   */
  fastify.post('/blends', {
    preHandler: optionalAuthMiddleware,
  }, async (request, reply) => {
    try {
      const auth = validateAuthOrSession(request, reply);
      if (!auth) return;

      const data = saveBlendSchema.parse(request.body);
      const blend = await blendService.saveBlend({
        userId: auth.userId,
        sessionId: auth.sessionId,
        name: data.name,
        baseTeaId: data.baseTeaId,
        addIns: data.addIns,
        productId: data.productId,
      });
      return reply.status(201).send(blend);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  /**
   * Update blend name
   * PATCH /blends/:id
   */
  fastify.patch('/blends/:id', {
    preHandler: optionalAuthMiddleware,
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    try {
      const auth = validateAuthOrSession(request, reply);
      if (!auth) return;

      const { id } = request.params;
      const data = updateBlendNameSchema.parse(request.body);
      const blend = await blendService.updateBlendName(id, data.name, auth.userId, auth.sessionId);
      return reply.send(blend);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      if ((error as any).statusCode === 404) {
        return reply.status(404).send({ message: (error as Error).message });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  /**
   * Delete a blend
   * DELETE /blends/:id
   */
  fastify.delete('/blends/:id', {
    preHandler: optionalAuthMiddleware,
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply) => {
    try {
      const auth = validateAuthOrSession(request, reply);
      if (!auth) return;

      const { id } = request.params;
      const result = await blendService.deleteBlend(id, auth.userId, auth.sessionId);
      return reply.send(result);
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return reply.status(404).send({ message: (error as Error).message });
      }
      return reply.status(500).send({ message: (error as Error).message });
    }
  });

  /**
   * Migrate guest blends to user account (after login)
   * POST /blends/migrate
   * Requires authentication
   */
  fastify.post('/blends/migrate', {
    preHandler: optionalAuthMiddleware,
  }, async (request, reply) => {
    try {
      const userId = request.user?.userId;
      if (!userId) {
        return reply.status(401).send({ message: 'Authentication required' });
      }

      const data = migrateGuestBlendsSchema.parse(request.body);
      
      // Validate session ID
      let sessionId = sanitizeSessionId(data.sessionId);
      if (!isValidSessionId(sessionId)) {
        return reply.status(400).send({ 
          message: 'Invalid session ID format' 
        });
      }

      const result = await blendService.migrateGuestBlends(userId, sessionId);
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });
}
