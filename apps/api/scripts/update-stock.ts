import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateStock() {
  const result = await prisma.products.updateMany({
    where: {
      category: 'Custom Blends',
      stock: 0,
    },
    data: {
      stock: 100,
    },
  });

  console.log('Updated', result.count, 'products to have stock: 100');

  const products = await prisma.products.findMany({
    where: { category: 'Custom Blends' },
    select: { name: true, stock: true, zones: true, flavorNotes: true, caffeineLevel: true },
    orderBy: { name: 'asc' },
  });

  console.log('\nProducts after update:');
  products.forEach((p) => {
    console.log(
      `- ${p.name}: stock=${p.stock}, zones=${p.zones.length}, flavors=${p.flavorNotes?.length || 0}, caffeine=${p.caffeineLevel || 'null'}`
    );
  });

  await prisma.$disconnect();
}

updateStock().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
