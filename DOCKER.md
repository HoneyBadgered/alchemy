# Docker Setup Guide

This guide explains how to use Docker to run The Alchemy Table application.

## Overview

The application provides multiple Docker configurations:

1. **Database Only** - Just PostgreSQL for local development
2. **Development Mode** - All services with hot-reload (docker-compose.dev.yml)
3. **Production Mode** - Optimized production builds (docker-compose.yml with --profile full)

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+

## Quick Start

### Option 1: Database Only (Recommended for Local Development)

Run just the PostgreSQL database in Docker while running other services locally:

```bash
# Start PostgreSQL
docker compose up -d postgres

# Check if database is ready
docker compose ps

# Run migrations (first time setup)
docker compose --profile migrate up prisma-migrate

# Now run your API and Web locally
npm install
npm run dev
```

### Option 2: Full Development Stack with Hot Reload

Run all services (database, API, web) with hot-reload enabled:

```bash
# Start all services in development mode
docker compose -f docker-compose.dev.yml up

# Or run in background
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop services
docker compose -f docker-compose.dev.yml down
```

Access the services:
- Web App: http://localhost:3001
- API: http://localhost:3000
- Database: localhost:5432

### Option 3: Production Build

Run optimized production builds of all services:

```bash
# Build and start all services
docker compose --profile full up --build

# Or run in background
docker compose --profile full up -d --build

# View logs
docker compose logs -f api web

# Stop services
docker compose --profile full down
```

## Services

### PostgreSQL Database

- **Image**: postgres:16-alpine
- **Port**: 5432
- **Database**: alchemy
- **User**: alchemy
- **Password**: alchemy_password
- **Data**: Persisted in Docker volume `postgres_data` (or `postgres_dev_data` for dev)

### API Service

- **Framework**: Fastify + TypeScript
- **Port**: 3000
- **Endpoints**: See apps/api/README.md

### Web Service

- **Framework**: Next.js 16
- **Port**: 3001 (mapped from container port 3000)
- **URL**: http://localhost:3001

## Common Commands

### Managing Services

```bash
# Start specific service
docker compose up postgres
docker compose up api
docker compose up web

# View logs for specific service
docker compose logs -f postgres
docker compose logs -f api

# Restart a service
docker compose restart api

# Stop all services
docker compose down

# Stop and remove volumes (deletes database data!)
docker compose down -v
```

### Database Management

```bash
# Connect to PostgreSQL
docker exec -it alchemy-postgres psql -U alchemy -d alchemy

# Run Prisma migrations
docker compose --profile migrate up prisma-migrate

# Backup database
docker exec alchemy-postgres pg_dump -U alchemy alchemy > backup.sql

# Restore database
docker exec -i alchemy-postgres psql -U alchemy -d alchemy < backup.sql
```

### Troubleshooting

```bash
# Check container status
docker compose ps

# View container logs
docker compose logs

# Check database health
docker exec alchemy-postgres pg_isready -U alchemy -d alchemy

# Rebuild services after code changes
docker compose --profile full up --build

# Remove all containers and volumes (fresh start)
docker compose down -v
docker compose -f docker-compose.dev.yml down -v
```

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Available variables:
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `APP_URL` - Frontend URL for email links
- `EMAIL_FROM` - Email sender address
- `NEXT_PUBLIC_API_URL` - API URL for web app

## Development Workflow

### Development with Docker

1. Start the database:
   ```bash
   docker compose up -d postgres
   ```

2. Run migrations:
   ```bash
   docker compose --profile migrate up prisma-migrate
   ```

3. Start development services with hot reload:
   ```bash
   docker compose -f docker-compose.dev.yml up api web
   ```

4. Make code changes - they'll automatically reload!

### Production Testing

Test production builds locally:

```bash
# Build and run production images
docker compose --profile full up --build

# Test the application
curl http://localhost:3000/health
curl http://localhost:3001
```

## Profiles

Docker Compose profiles allow running different service configurations:

- **Default** (no profile): Only postgres
- **migrate**: Includes postgres + prisma-migrate
- **full**: Includes postgres + api + web (production builds)

Usage:
```bash
docker compose --profile <profile-name> up
```

## Differences Between Configurations

### docker-compose.yml (Production)

- Uses multi-stage Dockerfiles for optimized builds
- Runs compiled/built code
- Smaller image sizes
- No live reload
- Suitable for production deployment

### docker-compose.dev.yml (Development)

- Uses node:18-alpine base image
- Mounts source code as volumes
- Hot reload enabled
- Faster startup (no build step)
- Suitable for local development

## Tips

1. **Use database only in Docker**: This is the recommended approach for most developers. Run PostgreSQL in Docker but run API and Web locally with `npm run dev`.

2. **Use dev compose for full stack**: If you want everything in Docker with hot reload, use `docker-compose.dev.yml`.

3. **Use production compose for testing**: Before deploying, test your production builds locally with `docker compose --profile full up --build`.

4. **Persist data**: Database data is stored in Docker volumes. Use `docker compose down` (without `-v`) to keep data between restarts.

5. **Clean slate**: If you need a fresh database, use `docker compose down -v` to remove volumes.

## Network

All services communicate over the `alchemy-network` bridge network. This allows services to reference each other by service name (e.g., `postgres`, `api`, `web`).

## Volumes

- `postgres_data`: Production database data
- `postgres_dev_data`: Development database data
- `node_modules`: Shared node_modules cache for faster builds

## Security Notes

⚠️ **Important**: The default credentials are for development only!

For production:
1. Change database password in environment variables
2. Use strong JWT secrets
3. Never commit `.env` files with real credentials
4. Use Docker secrets or environment variable injection for sensitive data

## Next Steps

- See [README.md](../README.md) for general project documentation
- See [apps/api/README.md](apps/api/README.md) for API documentation
- See [apps/web/README.md](apps/web/README.md) for Web app documentation
