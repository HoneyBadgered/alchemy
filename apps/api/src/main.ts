/**
 * The Alchemy Table API Server
 */

import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rawBody from 'fastify-raw-body';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { config } from './config';
import { prisma } from './utils/prisma';
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
import { ingredientsRoutes } from './routes/ingredients.routes';
import { blendRoutes } from './routes/blend.routes';
import { reviewsRoutes } from './routes/reviews.routes';
import { wishlistRoutes } from './routes/wishlist.routes';
import { promotionsRoutes } from './routes/promotions.routes';
import { bundlesRoutes } from './routes/bundles.routes';
import { userProfileRoutes } from './routes/user-profile.routes';
import { addressRoutes } from './routes/address.routes';
import { paymentMethodRoutes } from './routes/payment-method.routes';
import { rewardsRoutes } from './routes/rewards.routes';
import { subscriptionRoutes } from './routes/subscription.routes';
import { notificationPreferencesRoutes } from './routes/notification-preferences.routes';
import { achievementsRoutes } from './routes/achievements.routes';
import { purchaseHistoryRoutes } from './routes/purchase-history.routes';
import adminBlogRoutes from './routes/admin-blog.routes';
import blogRoutes from './routes/blog.routes';
import searchRoutes from './routes/search.routes';
import { fileUploadRoutes } from './routes/file-upload.routes';
import { errorHandlerPlugin } from './plugins/error-handler';

const fastify = Fastify({
  logger: config.isDevelopment,
});

// Register error handler plugin first
fastify.register(errorHandlerPlugin);

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

// Register multipart support for file uploads
fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10, // Max 10 files per request
  },
});

// Register static file serving for uploads
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'uploads'),
  prefix: '/uploads/',
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
fastify.register(cartRoutes);
fastify.register(orderRoutes);
fastify.register(paymentRoutes);
fastify.register(craftingRoutes);
fastify.register(gamificationRoutes);
fastify.register(cosmeticsRoutes);
fastify.register(labelsRoutes);
fastify.register(fileUploadRoutes);
fastify.register(adminProductRoutes);
fastify.register(adminOrderRoutes);
fastify.register(adminThemeRoutes);
fastify.register(adminSettingsRoutes);
fastify.register(adminDashboardRoutes);
fastify.register(adminIngredientRoutes);
fastify.register(ingredientsRoutes);
fastify.register(blendRoutes);
fastify.register(reviewsRoutes);
fastify.register(wishlistRoutes);
fastify.register(promotionsRoutes);
fastify.register(bundlesRoutes);
fastify.register(userProfileRoutes);
fastify.register(addressRoutes);
fastify.register(paymentMethodRoutes);
fastify.register(rewardsRoutes);
fastify.register(subscriptionRoutes);
fastify.register(notificationPreferencesRoutes);
fastify.register(achievementsRoutes);
fastify.register(purchaseHistoryRoutes);
fastify.register(adminBlogRoutes);
fastify.register(blogRoutes);
fastify.register(searchRoutes);

// Health check endpoint
fastify.get('/health', async (_request, reply) => {
  const health: {
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    database?: string;
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.isDevelopment ? 'development' : 'production',
    version: process.env.npm_package_version || '1.0.0',
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = { status: 'connected' };
  } catch (error) {
    health.database = { 
      status: 'disconnected',
      error: (error as Error).message 
    };
    health.status = 'degraded';
  }

  // Check Stripe configuration
  health.stripe = {
    configured: !!(config.stripeSecretKey && config.stripeWebhookSecret)
  };

  // Return 503 if database is down
  if (health.status === 'degraded') {
    return reply.status(503).send(health);
  }

  return health;
});

// Readiness check (for Kubernetes/Docker health checks)
fastify.get('/ready', async (_request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return reply.send({ ready: true });
  } catch (error) {
    return reply.status(503).send({ 
      ready: false,
      error: (error as Error).message 
    });
  }
});

// Liveness check (for Kubernetes/Docker health checks)
fastify.get('/live', async () => {
  return { alive: true };
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
