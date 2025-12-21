# alchemy
A gamified e-commerce platform for building blends at an alchemy table

## 🏗️ Monorepo Structure

This project uses **pnpm workspaces** to manage multiple packages in a monorepo. All packages are orchestrated using [Turborepo](https://turbo.build/repo) for efficient builds and caching.

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

📘 **For detailed Docker setup instructions, see [DOCKER.md](DOCKER.md)**

### Prerequisites
- Node.js >= 20.19.4 (required for Fastify v5)
- pnpm >= 9.0.0 (`npm install -g pnpm`)
- Docker and Docker Compose (recommended for database)

### Installation

```bash
# Install all dependencies for all workspaces
pnpm install
```

### Database Setup with Docker (Recommended)

The easiest way to set up the PostgreSQL database is using Docker:

```bash
# Start PostgreSQL database
docker compose up -d postgres

# Check database status
docker compose ps

# Run Prisma migrations from your local machine
cd apps/api
pnpm run prisma:migrate
pnpm run prisma:generate

# Seed the database with initial data (including admin user)
pnpm run prisma:seed
cd ../..
```

The database will be available at `postgresql://alchemy:alchemy_password@localhost:5432/alchemy`

**Default Admin Credentials:**
- Email: `admin@alchemy.dev`
- Password: `Admin123!`

```bash
# Stop the database
docker compose down

# Stop and remove all data
docker compose down -v
```

### Running Full Application with Docker

You can run the entire application stack (database, API, and web) using Docker:

```bash
# Build and start all services (database, API, web)
docker compose --profile full up --build

# Or run in detached mode
docker compose --profile full up -d --build

# View logs
docker compose logs -f

# Stop all services
docker compose --profile full down
```

Services will be available at:
- **Web App**: http://localhost:3001
- **API**: http://localhost:3000
- **Database**: localhost:5432

### Development Mode with Docker (Hot Reload)

For development with hot-reload enabled:

```bash
# Start all services in development mode with hot reload
docker compose -f docker-compose.dev.yml up

# Or run in detached mode
docker compose -f docker-compose.dev.yml up -d

# Stop development services
docker compose -f docker-compose.dev.yml down
```

### Database Setup without Docker

If you prefer to run PostgreSQL locally without Docker:

1. Install PostgreSQL 14+
2. Create a database named `alchemy`
3. Update `apps/api/.env` with your database credentials
4. Run migrations: `pnpm --filter @alchemy/api run prisma:migrate`

### Local Development (without Docker)

If you prefer to run services locally without Docker:

```bash
# 1. Make sure PostgreSQL is running and migrations are complete
# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cd apps/api
cp .env.example .env
# Edit .env with your database credentials
cd ../..

# 4. Run all apps in development mode
pnpm run dev

# Or run specific apps
pnpm --filter @alchemy/api run dev    # API on port 3000
pnpm --filter @alchemy/web run dev    # Web on port 3001
```

### Development

```bash
# Run all apps in development mode
pnpm run dev

# Build all packages
pnpm run build

# Run tests across all workspaces
pnpm run test

# Lint all packages
pnpm run lint

# Type check all packages
pnpm run type-check
```

### Working with Specific Workspaces

```bash
# Run commands in a specific workspace
pnpm --filter @alchemy/web run dev
pnpm --filter @alchemy/core run build
pnpm --filter @alchemy/api run test

# Install a dependency in a specific workspace
pnpm --filter @alchemy/web add <package>
```

## 📦 Workspace Benefits

- **Dependency hoisting**: Shared dependencies are installed once at the root
- **Cross-package references**: Packages can reference each other using workspace protocol
- **Efficient builds**: Turborepo caches and parallelizes builds
- **Consistent versions**: Ensures dependency version consistency across packages

## ✨ Key Features

### Product Inventory Management

The platform includes a comprehensive product inventory management system for admins:

- **Image Upload System**
  - Upload product images directly from the admin panel
  - Support for JPG, PNG, WebP, and GIF formats (up to 5MB)
  - Image preview before saving
  - Option to use uploaded files or external URLs

- **Bulk Product Import**
  - Import multiple products at once via CSV
  - Download CSV template with example data
  - Validate CSV before importing
  - Detailed error reporting per row
  - Partial import support (continues on errors)

- **Admin Product Management UI**
  - Complete CRUD operations for products
  - Filter and search functionality
  - Low stock indicators
  - Category management
  - Product visibility controls

📘 **For detailed API documentation, see [PRODUCT_INVENTORY_API.md](PRODUCT_INVENTORY_API.md)**

## 📝 Migration Notes

### Fastify v5 Upgrade (November 2025)

The API backend has been upgraded from Fastify v4 to Fastify v5. This upgrade brings performance improvements and better maintainability.

#### What Changed

- **Fastify**: v4.25.2 → v5.6.2
- **@fastify/cookie**: v11.0.2 (already compatible)
- **@fastify/rate-limit**: v10.3.0 (already compatible)

#### Breaking Changes from Fastify v4 to v5

While this project wasn't affected by breaking changes, developers should be aware of the following if extending the API:

1. **Node.js v20+ Required**: Fastify v5 requires Node.js v20 or higher (already met by this project)
2. **Full JSON Schema**: Route validation schemas must use complete JSON Schema format with `type` and `properties` (already in use)
3. **Logger Instance**: Custom loggers must use `loggerInstance` option instead of `logger` (not applicable - using boolean logger)
4. **Semicolon Delimiters**: Query string semicolon delimiters disabled by default (not in use)

#### Testing

All existing tests continue to pass without modification. The application starts successfully and all endpoints remain functional.

For more details on Fastify v5, see the [official migration guide](https://fastify.dev/docs/latest/Guides/Migration-Guide-V5/).
