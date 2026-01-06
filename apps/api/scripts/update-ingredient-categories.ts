/**
 * Script to update ingredient categories to the new 7-category system
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating ingredient categories...\n');

  // Map botanical → flowers
  const botanical = await prisma.ingredients.updateMany({
    where: { category: 'botanical' },
    data: { category: 'flowers' },
  });
  console.log(`✅ Updated ${botanical.count} botanical → flowers`);

  // Map extract → essence
  const extract = await prisma.ingredients.updateMany({
    where: { category: 'extract' },
    data: { category: 'essence' },
  });
  console.log(`✅ Updated ${extract.count} extract → essence`);

  // Map functional → specialty
  const functional = await prisma.ingredients.updateMany({
    where: { category: 'functional' },
    data: { category: 'specialty' },
  });
  console.log(`✅ Updated ${functional.count} functional → specialty`);

  // Map tea types to base (black, green, oolong, white)
  const teaTypes = await prisma.ingredients.updateMany({
    where: { 
      category: { in: ['black', 'green', 'oolong', 'white'] },
      role: 'base',
    },
    data: { category: 'base' },
  });
  console.log(`✅ Updated ${teaTypes.count} tea types → base`);

  // Map herb tisanes to base
  const herbTisanes = await prisma.ingredients.updateMany({
    where: { 
      category: 'herbs',
      role: 'base',
    },
    data: { category: 'base' },
  });
  console.log(`✅ Updated ${herbTisanes.count} herb tisanes → base`);

  console.log('\n📊 Checking new category distribution...\n');

  // Get updated counts
  const ingredients = await prisma.ingredients.groupBy({
    by: ['category'],
    _count: true,
  });

  ingredients.sort((a, b) => a.category.localeCompare(b.category));
  ingredients.forEach(item => {
    console.log(`  ${item.category}: ${item._count}`);
  });

  console.log('\n✨ Category update complete!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
