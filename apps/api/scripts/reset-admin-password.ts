import { prisma } from '../src/utils/prisma';
import { hashPassword } from '../src/utils/password';

async function main() {
  // REDACTED: password reset logic removed for security
  // To reset the admin password, temporarily set newPassword and run this script, then remove it again.
  console.log('Password reset logic redacted.');
}

main().catch(console.error);
