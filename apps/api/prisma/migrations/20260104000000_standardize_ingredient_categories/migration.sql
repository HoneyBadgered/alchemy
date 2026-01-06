-- Standardize ingredient categories to new 7-category system
-- Migration: Update ingredient.category values from legacy categories to standardized categories
-- Date: 2026-01-04

-- Update floral → flowers
UPDATE ingredients
SET category = 'flowers'
WHERE category IN ('floral');

-- Update herbal/herb → herbs
UPDATE ingredients
SET category = 'herbs'
WHERE category IN ('herbal', 'herb');

-- fruit stays as fruit (no change needed)

-- spice stays as spice (no change needed)

-- Update special → sweet, essence, or specialty based on ingredient type
-- Sweeteners (honey, vanilla, licorice, stevia, agave, etc.)
UPDATE ingredients
SET category = 'sweet'
WHERE category = 'special'
  AND (
    LOWER(name) LIKE '%honey%' OR
    LOWER(name) LIKE '%vanilla%' OR
    LOWER(name) LIKE '%licorice%' OR
    LOWER(name) LIKE '%stevia%' OR
    LOWER(name) LIKE '%agave%' OR
    LOWER(name) LIKE '%sugar%' OR
    LOWER(name) LIKE '%sweet%'
  );

-- Essences/Extracts (bergamot oil, rose extract, flavor oils, etc.)
UPDATE ingredients
SET category = 'essence'
WHERE category = 'special'
  AND (
    LOWER(name) LIKE '%extract%' OR
    LOWER(name) LIKE '%essence%' OR
    LOWER(name) LIKE '%oil%' OR
    LOWER(name) LIKE '%flavor%' OR
    LOWER(name) LIKE '%bergamot%'
  );

-- Everything else in 'special' → specialty (butterfly pea, matcha, charcoal, seasonal, functional ingredients)
UPDATE ingredients
SET category = 'specialty'
WHERE category = 'special';

-- Update tea/sweetener legacy categories
-- tea → base (if it's a base tea) or specialty (if it's an add-in tea like matcha)
UPDATE ingredients
SET category = CASE
  WHEN role = 'base' THEN 'base'
  ELSE 'specialty'
END
WHERE category = 'tea';

-- sweetener → sweet
UPDATE ingredients
SET category = 'sweet'
WHERE category = 'sweetener';

-- Verify the migration (optional - can be run separately)
-- SELECT category, COUNT(*) as count
-- FROM ingredients
-- GROUP BY category
-- ORDER BY category;
