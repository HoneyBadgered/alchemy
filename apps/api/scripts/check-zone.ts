import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkZone() {
  const zone = await prisma.zones.findFirst({
    where: { slug: 'hearthhouse' },
    select: { name: true, heroImageUrl: true, buttonImageUrl: true },
  });

  console.log('Hearthhouse zone:', JSON.stringify(zone, null, 2));
  await prisma.$disconnect();
}

checkZone().catch(console.error);
