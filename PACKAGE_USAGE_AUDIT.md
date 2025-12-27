# Package Usage Audit

This document provides an analysis of how packages are utilized across the monorepo, identifying gaps and opportunities for better code sharing.

**Last Updated**: December 2025

## Overview

The monorepo consists of:
- 3 apps: `@alchemy/web`, `@alchemy/api`, `@alchemy/mobile`
- 4 packages: `@alchemy/types`, `@alchemy/core`, `@alchemy/ui`, `@alchemy/sdk`

## Package Usage Analysis

### @alchemy/types ✅ NEW
**Status**: Well utilized across all apps

**Usage**:
- ✅ `@alchemy/web`: Imports User, Product, Order, etc.
- ✅ `@alchemy/api`: Imports shared types for validation
- ✅ `@alchemy/mobile`: Imports Order and shipping types
- ✅ `@alchemy/core`: Re-exports game types
- ✅ `@alchemy/sdk`: Re-exports API types

**Impact**: Eliminated 200+ lines of duplicated type definitions

**Recommendations**:
- Continue consolidating any new types into this package
- Consider adding validation schemas (Zod) alongside types

---

### @alchemy/core ✅
**Status**: Well utilized

**Usage in @alchemy/web**:
- Ingredient types and utilities (`Ingredient`, `IngredientCategory`, `CATEGORY_INFO`)
- Blend state management (`BlendState`)
- Game logic (`getIngredientBaseAmount`, `getIngredientIncrementAmount`)
- Blog types (`PostCategory`)
- Utility functions (`getIngredientById`, `DEFAULT_BASE_AMOUNT`)

**Usage in @alchemy/api**:
- Game logic validation (`canCraftRecipe`, `getLevelFromTotalXp`)
- Type definitions (via `@alchemy/core` exports)
- Blog categories (`PostCategory`)
- Cart service uses `CustomBlendData` type

**Usage in @alchemy/mobile**:
- Not currently used (opportunity for improvement)

**Recommendations**:
- ✅ Continue using for shared game logic
- 🔄 Consider using ingredient utilities in mobile app
- 🔄 Move blog-specific logic to a dedicated `@alchemy/blog` package if it grows

---

### @alchemy/sdk ⚠️
**Status**: Underutilized

**Usage in @alchemy/web**:
- Blog admin pages use `AlchemyClient` for API calls
- Library pages use `AlchemyClient`

**Usage in @alchemy/mobile**:
- Not currently used - mobile app has custom API clients in `src/lib/`

**Usage in @alchemy/api**:
- Not applicable (backend)

**Issues Identified**:
- ❌ Mobile app duplicates API client logic instead of using SDK
- ❌ Web app has custom API clients (`catalog-api.ts`, `cart-api.ts`, etc.) alongside SDK usage
- ❌ Inconsistent API calling patterns

**Recommendations**:
- 🚨 **High Priority**: Migrate mobile app to use `@alchemy/sdk` instead of custom clients
- 🚨 **High Priority**: Consolidate web app's custom API clients into SDK
- Extend SDK with all endpoint types currently in custom clients
- Add React Query hooks to SDK for better DX

**Estimated Impact**:
- Remove ~400 lines of duplicated API client code
- Consistent error handling and request patterns
- Type-safe API calls across all apps

---

### @alchemy/ui ❌
**Status**: Not utilized (critical gap)

**Current State**:
- Package exists with 5 components: `Button`, `Card`, `Input`, `ProgressBar`, `Modal`
- Design tokens defined but not used
- **Zero imports** across all apps

**Issues Identified**:
- ❌ Web app has custom components instead of using shared UI
- ❌ Mobile app has no shared components with web
- ❌ Design system not enforced across apps
- ❌ Duplicate component logic likely exists

**Recommendations**:
- 🚨 **Critical**: Audit web components and identify candidates for @alchemy/ui
- Build out component library with commonly used components:
  - Form components (already has Input, need Select, Checkbox, etc.)
  - Layout components (Container, Stack, Grid)
  - Feedback components (Alert, Toast, Spinner)
  - Data display (Table, Badge, Tag)
- Add platform-specific implementations where needed (web vs native)
- Document component usage with Storybook
- Migrate existing components incrementally

**Estimated Impact**:
- Consistent UI/UX across web and mobile
- Reduce web app component code by ~30%
- Enable faster feature development
- Better accessibility and testing

---

## Dependency Graph

### Current State
```
@alchemy/types (standalone)
    ↓
@alchemy/core → @alchemy/types
    ↓
@alchemy/sdk → @alchemy/types
@alchemy/ui → (none - standalone)
    ↓
@alchemy/web → @alchemy/core, @alchemy/sdk (partial), @alchemy/types
@alchemy/mobile → @alchemy/core (unused), @alchemy/types
@alchemy/api → @alchemy/core, @alchemy/types
```

### Ideal State
```
@alchemy/types (standalone)
    ↓
@alchemy/core → @alchemy/types
@alchemy/ui → @alchemy/types
    ↓
@alchemy/sdk → @alchemy/types
    ↓
@alchemy/web → ALL packages
@alchemy/mobile → ALL packages
@alchemy/api → @alchemy/core, @alchemy/types
```

---

## Action Items

### High Priority
1. **Consolidate API Clients** (Est. 4-6 hours)
   - Extend `@alchemy/sdk` with all endpoints from custom clients
   - Add React Query integration to SDK
   - Migrate web app to use SDK exclusively
   - Migrate mobile app to use SDK

2. **Build Out UI Library** (Est. 8-12 hours)
   - Audit web components for candidates
   - Extract 10-15 core components to `@alchemy/ui`
   - Add Tailwind config to UI package for web
   - Add platform-specific variants for mobile

### Medium Priority
3. **Enable Mobile Core Usage** (Est. 2-3 hours)
   - Import and use ingredient utilities in mobile app
   - Use blend state management from core
   - Use XP/leveling utilities from core

4. **Add Storybook** (Est. 3-4 hours)
   - Set up Storybook for `@alchemy/ui`
   - Document all components with stories
   - Add accessibility tests

### Low Priority
5. **Add Validation Layer** (Est. 2-3 hours)
   - Add Zod schemas to `@alchemy/types`
   - Use for runtime validation in API
   - Share validation rules with frontend

6. **Consider Blog Package** (Est. 1-2 hours)
   - If blog logic grows, extract to `@alchemy/blog`
   - Include CMS utilities, renderers, etc.

---

## Metrics

### Code Duplication Eliminated
- **Types**: ~200 lines removed (✅ Complete)
- **API Clients**: ~400 lines potential (🔄 In Progress)
- **UI Components**: ~500+ lines potential (❌ Not Started)

### Build Performance
- Current build time: ~45s (all packages)
- With optimized Turborepo: ~30s (improved caching)
- Potential with SDK consolidation: ~25s (fewer dependencies)

### Developer Experience
- ✅ Type safety improved with centralized types
- ✅ Build pipeline optimized with Turborepo
- ⚠️ API consistency needs improvement (SDK)
- ❌ UI consistency needs improvement (@alchemy/ui)

---

## Conclusion

The monorepo has made significant progress with the addition of `@alchemy/types` and optimization of the build system. The highest impact next steps are:

1. **SDK Consolidation** - Will eliminate duplicate API client code and provide consistent patterns
2. **UI Library Development** - Will enable component reuse and consistent design
3. **Cross-App Utilities** - Better leverage core package in mobile app

These improvements will significantly enhance developer experience, reduce code duplication, and improve maintainability.
