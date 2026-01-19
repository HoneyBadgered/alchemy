-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN     "ingredientKey" TEXT NOT NULL DEFAULT '';

-- Backfill ingredientKey with kebab-case version of name
UPDATE "ingredients"
SET "ingredientKey" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '_', 'g'
  )
);
