import { prisma } from './src/utils/prisma';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  const email = 'honeybadgeredhoney@gmail.com';
  const newPassword = 'password123';
  
  const user = await prisma.users.findUnique({ where: { email } });
  
  if (!user) {
    console.log('❌ User not found with email:', email);
    console.log('\nAvailable users:');
    const users = await prisma.users.findMany({ select: { email: true, username: true } });
    console.log(users);
  } else {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { email },
      data: { 
        password: hashedPassword,
        emailVerified: true,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });
    console.log('✅ Password reset successfully for:', email);
    console.log('📧 Email:', email);
    console.log('🔑 New password:', newPassword);
  }
  
  await prisma.$disconnect();
}

resetPassword();
