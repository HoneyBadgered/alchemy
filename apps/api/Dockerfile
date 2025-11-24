# API Dockerfile for The Alchemy Table
FROM node:20-bookworm-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Install build tools for native modules like bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files from monorepo root and API workspace
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/core/package*.json ./packages/core/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY . .

# Build the application (includes Prisma generation)
WORKDIR /app/apps/api
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Create a non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 fastify

# Copy built application
COPY --from=builder --chown=fastify:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=fastify:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=fastify:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=fastify:nodejs /app/packages ./packages

USER fastify

EXPOSE 3000

WORKDIR /app/apps/api

# Run database migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
