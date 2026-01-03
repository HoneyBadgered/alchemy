#!/usr/bin/env tsx
/**
 * JWT Secret Rotation Utility
 * 
 * Provides CLI commands for managing JWT secret rotation:
 * - Generate new secrets
 * - Validate current configuration
 * - List active key versions
 * - Emergency rotation (force logout all users)
 * 
 * Usage:
 *   npx tsx scripts/rotate-jwt-secret.ts generate
 *   npx tsx scripts/rotate-jwt-secret.ts validate
 *   npx tsx scripts/rotate-jwt-secret.ts list
 *   npx tsx scripts/rotate-jwt-secret.ts emergency-rotate --force
 */

import { generateJwtSecret } from '../src/utils/jwt-keys';
import { config, jwtKeyManager } from '../src/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

/**
 * Generate new JWT secrets
 */
async function generateSecrets() {
  console.log(colorize('\n🔐 JWT Secret Generator\n', 'bright'));
  
  const accessSecret = generateJwtSecret();
  const refreshSecret = generateJwtSecret();
  
  console.log(colorize('New Access Token Secret:', 'cyan'));
  console.log(`  ${accessSecret}\n`);
  
  console.log(colorize('New Refresh Token Secret:', 'cyan'));
  console.log(`  ${refreshSecret}\n`);
  
  console.log(colorize('Next Steps:', 'yellow'));
  console.log('1. Add these secrets to your environment variables:');
  
  const currentAccessVersion = config.jwt.currentAccessVersion;
  const currentRefreshVersion = config.jwt.currentRefreshVersion;
  const nextAccessVersion = currentAccessVersion + 1;
  const nextRefreshVersion = currentRefreshVersion + 1;
  
  console.log(colorize(`\n   # Keep existing secrets active during migration`, 'blue'));
  console.log(`   JWT_ACCESS_SECRET_V${currentAccessVersion}=<your-current-access-secret>`);
  console.log(`   JWT_REFRESH_SECRET_V${currentRefreshVersion}=<your-current-refresh-secret>`);
  
  console.log(colorize(`\n   # Add new secrets`, 'green'));
  console.log(`   JWT_ACCESS_SECRET_V${nextAccessVersion}=${accessSecret}`);
  console.log(`   JWT_REFRESH_SECRET_V${nextRefreshVersion}=${refreshSecret}`);
  
  console.log(colorize(`\n   # Update current versions to use new secrets`, 'green'));
  console.log(`   JWT_CURRENT_ACCESS_VERSION=${nextAccessVersion}`);
  console.log(`   JWT_CURRENT_REFRESH_VERSION=${nextRefreshVersion}`);
  
  console.log(colorize('\n2. Restart your API server', 'yellow'));
  console.log(colorize('3. Monitor for errors (old tokens will still work)', 'yellow'));
  console.log(colorize('4. After all tokens have expired/refreshed, remove old secrets', 'yellow'));
  console.log(colorize(`   - Access tokens expire in: ${config.jwt.expiresIn}`, 'blue'));
  console.log(colorize(`   - Refresh tokens expire in: ${config.jwt.refreshExpiresIn}`, 'blue'));
  
  console.log(colorize('\n⚠️  IMPORTANT: Store these secrets securely!', 'red'));
  console.log(colorize('   Never commit secrets to version control.\n', 'red'));
}

/**
 * Validate current JWT configuration
 */
async function validateConfiguration() {
  console.log(colorize('\n✓ JWT Configuration Validator\n', 'bright'));
  
  const currentVersions = jwtKeyManager.getCurrentVersions();
  const activeAccessVersions = jwtKeyManager.getActiveAccessVersions();
  const activeRefreshVersions = jwtKeyManager.getActiveRefreshVersions();
  
  console.log(colorize('Current Configuration:', 'cyan'));
  console.log(`  Current Access Version:  v${currentVersions.access}`);
  console.log(`  Current Refresh Version: v${currentVersions.refresh}`);
  console.log(`  Active Access Versions:  ${activeAccessVersions.map(v => `v${v}`).join(', ')}`);
  console.log(`  Active Refresh Versions: ${activeRefreshVersions.map(v => `v${v}`).join(', ')}`);
  
  console.log(colorize('\nToken Expiration:', 'cyan'));
  console.log(`  Access Token:  ${config.jwt.expiresIn}`);
  console.log(`  Refresh Token: ${config.jwt.refreshExpiresIn}`);
  
  // Check for issues
  const issues: string[] = [];
  
  if (activeAccessVersions.length > 2) {
    issues.push(`Too many active access token versions (${activeAccessVersions.length}). Remove old versions.`);
  }
  
  if (activeRefreshVersions.length > 2) {
    issues.push(`Too many active refresh token versions (${activeRefreshVersions.length}). Remove old versions.`);
  }
  
  // Check if using legacy secrets in production
  if (config.isProduction) {
    const usingLegacySecrets = !process.env.JWT_ACCESS_SECRET_V1 && !process.env.JWT_REFRESH_SECRET_V1;
    if (usingLegacySecrets) {
      issues.push('Using legacy JWT_SECRET in production. Migrate to versioned secrets.');
    }
    
    if (config.jwt.secret === 'dev-secret-key-change-in-production') {
      issues.push('CRITICAL: Using default development secret in production!');
    }
  }
  
  if (issues.length > 0) {
    console.log(colorize('\n⚠️  Issues Found:', 'red'));
    issues.forEach(issue => {
      console.log(`  ${colorize('✗', 'red')} ${issue}`);
    });
    console.log();
    process.exit(1);
  } else {
    console.log(colorize('\n✓ Configuration is valid\n', 'green'));
  }
}

/**
 * List active key versions and their status
 */
