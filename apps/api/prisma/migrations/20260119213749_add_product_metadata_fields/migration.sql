-- AlterTable
ALTER TABLE "products" ADD COLUMN     "caffeineLevel" TEXT,
ADD COLUMN     "flavorNotes" TEXT[] DEFAULT ARRAY[]::TEXT[];
