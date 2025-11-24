/**
 * Environment Configuration
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load .env file if it exists (not required when running in Docker with environment variables)
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenv.config();
} else {
  // Only warn if .env file is missing - environment variables may be provided by Docker/system
  console.log('ℹ️  No .env file found, using environment variables from system/Docker');
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  APP_URL: z.string().default('http://localhost:3001'),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_SECURE: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@alchemytable.com'),
  AWS_REGION: z.string().optional(),
  AWS_SQS_QUEUE_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

// Parse environment variables with improved error handling
export let env: z.infer<typeof envSchema>;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('\n❌ Environment configuration error!\n');
    console.error('The following required environment variables are missing or invalid:\n');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    if (existsSync(envPath)) {
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      console.error('You can use .env.example as a reference.\n');
    } else {
      console.error('\nNo .env file found. For local development, create one:');
      console.error('  cp .env.example .env\n');
      console.error('Then edit .env with your configuration.');
      console.error('For Docker deployments, ensure environment variables are set in docker-compose.yml\n');
    }
    process.exit(1);
  }
  throw error;
}

export const config = {
  port: parseInt(env.PORT, 10),
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: '1h',
    refreshExpiresIn: '7d',
  },
  app: {
    url: env.APP_URL,
  },
  email: {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT ? parseInt(env.EMAIL_PORT, 10) : undefined,
    secure: env.EMAIL_SECURE === 'true',
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
    from: env.EMAIL_FROM,
  },
  aws: {
    region: env.AWS_REGION || 'us-east-1',
    sqsQueueUrl: env.AWS_SQS_QUEUE_URL,
  },
  stripeSecretKey: env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
};