async function listKeys() {
  console.log(colorize('\n🔑 Active JWT Key Versions\n', 'bright'));
  
  const currentVersions = jwtKeyManager.getCurrentVersions();
  const activeAccessVersions = jwtKeyManager.getActiveAccessVersions();
  const activeRefreshVersions = jwtKeyManager.getActiveRefreshVersions();
  
  console.log(colorize('Access Token Keys:', 'cyan'));
  activeAccessVersions.forEach(version => {
    const isCurrent = version === currentVersions.access;
    const status = isCurrent ? colorize('CURRENT (signing)', 'green') : colorize('LEGACY (verify only)', 'yellow');
    console.log(`  v${version} - ${status}`);
  });
  
  console.log(colorize('\nRefresh Token Keys:', 'cyan'));
  activeRefreshVersions.forEach(version => {
    const isCurrent = version === currentVersions.refresh;
    const status = isCurrent ? colorize('CURRENT (signing)', 'green') : colorize('LEGACY (verify only)', 'yellow');
    console.log(`  v${version} - ${status}`);
  });
  
  console.log(colorize('\nRotation Status:', 'cyan'));
  if (activeAccessVersions.length === 1 && activeRefreshVersions.length === 1) {
    console.log('  No rotation in progress');
  } else {
    console.log(`  ${colorize('Rotation in progress', 'yellow')}`);
    console.log(`  Legacy keys can be removed after token expiration:`);
    console.log(`    Access tokens:  ${config.jwt.expiresIn}`);
    console.log(`    Refresh tokens: ${config.jwt.refreshExpiresIn}`);
  }
  
  console.log();
}

/**
 * Emergency rotation - force logout all users
 */
async function emergencyRotate(force: boolean = false) {
  console.log(colorize('\n🚨 EMERGENCY JWT SECRET ROTATION\n', 'red'));
  
  if (!force) {
    console.log(colorize('This will immediately invalidate ALL user sessions!', 'red'));
    console.log(colorize('All users will be logged out and must log in again.\n', 'red'));
    console.log('To proceed, run with --force flag:');
    console.log(colorize('  npx tsx scripts/rotate-jwt-secret.ts emergency-rotate --force\n', 'yellow'));
    return;
  }
  
  console.log(colorize('Step 1: Counting active sessions...', 'yellow'));
  const refreshTokenCount = await prisma.refresh_tokens.count();
  console.log(`  Found ${refreshTokenCount} active refresh tokens\n`);
  
  console.log(colorize('Step 2: Invalidating all refresh tokens...', 'yellow'));
  await prisma.refresh_tokens.deleteMany({});
  console.log(colorize('  ✓ All refresh tokens deleted\n', 'green'));
  
  console.log(colorize('Step 3: Generate new secrets...', 'yellow'));
  const accessSecret = generateJwtSecret();
  const refreshSecret = generateJwtSecret();
  console.log(colorize('  ✓ New secrets generated\n', 'green'));
  
  const nextAccessVersion = config.jwt.currentAccessVersion + 1;
  const nextRefreshVersion = config.jwt.currentRefreshVersion + 1;
  
  console.log(colorize('Step 4: Update environment variables:', 'yellow'));
  console.log(colorize('\n   # REMOVE old secrets completely', 'red'));
  console.log(`   # JWT_ACCESS_SECRET_V${config.jwt.currentAccessVersion}`);
  console.log(`   # JWT_REFRESH_SECRET_V${config.jwt.currentRefreshVersion}`);
  
  console.log(colorize(`\n   # ADD new secrets`, 'green'));
  console.log(`   JWT_ACCESS_SECRET_V${nextAccessVersion}=${accessSecret}`);
  console.log(`   JWT_REFRESH_SECRET_V${nextRefreshVersion}=${refreshSecret}`);
  console.log(`   JWT_CURRENT_ACCESS_VERSION=${nextAccessVersion}`);
  console.log(`   JWT_CURRENT_REFRESH_VERSION=${nextRefreshVersion}`);
  
  console.log(colorize('\nStep 5: Restart your API server immediately', 'red'));
  console.log(colorize('Step 6: Notify users about the security incident\n', 'red'));
  
  console.log(colorize('⚠️  SECURITY REMINDER:', 'red'));
  console.log('  - Investigate how the secret was compromised');
  console.log('  - Review access logs for suspicious activity');
  console.log('  - Update secret management procedures');
  console.log('  - Consider implementing secret rotation automation\n');
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const flags = args.slice(1);
  
  try {
    switch (command) {
      case 'generate':
        await generateSecrets();
        break;
        
      case 'validate':
        await validateConfiguration();
        break;
        
      case 'list':
        await listKeys();
        break;
        
      case 'emergency-rotate':
        const force = flags.includes('--force');
        await emergencyRotate(force);
        break;
        
      default:
        console.log(colorize('\n🔐 JWT Secret Rotation Utility\n', 'bright'));
        console.log('Available commands:');
        console.log(colorize('  generate', 'cyan') + '           Generate new JWT secrets');
        console.log(colorize('  validate', 'cyan') + '           Validate current configuration');
        console.log(colorize('  list', 'cyan') + '               List active key versions');
        console.log(colorize('  emergency-rotate', 'cyan') + '   Force rotation (logout all users)');
        console.log('\nExamples:');
        console.log('  npx tsx scripts/rotate-jwt-secret.ts generate');
        console.log('  npx tsx scripts/rotate-jwt-secret.ts validate');
        console.log('  npx tsx scripts/rotate-jwt-secret.ts list');
        console.log('  npx tsx scripts/rotate-jwt-secret.ts emergency-rotate --force\n');
    }
  } catch (error) {
    console.error(colorize('\n❌ Error:', 'red'), (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
