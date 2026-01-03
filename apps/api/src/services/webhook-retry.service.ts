/**
 * Webhook Retry Worker Service
 * 
 * Background worker that processes failed webhook events with exponential backoff.
 * Implements:
 * - Polling-based queue system (no external dependencies)
 * - Exponential backoff retry strategy
 * - Dead letter queue for permanently failed events
 * - Concurrency control for multi-instance deployments
 * - Graceful shutdown handling
 * 
 * Retry Schedule:
 * - Attempt 1: Immediate
 * - Attempt 2: 1 minute
 * - Attempt 3: 5 minutes
 * - Attempt 4: 15 minutes
 * - Attempt 5: 1 hour
 * - Attempt 6: 6 hours
 * - After 6 attempts: Dead letter queue
 */

import { prisma } from '../utils/prisma';
import { PaymentService } from './payment.service';
import { Prisma } from '@prisma/client';
import type Stripe from 'stripe';

/**
 * Webhook retry worker configuration
 */
interface WorkerConfig {
  pollingInterval: number;        // Milliseconds between worker cycles (default: 30000 = 30s)
  batchSize: number;              // Max events to process per cycle (default: 10)
  enableConcurrencyLock: boolean; // Use FOR UPDATE SKIP LOCKED for multi-instance (default: true)
  maxProcessingTime: number;      // Timeout for processing single event in ms (default: 60000 = 60s)
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: WorkerConfig = {
  pollingInterval: 30000,  // 30 seconds
  batchSize: 10,
  enableConcurrencyLock: true,
  maxProcessingTime: 60000, // 60 seconds
};

/**
 * Exponential backoff delays in seconds
 * Index corresponds to retry attempt number
 */
const RETRY_DELAYS_SECONDS = [
  0,      // Attempt 1: Immediate
  60,     // Attempt 2: 1 minute
  300,    // Attempt 3: 5 minutes
  900,    // Attempt 4: 15 minutes
  3600,   // Attempt 5: 1 hour
  21600,  // Attempt 6: 6 hours
];

/**
 * Maximum retry attempts by event type
 */
const MAX_RETRIES_BY_TYPE: Record<string, number> = {
  'payment_intent.succeeded': 5,
  'payment_intent.payment_failed': 3,
  'payment_intent.processing': 5,
  'payment_intent.canceled': 3,
  'charge.succeeded': 5,
  'default': 5,
};

/**
 * Webhook Retry Worker
 * 
 * Polls database for failed webhook events and retries them with exponential backoff
 */
export class WebhookRetryWorker {
  private config: WorkerConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private paymentService: PaymentService;
  private isShuttingDown: boolean = false;

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.paymentService = new PaymentService();
  }

  /**
   * Start the worker
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Webhook retry worker is already running');
      return;
    }

    console.log('Starting webhook retry worker...', {
      pollingInterval: this.config.pollingInterval,
      batchSize: this.config.batchSize,
      enableConcurrencyLock: this.config.enableConcurrencyLock,
    });

    this.isRunning = true;
    this.isShuttingDown = false;

    // Start polling loop
    this.intervalId = setInterval(() => {
      this.processRetryQueue().catch((error) => {
        console.error('Error in webhook retry worker cycle:', error);
      });
    }, this.config.pollingInterval);

    // Allow process to exit if this is the only thing running
    if (this.intervalId) {
      this.intervalId.unref();
    }

    // Run first cycle immediately
    this.processRetryQueue().catch((error) => {
      console.error('Error in initial webhook retry worker cycle:', error);
    });

    console.log('Webhook retry worker started successfully');
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping webhook retry worker...');
    this.isShuttingDown = true;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('Webhook retry worker stopped');
  }

  /**
   * Main processing loop - queries for events ready to retry
   */
  private async processRetryQueue(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    try {
      // Query for events ready to retry
      const events = await this.findEventsToRetry();

      if (events.length === 0) {
        return;
      }

      console.log(`Found ${events.length} webhook events ready for retry`);

      // Process events sequentially to avoid overwhelming the system
      for (const event of events) {
        if (this.isShuttingDown) {
          console.log('Shutting down, stopping event processing');
          break;
        }

        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Error querying retry queue:', error);
    }
  }

  /**
   * Find webhook events that are ready to retry
   * Uses FOR UPDATE SKIP LOCKED for concurrency control in multi-instance deployments
   */
  private async findEventsToRetry(): Promise<any[]> {
    const now = new Date();

    if (this.config.enableConcurrencyLock) {
      // Use raw SQL for FOR UPDATE SKIP LOCKED
      // This prevents multiple workers from processing the same events
      const events = await prisma.$queryRaw<any[]>`
        SELECT *
        FROM "stripe_webhook_events"
        WHERE "status" IN ('pending', 'failed')
          AND "nextRetryAt" <= ${now}
          AND "retryCount" < "maxRetries"
        ORDER BY "priority" DESC, "createdAt" ASC
        LIMIT ${this.config.batchSize}
        FOR UPDATE SKIP LOCKED
      `;
      return events;
    } else {
      // Simple query without locking (single-instance deployment)
      return await prisma.stripe_webhook_events.findMany({
        where: {
          status: { in: ['pending', 'failed'] },
          nextRetryAt: { lte: now },
          retryCount: { lt: prisma.stripe_webhook_events.fields.maxRetries },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        take: this.config.batchSize,
      });
    }
  }

  /**
   * Process a single webhook event
   */
  private async processEvent(event: any): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`Processing webhook event ${event.eventId} (attempt ${event.retryCount + 1}/${event.maxRetries})`, {
        eventType: event.eventType,
        retryCount: event.retryCount,
        lastError: event.error,
      });

      // Mark as processing
      await prisma.stripe_webhook_events.update({
        where: { id: event.id },
        data: {
          status: 'processing',
          lastAttemptAt: new Date(),
        },
      });

      // Reconstruct Stripe event from payload
      const stripeEvent = event.payload as Stripe.Event;

      // Process the event with timeout
      const processingPromise = this.paymentService.handleWebhookEvent(stripeEvent);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Processing timeout')), this.config.maxProcessingTime)
      );

