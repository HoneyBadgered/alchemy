/**
 * Script to check ingredient categories in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Checking ingredient categories...\n');

  // Get category distribution
  const ingredients = await prisma.ingredients.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      role: true,
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });

  console.log(`Total ingredients: ${ingredients.length}\n`);

  // Group by category
  const byCategory: Record<string, typeof ingredients> = {};
  ingredients.forEach(ing => {
    const cat = ing.category || 'null';
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat].push(ing);
  });

  // Display results
  Object.keys(byCategory).sort().forEach(category => {
    const items = byCategory[category];
    console.log(`\n${category} (${items.length}):`);
    items.forEach(item => {
      console.log(`  - ${item.name} (${item.role})`);
    });
  });

  console.log('\n\n📈 Category Summary:');
  Object.keys(byCategory).sort().forEach(category => {
    console.log(`  ${category}: ${byCategory[category].length}`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
