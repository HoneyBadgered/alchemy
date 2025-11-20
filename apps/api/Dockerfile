# API Dockerfile for The Alchemy Table
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
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
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules

# Copy source code
COPY . .

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

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

CMD ["node", "dist/main.js"]
