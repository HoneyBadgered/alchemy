/**
 * Admin Webhook Management Routes
 * 
 * Admin-only endpoints for managing webhook events:
 * - View failed webhook events
 * - Manually retry failed webhooks
 * - Move webhooks to dead letter queue
 * - View webhook statistics
 * - Bulk operations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';
import { WebhookRetryWorker } from '../services/webhook-retry.service';

// Validation schemas
const webhookIdSchema = z.object({
  id: z.string().uuid(),
});

const listWebhooksSchema = z.object({
  status: z.enum(['pending', 'processing', 'processed', 'failed', 'dead_letter']).optional(),
  eventType: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

const manualRetrySchema = z.object({
  resetRetryCount: z.boolean().optional().default(false),
});

const bulkRetrySchema = z.object({
  eventIds: z.array(z.string().uuid()).min(1).max(50),
  resetRetryCount: z.boolean().optional().default(false),
});

const moveToDLQSchema = z.object({
  reason: z.string().min(1).max(500),
});

export async function adminWebhookRoutes(
  fastify: FastifyInstance,
  retryWorker: WebhookRetryWorker
) {
  // All routes require admin authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authMiddleware(request, reply);
    
    // Check if user has admin role
    if (!request.user) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
    
    const user = await prisma.users.findUnique({
      where: { id: request.user.userId },
      select: { role: true },
    });
    
    if (!user || user.role !== 'admin') {
      return reply.status(403).send({ message: 'Admin access required' });
    }
  });

  /**
   * Get webhook queue statistics
   * GET /admin/webhooks/stats
   */
  fastify.get('/admin/webhooks/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await retryWorker.getQueueStats();
      const workerStatus = retryWorker.getStatus();

      // Additional stats
      const [avgRetryCount, oldestPending] = await Promise.all([
        prisma.stripe_webhook_events.aggregate({
          where: { status: { in: ['failed', 'dead_letter'] } },
          _avg: { retryCount: true },
        }),
        prisma.stripe_webhook_events.findFirst({
          where: { status: 'pending', processed: false },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
      ]);

      return reply.send({
        queue: stats,
        worker: workerStatus,
        metrics: {
          avgRetryCount: avgRetryCount._avg.retryCount || 0,
          oldestPendingAge: oldestPending
            ? Math.floor((Date.now() - oldestPending.createdAt.getTime()) / 1000)
            : null,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Failed to fetch webhook stats' });
    }
  });

  /**
   * List webhook events with filtering
   * GET /admin/webhooks?status=failed&limit=50&offset=0
   */
  fastify.get('/admin/webhooks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listWebhooksSchema.parse(request.query);

      const where: any = {};
      if (query.status) {
        where.status = query.status;
      }
      if (query.eventType) {
        where.eventType = query.eventType;
      }

      const [events, total] = await Promise.all([
        prisma.stripe_webhook_events.findMany({
          where,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          take: query.limit,
          skip: query.offset,
          select: {
            id: true,
            eventId: true,
            eventType: true,
            status: true,
            retryCount: true,
            maxRetries: true,
            nextRetryAt: true,
            lastAttemptAt: true,
            error: true,
            priority: true,
            createdAt: true,
            processedAt: true,
          },
        }),
        prisma.stripe_webhook_events.count({ where }),
      ]);

      return reply.send({
        events,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < total,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Invalid query parameters', errors: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Failed to fetch webhooks' });
    }
  });

  /**
   * Get webhook event details
   * GET /admin/webhooks/:id
   */
  fastify.get('/admin/webhooks/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = webhookIdSchema.parse(request.params);

      const event = await prisma.stripe_webhook_events.findUnique({
        where: { id },
      });

      if (!event) {
        return reply.status(404).send({ message: 'Webhook event not found' });
      }

      return reply.send({ event });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Invalid webhook ID' });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Failed to fetch webhook details' });
    }
  });

  /**
   * Manually retry a webhook event
   * POST /admin/webhooks/:id/retry
   */
  fastify.post('/admin/webhooks/:id/retry', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = webhookIdSchema.parse(request.params);
      const body = manualRetrySchema.parse(request.body);

      const event = await prisma.stripe_webhook_events.findUnique({
        where: { id },
      });

      if (!event) {
        return reply.status(404).send({ message: 'Webhook event not found' });
      }

      if (event.status === 'processed') {
        return reply.status(400).send({ message: 'Webhook event already processed' });
      }

      // Update event for immediate retry
      const updateData: any = {
        status: event.status === 'dead_letter' ? 'failed' : event.status,
        nextRetryAt: new Date(), // Retry immediately
        error: null,
      };

      if (body.resetRetryCount) {
        updateData.retryCount = 0;
        updateData.errorHistory = null;
      }

      await prisma.stripe_webhook_events.update({
        where: { id },
        data: updateData,
      });

      fastify.log.info({
        action: 'manual_webhook_retry',
        webhookId: id,
        eventId: event.eventId,
        resetRetryCount: body.resetRetryCount,
        adminUser: (request as any).user?.userId,
      });

      return reply.send({
        message: 'Webhook scheduled for retry',
        nextRetryAt: updateData.nextRetryAt,
        resetRetryCount: body.resetRetryCount,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Invalid request', errors: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Failed to retry webhook' });
    }
  });

  /**
   * Bulk retry webhook events
   * POST /admin/webhooks/bulk-retry
   */
  fastify.post('/admin/webhooks/bulk-retry', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = bulkRetrySchema.parse(request.body);

      const updateData: any = {
        status: 'failed',
        nextRetryAt: new Date(),
        error: null,
      };

      if (body.resetRetryCount) {
        updateData.retryCount = 0;
        updateData.errorHistory = null;
      }

      const result = await prisma.stripe_webhook_events.updateMany({
        where: {
          id: { in: body.eventIds },
          status: { in: ['failed', 'dead_letter'] },
        },
        data: updateData,
      });

      fastify.log.info({
        action: 'bulk_webhook_retry',
        eventIds: body.eventIds,
        scheduled: result.count,
        resetRetryCount: body.resetRetryCount,
        adminUser: (request as any).user?.userId,
      });

      return reply.send({
        message: 'Webhooks scheduled for retry',
        scheduled: result.count,
        requested: body.eventIds.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Invalid request', errors: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Failed to retry webhooks' });
    }
  });

  /**
   * Move webhook to dead letter queue
   * POST /admin/webhooks/:id/dead-letter
   */
  fastify.post('/admin/webhooks/:id/dead-letter', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = webhookIdSchema.parse(request.params);
      const body = moveToDLQSchema.parse(request.body);

      const event = await prisma.stripe_webhook_events.findUnique({
        where: { id },
      });

      if (!event) {
        return reply.status(404).send({ message: 'Webhook event not found' });
      }

      if (event.status === 'processed') {
        return reply.status(400).send({ message: 'Cannot move processed webhook to DLQ' });
      }

      await prisma.stripe_webhook_events.update({
        where: { id },
        data: {
          status: 'dead_letter',
          error: `Manually moved to DLQ by admin: ${body.reason}`,
        },
      });

      fastify.log.info({
        action: 'move_webhook_to_dlq',
        webhookId: id,
        eventId: event.eventId,
        reason: body.reason,
        adminUser: (request as any).user?.userId,
      });

      return reply.send({
        message: 'Webhook moved to dead letter queue',
        reason: body.reason,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Invalid request', errors: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Failed to move webhook to DLQ' });
    }
  });

  /**
   * Mark webhook as resolved (for DLQ events)
   * POST /admin/webhooks/:id/resolve
   */
  fastify.post('/admin/webhooks/:id/resolve', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = webhookIdSchema.parse(request.params);

      const event = await prisma.stripe_webhook_events.findUnique({
        where: { id },
      });

      if (!event) {
        return reply.status(404).send({ message: 'Webhook event not found' });
      }

      await prisma.stripe_webhook_events.update({
        where: { id },
        data: {
          status: 'processed',
          processed: true,
          processedAt: new Date(),
          error: 'Manually resolved by admin',
        },
      });

      fastify.log.info({
        action: 'resolve_webhook',
        webhookId: id,
        eventId: event.eventId,
        adminUser: (request as any).user?.userId,
      });

      return reply.send({
        message: 'Webhook marked as resolved',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ message: 'Invalid webhook ID' });
      }
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Failed to resolve webhook' });
    }
  });

  /**
   * Delete old processed webhooks (cleanup)
   * DELETE /admin/webhooks/cleanup?olderThanDays=90
   */
  fastify.delete('/admin/webhooks/cleanup', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { olderThanDays = 90 } = request.query as { olderThanDays?: number };

      if (olderThanDays < 30) {
        return reply.status(400).send({ message: 'Cannot delete webhooks newer than 30 days' });
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await prisma.stripe_webhook_events.deleteMany({
        where: {
          status: 'processed',
          processedAt: {
            lt: cutoffDate,
          },
        },
      });

      fastify.log.info({
        action: 'cleanup_webhooks',
        deleted: result.count,
        olderThanDays,
        adminUser: (request as any).user?.userId,
      });

      return reply.send({
        message: 'Webhook cleanup completed',
        deleted: result.count,
        olderThanDays,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: 'Failed to cleanup webhooks' });
    }
  });
}
