/**
 * Webhook Retry Worker Tests
 * 
 * Tests webhook retry mechanism including:
 * - Exponential backoff calculation
 * - Retry limit enforcement
 * - Dead letter queue triggers
 * - Error classification
 * - Worker lifecycle
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { prisma } from '../utils/prisma';
import { WebhookRetryWorker } from '../services/webhook-retry.service';
import { PaymentService } from '../services/payment.service';

// Mock PaymentService
vi.mock('../services/payment.service', () => ({
  PaymentService: vi.fn().mockImplementation(() => ({
    handleWebhookEvent: vi.fn(),
  })),
}));

describe('Webhook Retry Worker', () => {
  let worker: WebhookRetryWorker;
  let mockPaymentService: any;

  beforeAll(async () => {
    // Clean up test data
    await prisma.stripe_webhook_events.deleteMany({
      where: {
        eventId: { startsWith: 'evt_test_' },
      },
    });
  });

  afterAll(async () => {
    // Clean up after tests
    await prisma.stripe_webhook_events.deleteMany({
      where: {
        eventId: { startsWith: 'evt_test_' },
      },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create worker with shorter intervals for testing
    worker = new WebhookRetryWorker({
      pollingInterval: 1000, // 1 second for tests
      batchSize: 5,
      enableConcurrencyLock: false, // Disable for single-instance tests
      maxProcessingTime: 5000, // 5 seconds
    });

    mockPaymentService = new PaymentService();
  });

  describe('Worker Lifecycle', () => {
    it('should start and stop gracefully', async () => {
      worker.start();
      const status = worker.getStatus();
      
      expect(status.isRunning).toBe(true);
      expect(status.isShuttingDown).toBe(false);
      
      await worker.stop();
      const stoppedStatus = worker.getStatus();
      
      expect(stoppedStatus.isRunning).toBe(false);
    });

    it('should not start twice', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      worker.start();
      worker.start(); // Second start
      
      expect(consoleSpy).toHaveBeenCalledWith('Webhook retry worker is already running');
      
      worker.stop();
    });
  });

  describe('Queue Statistics', () => {
    it('should return accurate queue statistics', async () => {
      // Create test events in different states
      await prisma.stripe_webhook_events.createMany({
        data: [
          {
            id: 'test-pending-1',
            eventId: 'evt_test_pending_1',
            eventType: 'payment_intent.succeeded',
            payload: {},
            status: 'pending',
          },
          {
            id: 'test-failed-1',
            eventId: 'evt_test_failed_1',
            eventType: 'payment_intent.succeeded',
            payload: {},
            status: 'failed',
            retryCount: 2,
          },
          {
            id: 'test-dlq-1',
            eventId: 'evt_test_dlq_1',
            eventType: 'payment_intent.succeeded',
            payload: {},
            status: 'dead_letter',
            retryCount: 5,
          },
        ],
      });

      const stats = await worker.getQueueStats();

      expect(stats.pending).toBeGreaterThanOrEqual(1);
      expect(stats.failed).toBeGreaterThanOrEqual(1);
      expect(stats.deadLetter).toBeGreaterThanOrEqual(1);

      // Cleanup
      await prisma.stripe_webhook_events.deleteMany({
        where: {
          id: { in: ['test-pending-1', 'test-failed-1', 'test-dlq-1'] },
        },
      });
    });
  });

  describe('Event Processing', () => {
    it('should successfully process pending webhook event', async () => {
      // Create pending event
      const event = await prisma.stripe_webhook_events.create({
        data: {
          id: 'test-process-success',
          eventId: 'evt_test_process_success',
          eventType: 'payment_intent.succeeded',
          payload: {
            id: 'evt_test_process_success',
            type: 'payment_intent.succeeded',
            data: {
              object: {
                id: 'pi_test',
                metadata: { orderId: 'order-123' },
              },
            },
          },
          status: 'pending',
          nextRetryAt: new Date(Date.now() - 1000), // Ready to process
        },
      });

      // Mock successful processing
      mockPaymentService.handleWebhookEvent.mockResolvedValueOnce(undefined);

      // Start worker and wait for processing
      worker.start();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for processing
      await worker.stop();

      // Verify event was processed
      const processedEvent = await prisma.stripe_webhook_events.findUnique({
        where: { id: event.id },
      });

      expect(processedEvent?.status).toBe('processed');
      expect(processedEvent?.processed).toBe(true);
      expect(processedEvent?.processedAt).toBeDefined();

      // Cleanup
      await prisma.stripe_webhook_events.delete({ where: { id: event.id } });
    });

    it('should retry failed webhook with exponential backoff', async () => {
      // Create event with previous failures
      const event = await prisma.stripe_webhook_events.create({
        data: {
          id: 'test-retry-backoff',
          eventId: 'evt_test_retry_backoff',
          eventType: 'payment_intent.succeeded',
          payload: {
            id: 'evt_test_retry_backoff',
            type: 'payment_intent.succeeded',
          },
          status: 'failed',
          retryCount: 2,
          nextRetryAt: new Date(Date.now() - 1000), // Ready to retry
          error: 'Previous error',
        },
      });

      // Mock another failure
      mockPaymentService.handleWebhookEvent.mockRejectedValueOnce(
        new Error('Transient error')
      );

      worker.start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await worker.stop();

      const retriedEvent = await prisma.stripe_webhook_events.findUnique({
        where: { id: event.id },
      });

      expect(retriedEvent?.retryCount).toBe(3);
      expect(retriedEvent?.status).toBe('failed');
      expect(retriedEvent?.nextRetryAt).toBeDefined();
      
      // Next retry should be in the future (exponential backoff)
      const nextRetryDelay = retriedEvent!.nextRetryAt.getTime() - Date.now();
      expect(nextRetryDelay).toBeGreaterThan(0);

      // Cleanup
      await prisma.stripe_webhook_events.delete({ where: { id: event.id } });
    });

    it('should move event to DLQ after max retries', async () => {
      // Create event at max retries
      const event = await prisma.stripe_webhook_events.create({
        data: {
          id: 'test-max-retries',
          eventId: 'evt_test_max_retries',
          eventType: 'payment_intent.succeeded',
          payload: {
            id: 'evt_test_max_retries',
            type: 'payment_intent.succeeded',
          },
          status: 'failed',
          retryCount: 4, // One away from max (5)
          maxRetries: 5,
          nextRetryAt: new Date(Date.now() - 1000),
        },
      });

      // Mock another failure
      mockPaymentService.handleWebhookEvent.mockRejectedValueOnce(
        new Error('Final failure')
      );

      worker.start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await worker.stop();

      const dlqEvent = await prisma.stripe_webhook_events.findUnique({
        where: { id: event.id },
      });

      expect(dlqEvent?.status).toBe('dead_letter');
      expect(dlqEvent?.retryCount).toBe(5);
      expect(dlqEvent?.error).toContain('Max retries exceeded');

      // Cleanup
      await prisma.stripe_webhook_events.delete({ where: { id: event.id } });
    });

    it('should move event to DLQ for permanent errors', async () => {
      // Create event
      const event = await prisma.stripe_webhook_events.create({
        data: {
          id: 'test-permanent-error',
          eventId: 'evt_test_permanent_error',
          eventType: 'payment_intent.succeeded',
          payload: {
            id: 'evt_test_permanent_error',
            type: 'payment_intent.succeeded',
          },
          status: 'pending',
          nextRetryAt: new Date(Date.now() - 1000),
        },
      });

      // Mock permanent error (signature verification)
      mockPaymentService.handleWebhookEvent.mockRejectedValueOnce(
        new Error('Webhook signature verification failed')
      );

      worker.start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await worker.stop();

      const dlqEvent = await prisma.stripe_webhook_events.findUnique({
        where: { id: event.id },
      });

      expect(dlqEvent?.status).toBe('dead_letter');
      expect(dlqEvent?.retryCount).toBe(1); // Only one attempt
      expect(dlqEvent?.error).toContain('permanent error');

      // Cleanup
      await prisma.stripe_webhook_events.delete({ where: { id: event.id } });
    });
  });

  describe('Priority Processing', () => {
    it('should process higher priority events first', async () => {
      const now = new Date(Date.now() - 1000);

      // Create events with different priorities
      await prisma.stripe_webhook_events.createMany({
        data: [
          {
            id: 'test-low-priority',
            eventId: 'evt_test_low_priority',
            eventType: 'payment_intent.canceled',
            payload: {},
            status: 'pending',
            priority: 1,
            nextRetryAt: now,
            createdAt: new Date(Date.now() - 3000),
          },
          {
            id: 'test-high-priority',
            eventId: 'evt_test_high_priority',
            eventType: 'payment_intent.succeeded',
            payload: {
              id: 'evt_test_high_priority',
              type: 'payment_intent.succeeded',
            },
            status: 'pending',
            priority: 10,
            nextRetryAt: now,
            createdAt: new Date(Date.now() - 1000), // Created later
          },
        ],
      });

      const processedOrder: string[] = [];
      mockPaymentService.handleWebhookEvent.mockImplementation(async (event: any) => {
        processedOrder.push(event.id);
      });

      worker.start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await worker.stop();

      // High priority should be processed first despite being created later
      expect(processedOrder[0]).toBe('evt_test_high_priority');

      // Cleanup
      await prisma.stripe_webhook_events.deleteMany({
        where: {
          id: { in: ['test-low-priority', 'test-high-priority'] },
        },
      });
    });
  });

  describe('Error History Tracking', () => {
    it('should maintain error history across retries', async () => {
      const event = await prisma.stripe_webhook_events.create({
        data: {
          id: 'test-error-history',
          eventId: 'evt_test_error_history',
          eventType: 'payment_intent.succeeded',
          payload: {
            id: 'evt_test_error_history',
            type: 'payment_intent.succeeded',
          },
          status: 'failed',
          retryCount: 1,
          maxRetries: 5,
          nextRetryAt: new Date(Date.now() - 1000),
          errorHistory: [
            {
              attempt: 1,
              error: 'First error',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      });

      mockPaymentService.handleWebhookEvent.mockRejectedValueOnce(
        new Error('Second error')
      );

      worker.start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await worker.stop();

      const updatedEvent = await prisma.stripe_webhook_events.findUnique({
        where: { id: event.id },
      });

      const errorHistory = updatedEvent?.errorHistory as any[];
      expect(errorHistory).toHaveLength(2);
      expect(errorHistory[0].error).toBe('First error');
      expect(errorHistory[1].error).toBe('Second error');
      expect(errorHistory[1].attempt).toBe(2);

      // Cleanup
      await prisma.stripe_webhook_events.delete({ where: { id: event.id } });
    });
  });

  describe('Event Type Configuration', () => {
    it('should use correct max retries for different event types', async () => {
      const events = await prisma.stripe_webhook_events.findMany({
        where: {
          eventType: { in: ['payment_intent.succeeded', 'payment_intent.payment_failed'] },
        },
        select: { eventType: true, maxRetries: true },
        take: 10,
      });

      // payment_intent.succeeded should have 5 retries
      const succeededEvents = events.filter(e => e.eventType === 'payment_intent.succeeded');
      if (succeededEvents.length > 0) {
        expect(succeededEvents.every(e => e.maxRetries === 5)).toBe(true);
      }

      // payment_intent.payment_failed should have 3 retries
      const failedEvents = events.filter(e => e.eventType === 'payment_intent.payment_failed');
      if (failedEvents.length > 0) {
        expect(failedEvents.every(e => e.maxRetries === 3)).toBe(true);
      }
    });
  });
});
