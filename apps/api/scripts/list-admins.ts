import { prisma } from '../src/utils/prisma';

async function main() {
  const admins = await prisma.users.findMany({ where: { role: 'admin' } });
  if (admins.length === 0) {
    console.log('No admin users found.');
  } else {
    console.log('Admin users:');
    admins.forEach(a => {
      console.log(`- ${a.email} (${a.username})`);
    });
  }
  await prisma.$disconnect();
}

main().catch(console.error);