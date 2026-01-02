/*
  Warnings:

  - You are about to drop the column `zone` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "zone",
ADD COLUMN     "zones" TEXT[] DEFAULT ARRAY[]::TEXT[];
