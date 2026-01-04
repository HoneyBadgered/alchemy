import { prisma } from './src/utils/prisma';
import bcrypt from 'bcryptjs';

async function testLogin() {
  const email = 'honeybadgeredhoney@gmail.com';
  const password = 'password123';
  
  console.log('🔍 Testing login for:', email);
  
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() }
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('✅ User found:', {
    id: user.id,
    email: user.email,
    username: user.username,
    emailVerified: user.emailVerified
  });
  
  const isValid = await bcrypt.compare(password, user.password);
  console.log('🔑 Password valid:', isValid);
  
  if (!isValid) {
    console.log('❌ Password does not match stored hash');
  }
  
  await prisma.$disconnect();
}

testLogin();
