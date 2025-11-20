/**
 * Environment Configuration
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

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
});

export const env = envSchema.parse(process.env);

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
};
