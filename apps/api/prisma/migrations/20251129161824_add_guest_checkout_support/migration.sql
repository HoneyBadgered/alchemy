-- AlterTable: Make userId nullable for guest orders
ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable: Add guestEmail and sessionId columns for guest checkout
ALTER TABLE "orders" ADD COLUMN "guestEmail" TEXT,
ADD COLUMN "sessionId" TEXT;

-- AlterTable: Make changedBy nullable for guest orders in status logs
ALTER TABLE "order_status_logs" ALTER COLUMN "changedBy" DROP NOT NULL;

-- Update foreign key constraint on order_status_logs to allow null changedBy
ALTER TABLE "order_status_logs" DROP CONSTRAINT "order_status_logs_changedBy_fkey";
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update foreign key constraint on orders to allow null userId
ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
