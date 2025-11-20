/**
 * Labels Routes (AI-Powered Custom Labels)
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LabelsService } from '../services/labels.service';
import { authMiddleware } from '../middleware/auth';

const generateLabelSchema = z.object({
  stylePreset: z.string().optional(),
  tonePreset: z.string().optional(),
  flavorNotes: z.string().optional(),
  customPrompt: z.string().optional(),
});

const updateLabelSchema = z.object({
  name: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  artworkPrompt: z.string().optional(),
  artworkUrl: z.string().optional(),
});

export async function labelsRoutes(fastify: FastifyInstance) {
  const labelsService = new LabelsService();

  // GET /orders/:orderId/labels (protected)
  fastify.get('/orders/:orderId/labels', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const labels = await labelsService.getOrderLabels(request.user!.userId, orderId);
      return reply.send(labels);
    } catch (error) {
      return reply.status(404).send({ message: (error as Error).message });
    }
  });

  // POST /orders/:orderId/labels (protected)
  fastify.post('/orders/:orderId/labels', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string };
      const body = generateLabelSchema.parse(request.body);
      const label = await labelsService.generateLabel(request.user!.userId, orderId, body);
      return reply.status(201).send(label);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  // PATCH /labels/:labelId (protected)
  fastify.patch('/labels/:labelId', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { labelId } = request.params as { labelId: string };
      const body = updateLabelSchema.parse(request.body);
      const label = await labelsService.updateLabel(request.user!.userId, labelId, body);
      return reply.send(label);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Validation error', errors: error.errors });
      }
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  // POST /labels/:labelId/approve (protected)
  fastify.post('/labels/:labelId/approve', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const { labelId } = request.params as { labelId: string };
      const result = await labelsService.approveLabel(request.user!.userId, labelId);
      return reply.send(result);
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  });
}
