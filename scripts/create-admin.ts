import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  const email = 'admin@alchemy.dev';
  const plainPassword = 'Admin123!';
  const username = 'admin';

  console.log(`Checking for user ${email}...`);

  const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS);

  // Check if user exists
  const existingUser = await prisma.users.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('Admin user already exists. Updating password and role...');
    await prisma.users.update({
      where: { email },
      data: {
        password: hashed,
        role: 'admin',
        username,
        emailVerified: true,
      },
    });
    console.log('✅ Admin user updated successfully');
  } else {
    console.log('Creating new admin user...');
    const userId = crypto.randomUUID();
    await prisma.users.create({
      data: {
        id: userId,
        email,
        password: hashed,
        username,
        role: 'admin',
        emailVerified: true,
        updatedAt: new Date(),
        user_profiles: {
          create: {
            id: crypto.randomUUID(),
            firstName: 'Admin',
            lastName: 'User',
            updatedAt: new Date(),
          },
        },
        player_states: {
          create: {
            id: crypto.randomUUID(),
            level: 99,
            xp: 0,
            totalXp: 999999,
            updatedAt: new Date(),
          },
        },
        player_cosmetics: {
          create: {
            id: crypto.randomUUID(),
            unlockedThemes: [],
            unlockedSkins: [],
            updatedAt: new Date(),
          },
        },
      },
    });
    console.log('✅ Admin user created successfully');
  }

  console.log('\n=== Admin Credentials ===');
  console.log(`Email: ${email}`);
  console.log(`Password: ${plainPassword}`);
  console.log('========================\n');
}

main()
  .catch((e) => {
    console.error('Error creating admin user:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });