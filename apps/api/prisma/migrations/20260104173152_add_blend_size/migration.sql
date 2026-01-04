-- AlterTable
ALTER TABLE "blends" ADD COLUMN     "size" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "stripe_webhook_events" ALTER COLUMN "updatedAt" DROP DEFAULT;
