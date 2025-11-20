/**
 * The Alchemy Table API Server
 */

import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { catalogRoutes } from './routes/catalog.routes';
import { craftingRoutes } from './routes/crafting.routes';
import { gamificationRoutes } from './routes/gamification.routes';
import { cosmeticsRoutes } from './routes/cosmetics.routes';
import { labelsRoutes } from './routes/labels.routes';

const fastify = Fastify({
  logger: config.isDevelopment,
});

// Register rate limiting
fastify.register(rateLimit, {
  max: 100, // 100 requests
  timeWindow: '15 minutes',
  cache: 10000,
  allowList: ['127.0.0.1'], // Whitelist localhost in development
});

// Register routes
fastify.register(authRoutes);
fastify.register(catalogRoutes);
fastify.register(craftingRoutes);
fastify.register(gamificationRoutes);
fastify.register(cosmeticsRoutes);
fastify.register(labelsRoutes);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
async function start() {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🧪 Alchemy Table API running on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
