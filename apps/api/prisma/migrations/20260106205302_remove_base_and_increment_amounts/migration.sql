/*
  Warnings:

  - You are about to drop the column `baseAmount` on the `ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `incrementAmount` on the `ingredients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ingredients" DROP COLUMN "baseAmount",
DROP COLUMN "incrementAmount";
