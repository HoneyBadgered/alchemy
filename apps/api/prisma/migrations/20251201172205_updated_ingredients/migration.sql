-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_productId_fkey";

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'addIn',
    "category" TEXT NOT NULL,
    "descriptionShort" TEXT,
    "descriptionLong" TEXT,
    "image" TEXT,
    "flavorNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cutOrGrade" TEXT,
    "recommendedUsageMin" DECIMAL(10,4),
    "recommendedUsageMax" DECIMAL(10,4),
    "steepTemperature" INTEGER,
    "steepTimeMin" INTEGER,
    "steepTimeMax" INTEGER,
    "brewNotes" TEXT,
    "supplierId" TEXT,
    "costPerOunce" DECIMAL(10,4),
    "costPerGram" DECIMAL(10,4),
    "inventoryAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "minimumStockLevel" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "caffeineLevel" TEXT NOT NULL DEFAULT 'none',
    "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "internalNotes" TEXT,
    "emoji" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "baseAmount" DECIMAL(10,2),
    "incrementAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_pairings" (
    "id" TEXT NOT NULL,
    "sourceIngredientId" TEXT NOT NULL,
    "targetIngredientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_pairings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ingredients_category_idx" ON "ingredients"("category");

-- CreateIndex
CREATE INDEX "ingredients_status_idx" ON "ingredients"("status");

-- CreateIndex
CREATE INDEX "ingredients_supplierId_idx" ON "ingredients"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_pairings_sourceIngredientId_targetIngredientId_key" ON "ingredient_pairings"("sourceIngredientId", "targetIngredientId");

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_pairings" ADD CONSTRAINT "ingredient_pairings_sourceIngredientId_fkey" FOREIGN KEY ("sourceIngredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_pairings" ADD CONSTRAINT "ingredient_pairings_targetIngredientId_fkey" FOREIGN KEY ("targetIngredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
