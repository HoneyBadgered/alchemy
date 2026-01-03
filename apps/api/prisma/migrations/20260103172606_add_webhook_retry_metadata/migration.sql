-- Add webhook retry metadata to stripe_webhook_events table
-- Enables custom retry logic with exponential backoff and dead letter queue

-- Add new columns with defaults
ALTER TABLE "stripe_webhook_events"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxRetries" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "errorHistory" JSONB,
  ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing records with appropriate status
UPDATE "stripe_webhook_events"
SET "status" = CASE
  WHEN "processed" = true THEN 'processed'
  WHEN "error" IS NOT NULL THEN 'failed'
  ELSE 'pending'
END,
"updatedAt" = CURRENT_TIMESTAMP;

-- Create composite index for worker query (critical for performance)
CREATE INDEX "stripe_webhook_events_status_nextRetryAt_idx" 
  ON "stripe_webhook_events"("status", "nextRetryAt");

-- Create index for admin queries
CREATE INDEX "stripe_webhook_events_createdAt_idx" 
  ON "stripe_webhook_events"("createdAt");

-- Create index for DLQ queries
CREATE INDEX "stripe_webhook_events_retryCount_idx" 
  ON "stripe_webhook_events"("retryCount");
