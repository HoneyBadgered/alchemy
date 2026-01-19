import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('Finding duplicate blend products...');
  
  // Get all Custom Blends
  const products = await prisma.products.findMany({
    where: { category: 'Custom Blends' },
    orderBy: [
      { name: 'asc' },
      { createdAt: 'desc' }, // Most recent first
    ],
    include: {
      product_variants: true,
      blends: true,
    },
  });

  // Group by name
  const grouped = new Map<string, typeof products>();
  for (const product of products) {
    if (!grouped.has(product.name)) {
      grouped.set(product.name, []);
    }
    grouped.get(product.name)!.push(product);
  }

  // Find duplicates
  const duplicates = Array.from(grouped.entries()).filter(([_, prods]) => prods.length > 1);

  if (duplicates.length === 0) {
    console.log('No duplicates found!');
    return;
  }

  console.log(`Found ${duplicates.length} product names with duplicates:\n`);

  let totalDeleted = 0;

  for (const [name, prods] of duplicates) {
    console.log(`${name}: ${prods.length} copies`);
    
    // Keep the most recent one (first in array due to sorting)
    const [keep, ...remove] = prods;
    
    console.log(`  Keeping: ${keep.id} (created ${keep.createdAt.toISOString()})`);
    console.log(`  Deleting: ${remove.length} older copies`);

    // Delete older copies
    for (const product of remove) {
      console.log(`    - ${product.id} (created ${product.createdAt.toISOString()})`);
      
      // Delete related records first
      await prisma.product_variants.deleteMany({
        where: { productId: product.id },
      });
      
      await prisma.blends.deleteMany({
        where: { productId: product.id },
      });
      
      await prisma.products.delete({
        where: { id: product.id },
      });
      
      totalDeleted++;
    }
    console.log();
  }

  console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate products.`);
}

cleanupDuplicates()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
