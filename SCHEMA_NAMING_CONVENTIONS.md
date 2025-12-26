# Database Schema Naming Conventions

## Overview

This document outlines the naming conventions used in the Alchemy codebase to ensure consistency between the PostgreSQL database schema and TypeScript code.

## General Principle

**The Prisma schema uses snake_case for all model and field names to match PostgreSQL conventions.**

## Model Names

All Prisma models use **snake_case** naming:

| Model Name (Prisma) | Description |
|---------------------|-------------|
| `users` | User accounts |
| `user_profiles` | User profile information |
| `user_achievements` | User achievement tracking |
| `player_states` | Player game state |
| `player_quests` | Active and completed quests |
| `player_inventory` | Player inventory items |
| `player_cosmetics` | Unlocked themes and skins |
| `orders` | Customer orders |
| `order_items` | Items in orders |
| `order_status_logs` | Order status change history |
| `cart_items` | Shopping cart items |
| `carts` | Shopping carts |
| `products` | Product catalog |
| `product_bundles` | Product bundle definitions |
| `product_relations` | Product relationships (upsells, cross-sells) |
| `bundle_items` | Items in product bundles |
| `wishlist_items` | User wishlist items |
| `reviews` | Product reviews |
| `payment_methods` | Saved payment methods |
| `addresses` | Saved addresses |
| `subscriptions` | Subscription orders |
| `ingredients` | Tea blend ingredients |
| `ingredient_pairings` | Ingredient compatibility |
| `recipes` | Crafting recipes |
| `blends` | Custom tea blends |
| `themes` | UI themes |
| `table_skins` | Game table skins |
| `label_designs` | Custom label designs |
| `quests` | Available quests |
| `achievements` | Available achievements |
| `rewards` | Reward catalog |
| `reward_points` | User reward points |
| `reward_history` | Reward transaction history |
| `notification_preferences` | User notification settings |
| `site_settings` | System configuration |
| `email_templates` | Email templates |
| `blog_posts` | Blog content |
| `blog_post_tags` | Blog post tag associations |
| `tags` | Available tags |
| `shipping_methods` | Available shipping methods |
| `tax_rates` | Tax rate configuration |
| `discount_codes` | Promotional discount codes |
| `suppliers` | Ingredient suppliers |
| `refunds` | Order refunds |
| `stripe_webhook_events` | Stripe webhook event log |
| `refresh_tokens` | JWT refresh tokens |
| `events` | System event log |

## Code References

### Prisma Client Usage

When accessing models in code, always use the snake_case name:

```typescript
// ✅ CORRECT
await prisma.users.findUnique({ where: { id: userId } });
await prisma.user_profiles.findFirst({ where: { userId } });
await prisma.order_items.findMany({ where: { orderId } });
await prisma.cart_items.create({ data: {...} });
await prisma.player_states.update({ where: { userId }, data: {...} });

// ❌ INCORRECT
await prisma.user.findUnique({ where: { id: userId } });
await prisma.userProfile.findFirst({ where: { userId } });
await prisma.orderItem.findMany({ where: { orderId } });
await prisma.cartItem.create({ data: {...} });
await prisma.playerState.update({ where: { userId }, data: {...} });
```

### Relation Fields

Relation field names also use snake_case:

```typescript
// ✅ CORRECT - includes use relation field names from schema
await prisma.orders.findUnique({
  where: { id: orderId },
  include: {
    order_items: true,      // relation field name
    order_status_logs: true, // relation field name
    users: true,            // relation field name (singular from schema)
  }
});

// ✅ CORRECT - accessing included relations
const order = await prisma.orders.findUnique({
  where: { id: orderId },
  include: {
    order_items: { include: { products: true } },
  }
});

// Access relation data
order.order_items.forEach((item) => {
  console.log(item.products.name); // products is the relation field name
});

// ❌ INCORRECT
await prisma.orders.findUnique({
  where: { id: orderId },
  include: {
    items: true,       // Wrong - should be order_items
    statusLogs: true,  // Wrong - should be order_status_logs
    user: true,        // Wrong - should be users (from schema)
  }
});
```

### Common Relation Field Names

