# @alchemy/types

Centralized TypeScript type definitions for The Alchemy Table monorepo.

## Purpose

This package provides a single source of truth for all shared type definitions across the monorepo, including:

- **Common types**: Pagination, filters, API errors, stock status
- **User types**: User entities, authentication, profiles
- **Product types**: Products, reviews, wishlists, coupons
- **Order types**: Orders, cart, shipping, billing
- **Game types**: Players, quests, ingredients, recipes, cosmetics
- **Blog types**: Posts, tags, categories
- **API types**: Request/response types, payment types

## Benefits

- **No Duplication**: Single definition for each shared type
- **Type Safety**: Consistent types across all apps and packages
- **Easy Maintenance**: Update types in one place
- **Better DX**: Clear imports and type discovery

## Usage

### Import all types

```typescript
import type { User, Product, Order } from '@alchemy/types';
```

### Import from specific modules

```typescript
import type { User, AuthResponse } from '@alchemy/types/user';
import type { Product, Review } from '@alchemy/types/product';
import type { Order, CartWithItems } from '@alchemy/types/order';
import type { Player, Ingredient } from '@alchemy/types/game';
```

## Type Modules

- `common.ts` - Common shared types (pagination, filters, errors)
- `user.ts` - User and authentication types
- `product.ts` - Product catalog types
- `order.ts` - Order and cart types
- `game.ts` - Game logic types (ingredients, quests, etc.)
- `blog.ts` - Blog CMS types
- `api.ts` - API-specific types

## Migration Guide

When migrating existing code to use `@alchemy/types`:

1. Replace local type definitions with imports from `@alchemy/types`
2. Update imports in consuming files
3. Remove the old type definitions
4. Run type-check to ensure compatibility

### Example Migration

**Before:**
```typescript
// apps/web/src/store/authStore.ts
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
}
```

**After:**
```typescript
// apps/web/src/store/authStore.ts
import type { User } from '@alchemy/types';
// Use the centralized type
```

## Development

This package is TypeScript-only and doesn't require a build step. It exports source `.ts` files directly for maximum compatibility with the monorepo's build tools.

## Adding New Types

When adding new shared types:

1. Determine the appropriate module (or create a new one)
2. Add the type definition with JSDoc comments
3. Export it from the module
4. Re-export from `index.ts` if needed
5. Update this README
