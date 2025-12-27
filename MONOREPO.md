# Monorepo Development Guide

This guide provides comprehensive information about developing in The Alchemy Table monorepo.

## Table of Contents

- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Package Structure](#package-structure)
- [Development Workflows](#development-workflows)
- [Build System](#build-system)
- [Type Safety](#type-safety)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Architecture

The Alchemy Table uses a monorepo architecture powered by:

- **pnpm workspaces** - Efficient package management and dependency hoisting
- **Turborepo** - Intelligent build system with caching and parallelization
- **TypeScript** - Type safety across all packages

### Dependency Graph

```
@alchemy/types (base types)
    ↓
@alchemy/core (game logic) → uses @alchemy/types
    ↓
@alchemy/sdk (API client) → uses @alchemy/types
@alchemy/ui (components) → uses @alchemy/types
    ↓
@alchemy/web (Next.js app) → uses all packages
@alchemy/mobile (Expo app) → uses all packages
@alchemy/api (Fastify API) → uses @alchemy/core, @alchemy/types
```

## Getting Started

### Prerequisites

```bash
# Required
node >= 20.19.4
pnpm >= 9.0.0

# Install pnpm globally if needed
npm install -g pnpm@10.26.1
```

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/HoneyBadgered/alchemy.git
cd alchemy

# Install all dependencies
pnpm install

# Start development mode for all apps
pnpm run dev
```

## Package Structure

### Apps

#### @alchemy/web
- **Technology**: Next.js 16 (React 19)
- **Purpose**: Public-facing web application
- **Port**: 3001
- **Key Features**: SSR, PWA support, Tailwind CSS

#### @alchemy/api
- **Technology**: Fastify 5 + Prisma
- **Purpose**: Backend REST API
- **Port**: 3000
- **Key Features**: JWT auth, Stripe integration, PostgreSQL

#### @alchemy/mobile
- **Technology**: React Native (Expo)
- **Purpose**: Native mobile application
- **Key Features**: Cross-platform iOS/Android support

### Packages

#### @alchemy/types
- **Purpose**: Centralized TypeScript type definitions
- **No build required**: Exports source `.ts` files
- **Modules**:
  - `common.ts` - Pagination, filters, API errors
  - `user.ts` - User, auth types
  - `product.ts` - Product, review, wishlist types
  - `order.ts` - Order, cart types
  - `game.ts` - Game logic types
  - `blog.ts` - Blog CMS types
  - `api.ts` - API-specific types

**Usage:**
```typescript
// Import from main entry
import type { User, Product, Order } from '@alchemy/types';

// Import from specific module
import type { User } from '@alchemy/types/user';
import type { Product } from '@alchemy/types/product';
```

#### @alchemy/core
- **Purpose**: Shared game logic and business rules
- **Build**: TypeScript compilation to `dist/`
- **Features**:
  - XP and leveling system
  - Crafting validation
  - Quest eligibility
  - Cosmetics unlock rules
  - Ingredient database

#### @alchemy/sdk
- **Purpose**: Typed API client for frontend apps
- **Dependencies**: Uses `@alchemy/types`
- **Features**:
  - Type-safe API calls
  - React Query integration
  - Error handling

#### @alchemy/ui
- **Purpose**: Shared UI component library
- **Technology**: React components (web + native compatible)
- **Features**: Design system tokens, reusable components

## Development Workflows

### Working on a Single Package

```bash
# Navigate to package directory
cd packages/core

# Install dependencies (if needed)
pnpm install

# Run package-specific commands
pnpm run build
pnpm run test
pnpm run type-check
```

### Using Turbo Filters

```bash
# Run dev only for web app
pnpm --filter @alchemy/web run dev

# Build only core package
pnpm --filter @alchemy/core run build

# Run tests for all packages
pnpm run test

# Type-check specific package
pnpm --filter @alchemy/api run type-check
```

### Adding Dependencies

```bash
# Add to root (devDependencies only)
pnpm add -D -w <package>

# Add to specific workspace
pnpm --filter @alchemy/web add <package>

# Add workspace dependency
# Edit package.json manually:
{
  "dependencies": {
    "@alchemy/types": "workspace:*"
  }
}
```

### Creating a New Package

```bash
# Create directory
mkdir -p packages/new-package/src

# Create package.json
cat > packages/new-package/package.json << 'EOF'
{
  "name": "@alchemy/new-package",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@alchemy/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF

# Create tsconfig.json
cat > packages/new-package/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF

# Run install to link workspace
pnpm install
```

## Build System

### Turborepo Configuration

The `turbo.json` file defines our build pipeline:

- **Build dependencies**: Packages build in dependency order (`^build`)
- **Caching**: Turbo caches build outputs for faster rebuilds
- **Parallelization**: Independent tasks run in parallel

### Build Commands

```bash
# Build all packages and apps
pnpm run build

# Build with dependency graph visualization
pnpm run graph

# Build only changed packages (in CI)
turbo run build --filter=[HEAD^1]

# Clean all build artifacts
pnpm run clean

# Clean Turbo cache
pnpm run clean:cache
```

### Cache Configuration

Turbo automatically caches:
- Build outputs (`dist/`, `.next/`)
- Test coverage
- Type-check results

Cache is invalidated when:
- Source files change
- Dependencies change
- Environment variables change

## Type Safety

### Using Centralized Types

**✅ DO:**
```typescript
// Import from centralized types
import type { User, Product } from '@alchemy/types';
```

**❌ DON'T:**
```typescript
// Don't duplicate type definitions
interface User {
  id: string;
  // ...
}
```

### Type-Checking

```bash
# Type-check all packages
pnpm run type-check

# Type-check recursively (includes apps)
pnpm run type-check:all

# Type-check specific package
pnpm --filter @alchemy/web run type-check
```

### Adding New Shared Types

1. Determine the appropriate module in `@alchemy/types/src/`
2. Add the type with JSDoc comments
3. Export from the module file
4. Re-export from `index.ts` if needed
5. Run type-check to verify

## Testing

### Running Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests for specific package
pnpm --filter @alchemy/web run test

# Run with coverage
pnpm --filter @alchemy/web run test:coverage
```

### Test Structure

```
packages/core/
  src/
    xp/
      index.ts
      index.test.ts  ← Test alongside implementation
```

## Best Practices

### Package Organization

1. **Single Responsibility**: Each package should have one clear purpose
2. **Minimal Dependencies**: Only depend on what you actually use
3. **Shared Code**: Extract common code to shared packages

### Type Definitions

1. **Use Centralized Types**: Always import from `@alchemy/types`
2. **Avoid Duplication**: Don't redefine shared types locally
3. **Document Types**: Use JSDoc comments for complex types

### Development

1. **Use Filters**: Use `--filter` to work on specific packages
2. **Check Types**: Run type-check before committing
3. **Test Changes**: Run relevant tests locally
4. **Clean Builds**: Run `pnpm run clean` if you encounter issues

### Version Management

1. **Workspace Protocol**: Use `workspace:*` for internal dependencies
2. **Version Consistency**: Keep shared dependencies in sync
3. **Update Together**: Update related packages together

### Code Style

```bash
# Format all code
pnpm run format

# Check formatting
pnpm run format:check

# Lint all packages
pnpm run lint

# Fix linting issues
pnpm run lint:fix
```

## Troubleshooting

### Build Failures

```bash
# Clean everything and rebuild
pnpm run clean
pnpm install
pnpm run build
```

### Type Errors

```bash
# Check if types package is built
cd packages/types
pnpm run type-check

# Rebuild dependent packages
pnpm run build:types
pnpm run build:core
```

### Dependency Issues

```bash
# Check for dependency mismatches
pnpm run deps:check

# Update dependencies
pnpm run deps:update

# Reinstall everything
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Cache Issues

```bash
# Clear Turbo cache
pnpm run clean:cache

# Clear Next.js cache
rm -rf apps/web/.next

# Clear TypeScript cache
find . -name "*.tsbuildinfo" -delete
```

### Workspace Linking Issues

```bash
# Verify workspace links
pnpm list --depth 0

# Reinstall to fix links
pnpm install --force
```

## Advanced Topics

### Dependency Management

The monorepo uses several strategies to manage dependencies:

1. **Hoisting**: Common dependencies installed once at root
2. **Workspace Protocol**: Internal packages linked via `workspace:*`
3. **Peer Dependencies**: UI packages use peers for React
4. **Overrides**: Root package.json can override versions

### CI/CD Optimization

```bash
# Only build affected packages
turbo run build --filter=[HEAD^1]

# Use remote caching (requires Turbo account)
turbo run build --token=<token>
```

### Performance Tips

1. **Use Turbo**: Let Turbo handle parallelization
2. **Filter Smartly**: Don't build more than needed
3. **Cache Wisely**: Don't disable cache unless necessary
4. **Watch Mode**: Use watch mode for faster iteration

## Migration Guide

### Moving Types to @alchemy/types

1. Identify duplicate type definitions
2. Move to appropriate module in `@alchemy/types/src/`
3. Update imports in consuming files
4. Remove old type definitions
5. Run type-check to verify

### Example Migration

**Before:**
```typescript
// apps/web/src/types.ts
export interface Product {
  id: string;
  name: string;
  price: number;
}

// apps/web/src/components/ProductCard.tsx
import { Product } from '../types';
```

**After:**
```typescript
// packages/types/src/product.ts (already exists)
export interface Product {
  id: string;
  name: string;
  price: number;
}

// apps/web/src/components/ProductCard.tsx
import type { Product } from '@alchemy/types';
```

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

## Getting Help

- Check existing documentation in the repo
- Review recent commits for examples
- Ask questions in team channels
- Create issues for bugs or improvements
