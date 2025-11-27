/**
 * The Alchemy Table API Server
 */

import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rawBody from 'fastify-raw-body';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { catalogRoutes } from './routes/catalog.routes';
import { cartRoutes } from './routes/cart.routes';
import { orderRoutes } from './routes/order.routes';
import { paymentRoutes } from './routes/payment.routes';
import { craftingRoutes } from './routes/crafting.routes';
import { gamificationRoutes } from './routes/gamification.routes';
import { cosmeticsRoutes } from './routes/cosmetics.routes';
import { labelsRoutes } from './routes/labels.routes';
import { adminProductRoutes } from './routes/admin-product.routes';
import { adminOrderRoutes } from './routes/admin-order.routes';
import { adminThemeRoutes } from './routes/admin-theme.routes';
import { adminSettingsRoutes } from './routes/admin-settings.routes';
import { adminDashboardRoutes } from './routes/admin-dashboard.routes';
import { adminIngredientRoutes } from './routes/admin-ingredient.routes';
import { reviewsRoutes } from './routes/reviews.routes';
import { wishlistRoutes } from './routes/wishlist.routes';
import { promotionsRoutes } from './routes/promotions.routes';
import { bundlesRoutes } from './routes/bundles.routes';

const fastify = Fastify({
  logger: config.isDevelopment,
});

// Register CORS support
fastify.register(cors, {
  origin: config.isDevelopment ? true : config.app.url, // Allow all origins in dev, restrict to APP_URL in production
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
});

// Register raw body support (needed for Stripe webhooks)
fastify.register(rawBody, {
  field: 'rawBody',
  global: false,
  encoding: 'utf8',
  runFirst: true,
  routes: ['/payments/webhook'],
});

// Register cookie support
fastify.register(cookie);

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
fastify.register(cartRoutes);
fastify.register(orderRoutes);
fastify.register(paymentRoutes);
fastify.register(craftingRoutes);
fastify.register(gamificationRoutes);
fastify.register(cosmeticsRoutes);
fastify.register(labelsRoutes);
fastify.register(adminProductRoutes);
fastify.register(adminOrderRoutes);
fastify.register(adminThemeRoutes);
fastify.register(adminSettingsRoutes);
fastify.register(adminDashboardRoutes);
fastify.register(adminIngredientRoutes);
fastify.register(reviewsRoutes);
fastify.register(wishlistRoutes);
fastify.register(promotionsRoutes);
fastify.register(bundlesRoutes);

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
