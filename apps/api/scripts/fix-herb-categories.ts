/**
 * Move herb add-ins from flowers to herbs category
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌿 Moving herb add-ins to herbs category...\n');

  // List of herb ingredients that should be in herbs, not flowers
  const herbNames = [
    'Ginger (dried)',
    'Lemongrass',
    'Holy basil (tulsi)',
    'Sage',
    'Spearmint',
    'Peppermint',
    'Mint',
    'Basil',
    'Thyme',
    'Rosemary',
  ];

  const result = await prisma.ingredients.updateMany({
    where: {
      name: { in: herbNames },
      role: 'addIn',
      category: 'flowers',
    },
    data: {
      category: 'herbs',
    },
  });

  console.log(`✅ Moved ${result.count} herbs from flowers to herbs category`);

  // Show current distribution
  console.log('\n📊 Updated category distribution:\n');
  const ingredients = await prisma.ingredients.groupBy({
    by: ['category'],
    _count: true,
  });

  ingredients.sort((a, b) => a.category.localeCompare(b.category));
  ingredients.forEach(item => {
    console.log(`  ${item.category}: ${item._count}`);
  });

  console.log('\n✨ Done!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
