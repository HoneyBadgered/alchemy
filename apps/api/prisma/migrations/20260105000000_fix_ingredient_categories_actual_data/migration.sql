-- Update ingredient categories to match the 7-category display system
-- Based on actual database structure (not seed data)
-- Date: 2026-01-05

-- Map botanical → flowers
UPDATE ingredients
SET category = 'flowers'
WHERE category = 'botanical';

-- Map extract → essence
UPDATE ingredients
SET category = 'essence'
WHERE category = 'extract';

-- Map functional → specialty
UPDATE ingredients
SET category = 'specialty'
WHERE category = 'functional';

-- Keep these as-is (already match new system):
-- fruit → fruit
-- spice → spice
-- sweet → sweet
-- specialty → specialty

-- Handle tea type categories (black, green, oolong, white)
-- These should stay as base teas but we need a 'base' category
UPDATE ingredients
SET category = 'base'
WHERE category IN ('black', 'green', 'oolong', 'white')
  AND role = 'base';

-- Handle herbs category
-- If it's a base tisane, mark as 'base'
-- If it's an add-in herb, keep as 'herbs'
UPDATE ingredients
SET category = 'base'
WHERE category = 'herbs'
  AND role = 'base';

-- Herbs that are add-ins should stay as 'herbs'
-- (This should already be correct, but ensuring it)
UPDATE ingredients
SET category = 'herbs'
WHERE category = 'herbs'
  AND role = 'addIn';

-- Verify the changes
-- SELECT category, COUNT(*) as count, role
-- FROM ingredients
-- GROUP BY category, role
-- ORDER BY category, role;
