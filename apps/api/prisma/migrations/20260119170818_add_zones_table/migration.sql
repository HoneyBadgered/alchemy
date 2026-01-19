-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "gradient" TEXT NOT NULL,
    "bgGradient" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "buttonImageUrl" TEXT,
    "defaultFilters" JSONB NOT NULL,
    "subTabs" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zones_name_key" ON "zones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "zones_slug_key" ON "zones"("slug");

-- CreateIndex
CREATE INDEX "zones_slug_idx" ON "zones"("slug");

-- CreateIndex
CREATE INDEX "zones_sortOrder_idx" ON "zones"("sortOrder");

-- CreateIndex
CREATE INDEX "zones_isActive_idx" ON "zones"("isActive");
