# Dockerized Components Summary

## Components That Have Been Dockerized

### 1. PostgreSQL Database ✅
- **Status**: Fully dockerized and production-ready
- **Image**: `postgres:16-alpine`
- **Container Name**: `alchemy-postgres`
- **Port**: 5432 (exposed to host)
- **Credentials**:
  - User: `alchemy`
  - Password: `alchemy_password`
  - Database: `alchemy`
- **Data Persistence**: Docker volume `postgres_data`
- **Health Check**: Built-in pg_isready check
- **Usage**: `docker compose up -d postgres`

### 2. API Service (Fastify Backend) ✅
- **Status**: Dockerized with multi-stage build
- **Base Image**: `node:18-alpine`
- **Dockerfile**: `apps/api/Dockerfile`
- **Container Name**: `alchemy-api`
- **Port**: 3000 (exposed to host)
- **Features**:
  - Multi-stage build for optimized image size
  - Prisma Client generation included
  - TypeScript compilation
  - Non-root user (fastify:1001)
  - Production-optimized
- **Profile**: `full` (requires flag to run)
- **Usage**: `docker compose --profile full up --build api`

### 3. Web Service (Next.js Frontend) ✅
- **Status**: Dockerized with multi-stage build
- **Base Image**: `node:18-alpine`
- **Dockerfile**: `apps/web/Dockerfile`
- **Container Name**: `alchemy-web`
- **Port**: 3001 (maps from container port 3000)
- **Features**:
  - Multi-stage build for optimized image size
  - Next.js production build
  - Non-root user (nextjs:1001)
  - Static assets included
  - Production-optimized
- **Profile**: `full` (requires flag to run)
- **Usage**: `docker compose --profile full up --build web`

## Components NOT Dockerized

### Mobile App (React Native/Expo)
- **Status**: Not dockerized
- **Reason**: React Native/Expo apps are typically run on physical devices or emulators, not in containers
- **Development**: Run locally with `npm run dev --workspace=@alchemy/mobile`

## Docker Configurations Available

### 1. docker-compose.yml (Production)
- **Purpose**: Production deployment
- **Services**:
  - postgres (default profile)
  - api (full profile)
  - web (full profile)
- **Features**:
  - Optimized builds
  - Minimal image sizes
  - Production environment
  - Persistent volumes
  - Health checks
- **Network**: `alchemy-network` (bridge)

### 2. docker-compose.dev.yml (Development)
- **Purpose**: Local development with hot-reload
- **Services**:
  - postgres
  - api (with volume mounts)
  - web (with volume mounts)
- **Features**:
  - Source code mounted as volumes
  - Hot reload enabled
  - Faster startup (no build)
  - Development environment
- **Network**: `alchemy-network` (bridge)

## Usage Patterns

### Pattern 1: Database Only (Recommended for Development)
```bash
docker compose up -d postgres
# Run API and Web locally with npm run dev
```
**Best for**: Day-to-day development

### Pattern 2: Full Development Stack
```bash
docker compose -f docker-compose.dev.yml up
```
**Best for**: Testing full stack with hot reload

### Pattern 3: Production Build Testing
```bash
docker compose --profile full up --build
```
**Best for**: Testing production builds before deployment

## Shared Packages in Monorepo

The following packages are built into both API and Web containers:
- `@alchemy/core` - Game logic
- `@alchemy/ui` - UI components (web only)
- `@alchemy/sdk` - API client (web only)

## Environment Variables

### Shared (.env in root)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_URL`
- `EMAIL_FROM`
- `NEXT_PUBLIC_API_URL`

### API-specific (apps/api/.env)
- `DATABASE_URL`
- `PORT`
- `NODE_ENV`

### Web-specific (apps/web/.env.local)
- `NEXT_PUBLIC_API_URL`

## Database Migration Strategy

**Approach**: Run migrations from host machine

**Reason**: Simpler and more reliable than trying to automate migrations in containers

**Command**:
```bash
cd apps/api
DATABASE_URL="postgresql://alchemy:alchemy_password@localhost:5432/alchemy?schema=public" npm run prisma:migrate
```

## Security Notes

⚠️ **Development Credentials**: The default database credentials are for development only
⚠️ **Production**: Change all secrets and passwords for production deployments
⚠️ **JWT Secrets**: Generate strong random secrets for production

## Performance Considerations

### Image Sizes
- **API**: ~200-300 MB (multi-stage build)
- **Web**: ~200-300 MB (multi-stage build)
- **Postgres**: ~240 MB (alpine-based)

### Build Times
- **First build**: 2-5 minutes (downloads dependencies)
- **Subsequent builds**: 30 seconds - 2 minutes (with layer caching)

### Startup Times
- **Postgres**: 2-5 seconds
- **API**: 5-10 seconds
- **Web**: 5-10 seconds

## Next Steps for Production

1. **Environment Variables**: Use Docker secrets or CI/CD environment injection
2. **Image Registry**: Push built images to a container registry (Docker Hub, ECR, etc.)
3. **Orchestration**: Deploy using Kubernetes, ECS, or Docker Swarm
4. **Monitoring**: Add health check endpoints and monitoring
5. **SSL/TLS**: Configure reverse proxy (nginx) for HTTPS
6. **Scaling**: Configure horizontal scaling for API and Web
7. **Backup**: Automate database backups

## Documentation

- **Main README**: [README.md](README.md) - Quick start guide
- **Docker Guide**: [DOCKER.md](DOCKER.md) - Comprehensive Docker documentation
- **API README**: [apps/api/README.md](apps/api/README.md) - API-specific docs
- **Web README**: [apps/web/README.md](apps/web/README.md) - Web app docs
