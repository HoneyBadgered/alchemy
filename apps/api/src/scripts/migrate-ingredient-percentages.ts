/**
 * Migration script to populate recommendedUsageMin and recommendedUsageMax
 * for ingredients based on their baseAmount values
 * 
 * Run with: npx tsx apps/api/src/scripts/migrate-ingredient-percentages.ts
 */

import { prisma } from '../utils/prisma';

const STANDARD_BLEND_SIZE = 2; // Assume 2oz as standard blend size

async function migrateIngredientPercentages() {
  console.log('Starting ingredient percentage migration...');

  try {
    // Find ingredients that have baseAmount but missing percentage fields
    const ingredientsToUpdate = await prisma.ingredients.findMany({
      where: {
        AND: [
          { baseAmount: { not: null } },
          { 
            OR: [
              { recommendedUsageMin: null },
              { recommendedUsageMax: null }
            ]
          }
        ]
      },
    });

    console.log(`Found ${ingredientsToUpdate.length} ingredients to update`);

    let updated = 0;
    let skipped = 0;

    for (const ingredient of ingredientsToUpdate) {
      const baseAmountOz = Number(ingredient.baseAmount);
      
      if (isNaN(baseAmountOz) || baseAmountOz <= 0) {
        console.warn(`Skipping ${ingredient.name} - invalid baseAmount: ${ingredient.baseAmount}`);
        skipped++;
        continue;
      }
      
      // Calculate as percentage of standard 2oz blend
      const basePercentage = (baseAmountOz / STANDARD_BLEND_SIZE) * 100;
      
      // Set range: 50% below to 150% above base amount
      // This provides flexibility while keeping reasonable bounds
      const minPercentage = Math.max(1, basePercentage * 0.5);
      const maxPercentage = Math.min(60, basePercentage * 1.5); // Cap at 60% (add-ins limit)
      
      await prisma.ingredients.update({
        where: { id: ingredient.id },
        data: {
          recommendedUsageMin: minPercentage,
          recommendedUsageMax: maxPercentage,
        },
      });

      console.log(`✓ Updated ${ingredient.name}: ${minPercentage.toFixed(2)}% - ${maxPercentage.toFixed(2)}%`);
      updated++;
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total processed: ${ingredientsToUpdate.length}`);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateIngredientPercentages()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
