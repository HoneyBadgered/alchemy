-- AlterTable: Make userId nullable for guest orders
ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable: Add guestEmail and sessionId columns for guest checkout
ALTER TABLE "orders" ADD COLUMN "guestEmail" TEXT,
ADD COLUMN "sessionId" TEXT;

-- AlterTable: Make changedBy nullable for guest orders in status logs
ALTER TABLE "order_status_logs" ALTER COLUMN "changedBy" DROP NOT NULL;

-- Update foreign key constraint on order_status_logs to use SET NULL behavior
-- This matches Prisma's default behavior for nullable optional relations and preserves
-- order status history even when the user who made the change is deleted.
ALTER TABLE "order_status_logs" DROP CONSTRAINT "order_status_logs_changedBy_fkey";
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
