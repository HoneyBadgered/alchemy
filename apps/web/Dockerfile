# Web Dockerfile for The Alchemy Table
FROM node:20-alpine AS base
# Add these two lines (insert them immediately after the first FROM <...> line)
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}

# Install dependencies only when needed
FROM base AS deps
# Install build tools for native modules like bcrypt
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Copy package files from monorepo root and web workspace
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/core/package*.json ./packages/core/
COPY packages/ui/package*.json ./packages/ui/
COPY packages/sdk/package*.json ./packages/sdk/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy source code
COPY . .

# Build the application
WORKDIR /app/apps/web
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages

USER nextjs

EXPOSE 3000

WORKDIR /app/apps/web

CMD ["npm", "start"]
