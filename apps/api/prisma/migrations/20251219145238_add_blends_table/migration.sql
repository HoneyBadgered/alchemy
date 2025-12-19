-- CreateTable
CREATE TABLE "blends" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT,
    "sessionId" TEXT,
    "name" TEXT,
    "baseTeaId" TEXT NOT NULL,
    "addIns" JSONB NOT NULL,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blends_userId_idx" ON "blends"("userId");

-- CreateIndex
CREATE INDEX "blends_sessionId_idx" ON "blends"("sessionId");

-- CreateIndex
CREATE INDEX "blends_productId_idx" ON "blends"("productId");

-- AddForeignKey
ALTER TABLE "blends" ADD CONSTRAINT "blends_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blends" ADD CONSTRAINT "blends_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
