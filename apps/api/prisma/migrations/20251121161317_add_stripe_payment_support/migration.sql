-- AlterTable
ALTER TABLE "orders" ADD COLUMN "stripePaymentStatus" TEXT,
ADD COLUMN "stripeClientSecret" TEXT,
ALTER COLUMN "stripePaymentId" SET CONSTRAINT orders_stripePaymentId_unique;

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripePaymentId_key" ON "orders"("stripePaymentId");

-- CreateTable
CREATE TABLE "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stripe_webhook_events_eventId_key" ON "stripe_webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_eventType_idx" ON "stripe_webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "stripe_webhook_events_processed_idx" ON "stripe_webhook_events"("processed");