| Parent Model | Relation Field | Target Model |
|--------------|----------------|--------------|
| `orders` | `order_items` | `order_items` |
| `orders` | `order_status_logs` | `order_status_logs` |
| `orders` | `users` | `users` |
| `carts` | `cart_items` | `cart_items` |
| `cart_items` | `products` | `products` |
| `cart_items` | `carts` | `carts` |
| `users` | `user_profiles` | `user_profiles` |
| `users` | `user_achievements` | `user_achievements` |
| `users` | `player_states` | `player_states` |
| `users` | `player_quests` | `player_quests` |
| `users` | `player_inventory` | `player_inventory` |
| `users` | `player_cosmetics` | `player_cosmetics` |
| `product_bundles` | `bundle_items` | `bundle_items` |
| `bundle_items` | `products` | `products` |
| `bundle_items` | `product_bundles` | `product_bundles` |
| `player_quests` | `quests` | `quests` |
| `player_quests` | `users` | `users` |
| `label_designs` | `orders` | `orders` |
| `themes` | `table_skins` | `table_skins` |

### Transaction Client References

When using Prisma transactions, model names remain snake_case:

```typescript
// ✅ CORRECT
await prisma.$transaction(async (tx) => {
  await tx.player_inventory.create({ data: {...} });
  await tx.player_states.update({ where: { userId }, data: {...} });
  await tx.reward_points.update({ where: { userId }, data: {...} });
});

// ❌ INCORRECT
await prisma.$transaction(async (tx) => {
  await tx.playerInventory.create({ data: {...} });
  await tx.playerState.update({ where: { userId }, data: {...} });
  await tx.rewardPoints.update({ where: { userId }, data: {...} });
});
```

## Required Fields

Most models require an `id` field (UUID) when creating records:

```typescript
// ✅ CORRECT
await prisma.themes.create({
  data: {
    id: crypto.randomUUID(),
    name: "Dark Theme",
    // ... other fields
  }
});

// ✅ CORRECT for upsert operations
await prisma.player_inventory.upsert({
  where: { userId_itemId: { userId, itemId } },
  create: {
    id: crypto.randomUUID(),
    userId,
    itemId,
    quantity: 1,
  },
  update: {
    quantity: { increment: 1 },
  }
});
```

## Common Pitfalls

### 1. Relation Field Names
The most common mistake is using singular names for relations when the schema defines them as plural:

```typescript
// ❌ WRONG
const theme = await prisma.themes.findUnique({
  where: { id },
  include: { tableSkins: true }  // Wrong!
});

// ✅ CORRECT
const theme = await prisma.themes.findUnique({
  where: { id },
  include: { table_skins: true }  // Correct!
});
```

### 2. Product Relations
Product relations use long generated names based on the relation alias:

```typescript
// ✅ CORRECT
const relations = await prisma.product_relations.findMany({
  include: {
    products_product_relations_relatedProductIdToproducts: true
  }
});
```

### 3. Cart Items
When accessing cart items with products:

```typescript
// ✅ CORRECT
const cart = await prisma.carts.findUnique({
  where: { userId },
  include: {
    cart_items: {
      include: {
        products: true  // Relation name is 'products'
      }
    }
  }
});

// Access product from cart item
cart.cart_items.forEach((item) => {
  console.log(item.products.name);  // Use 'products', not 'product'
});
```

## Migration Steps

If you encounter schema vs. code mismatches:

1. **Check the Prisma schema** (`apps/api/prisma/schema.prisma`) for the correct model and relation names
2. **Update code references** to match the snake_case model names
3. **Update relation includes** to use the exact relation field names from the schema
4. **Update transaction client calls** to use snake_case model names
5. **Add `id` fields** to create operations if missing
6. **Run type-check**: `cd apps/api && npx tsc --noEmit`
7. **Run tests**: `npm test`

## Tools for Verification

```bash
# Type check the API
cd apps/api
npx tsc --noEmit

# Run tests
npm test

# Build the API
npm run build
```

## Summary

**Key Rule**: Always use **snake_case** for model names and relation field names to match the PostgreSQL schema. This ensures consistency and prevents runtime errors.

**When in doubt**: Check `apps/api/prisma/schema.prisma` for the authoritative naming convention.
