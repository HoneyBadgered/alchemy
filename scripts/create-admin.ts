import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  const email = 'admin@alchemy.dev';
  const plainPassword = 'Admin123!';
  const username = 'admin';

  console.log(`Checking for user ${email}...`);

  const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS);

  const upsert = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      role: 'admin',
      username,
      emailVerified: true,
    },
    create: {
      email,
      password: hashed,
      username,
      role: 'admin',
      emailVerified: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
        },
      },
      playerState: {
        create: {
          level: 99,
          xp: 0,
          totalXp: 999999,
        },
      },
      cosmetics: {
        create: {
          unlockedThemes: [],
          unlockedSkins: [],
        },
      },
    },
  });

  console.log(`Upsert complete. user id: ${upsert.id}, email: ${upsert.email}, role: ${upsert.role}`);
}

main()
  .catch((e) => {
    console.error('Error creating/updating admin:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });