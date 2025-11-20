# alchemy
A gamified e-commerce platform for building blends at an alchemy table

## 🏗️ Monorepo Structure

This project uses **npm workspaces** to manage multiple packages in a monorepo. All packages are orchestrated using [Turborepo](https://turbo.build/repo) for efficient builds and caching.

### Workspaces

#### Apps
- **`@alchemy/web`** - Next.js web application
- **`@alchemy/api`** - Fastify backend API
- **`@alchemy/mobile`** - React Native mobile app (Expo)

#### Packages
- **`@alchemy/core`** - Shared core game logic
- **`@alchemy/ui`** - Design system and UI components
- **`@alchemy/sdk`** - Typed API client

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose (recommended for database)

### Installation

```bash
# Install all dependencies for all workspaces
npm install
```

### Database Setup with Docker (Recommended)

The easiest way to set up the PostgreSQL database is using Docker:

```bash
# Start PostgreSQL database
docker-compose up -d postgres

# Run Prisma migrations (first time setup)
docker-compose --profile migrate up prisma-migrate

# Or run migrations manually if you have the API dependencies installed
cd apps/api
npm run prisma:migrate
npm run prisma:generate
```

The database will be available at `postgresql://alchemy:alchemy_password@localhost:5432/alchemy`

```bash
# Stop the database
docker-compose down

# Stop and remove all data
docker-compose down -v
```

### Database Setup without Docker

If you prefer to run PostgreSQL locally without Docker:

1. Install PostgreSQL 14+
2. Create a database named `alchemy`
3. Update `apps/api/.env` with your database credentials
4. Run migrations: `npm run prisma:migrate --workspace=@alchemy/api`

### Development

```bash
# Run all apps in development mode
npm run dev

# Build all packages
npm run build

# Run tests across all workspaces
npm run test

# Lint all packages
npm run lint

# Type check all packages
npm run type-check
```

### Working with Specific Workspaces

```bash
# Run commands in a specific workspace
npm run dev --workspace=@alchemy/web
npm run build --workspace=@alchemy/core
npm run test --workspace=@alchemy/api

# Install a dependency in a specific workspace
npm install <package> --workspace=@alchemy/web
```

## 📦 Workspace Benefits

- **Dependency hoisting**: Shared dependencies are installed once at the root
- **Cross-package references**: Packages can reference each other using workspace protocol
- **Efficient builds**: Turborepo caches and parallelizes builds
- **Consistent versions**: Ensures dependency version consistency across packages