      await Promise.race([processingPromise, timeoutPromise]);

      // Success! Mark as processed
      await prisma.stripe_webhook_events.update({
        where: { id: event.id },
        data: {
          status: 'processed',
          processed: true, // Backwards compatibility
          processedAt: new Date(),
          error: null,
        },
      });

      const duration = Date.now() - startTime;
      console.log(`Successfully processed webhook event ${event.eventId} in ${duration}ms`);
    } catch (error) {
      await this.handleProcessingError(event, error);
    }
  }

  /**
   * Handle processing error and determine retry strategy
   */
  private async handleProcessingError(event: any, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const newRetryCount = event.retryCount + 1;

    console.error(`Webhook event ${event.eventId} processing failed (attempt ${newRetryCount}/${event.maxRetries}):`, errorMessage);

    // Build error history
    const errorHistory = Array.isArray(event.errorHistory) ? event.errorHistory : [];
    errorHistory.push({
      attempt: newRetryCount,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    // Determine if this is a permanent error or if we should retry
    const isPermanentError = this.isPermanentError(error, errorMessage);
    const shouldMoveToDLQ = newRetryCount >= event.maxRetries || isPermanentError;

    if (shouldMoveToDLQ) {
      // Move to dead letter queue
      await prisma.stripe_webhook_events.update({
        where: { id: event.id },
        data: {
          status: 'dead_letter',
          error: `Max retries exceeded or permanent error: ${errorMessage}`,
          errorHistory: errorHistory as Prisma.InputJsonValue,
          retryCount: newRetryCount,
          lastAttemptAt: new Date(),
        },
      });

      console.error(`Webhook event ${event.eventId} moved to dead letter queue`, {
        reason: isPermanentError ? 'permanent_error' : 'max_retries_exceeded',
        totalAttempts: newRetryCount,
      });
    } else {
      // Calculate next retry time with exponential backoff
      const nextRetryAt = this.calculateNextRetryTime(newRetryCount);

      await prisma.stripe_webhook_events.update({
        where: { id: event.id },
        data: {
          status: 'failed',
          error: errorMessage,
          errorHistory: errorHistory as Prisma.InputJsonValue,
          retryCount: newRetryCount,
          nextRetryAt,
          lastAttemptAt: new Date(),
        },
      });

      console.log(`Webhook event ${event.eventId} scheduled for retry at ${nextRetryAt.toISOString()}`);
    }
  }

  /**
   * Calculate next retry time using exponential backoff
   */
  private calculateNextRetryTime(retryCount: number): Date {
    const delaySeconds = RETRY_DELAYS_SECONDS[Math.min(retryCount, RETRY_DELAYS_SECONDS.length - 1)];
    const delayMs = delaySeconds * 1000;
    return new Date(Date.now() + delayMs);
  }

  /**
   * Determine if an error is permanent (non-retryable)
   */
  private isPermanentError(error: any, errorMessage: string): boolean {
    // Signature verification failures
    if (errorMessage.includes('signature') || errorMessage.includes('verification failed')) {
      return true;
    }

    // Invalid payload
    if (errorMessage.includes('Invalid') && errorMessage.includes('payload')) {
      return true;
    }

    // Missing required data
    if (errorMessage.includes('required') && errorMessage.includes('missing')) {
      return true;
    }

    // Order not found after extended period (> 1 hour old event)
    // (Temporary order not found is retryable for first hour)

    return false;
  }

  /**
   * Get max retries for event type
   */
  private getMaxRetries(eventType: string): number {
    return MAX_RETRIES_BY_TYPE[eventType] || MAX_RETRIES_BY_TYPE['default'];
  }

  /**
   * Health check - returns worker status
   */
  getStatus(): {
    isRunning: boolean;
    isShuttingDown: boolean;
    pollingInterval: number;
    batchSize: number;
  } {
    return {
      isRunning: this.isRunning,
      isShuttingDown: this.isShuttingDown,
      pollingInterval: this.config.pollingInterval,
      batchSize: this.config.batchSize,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    deadLetter: number;
    processed24h: number;
  }> {
    const [pending, processing, failed, deadLetter, processed24h] = await Promise.all([
      prisma.stripe_webhook_events.count({ where: { status: 'pending' } }),
      prisma.stripe_webhook_events.count({ where: { status: 'processing' } }),
      prisma.stripe_webhook_events.count({ where: { status: 'failed' } }),
      prisma.stripe_webhook_events.count({ where: { status: 'dead_letter' } }),
      prisma.stripe_webhook_events.count({
        where: {
          status: 'processed',
          processedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      pending,
      processing,
      failed,
      deadLetter,
      processed24h,
    };
  }
}
