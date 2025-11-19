/**
 * The Alchemy Table API Server
 */

import Fastify from 'fastify';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';

const fastify = Fastify({
  logger: config.isDevelopment,
});

// Register routes
fastify.register(authRoutes);

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
