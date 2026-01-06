import { prisma } from '../src/utils/prisma';

async function checkAdminUser() {
  try {
    const adminUsers = await prisma.users.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    console.log('\n=== Admin Users ===');
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
      console.log('\nTo create an admin user, run:');
      console.log('  npm run create-admin');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      adminUsers.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Username: ${user.username}`);
        console.log(`Email Verified: ${user.emailVerified}`);
        console.log(`Created: ${user.createdAt}`);
        console.log('---');
      });
    }
  } catch (error) {
    console.error('Error checking admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
