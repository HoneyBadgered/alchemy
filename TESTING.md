# Testing Documentation

## Overview

This project uses comprehensive automated testing to ensure code quality and reliability across all layers:

- **Unit Tests** - Test individual functions and classes in isolation
- **Integration Tests** - Test how different parts of the system work together
- **End-to-End Tests** - Test complete user workflows (not yet implemented)

## Test Structure

```
alchemy/
├── packages/core/          # Core game logic tests
│   ├── src/xp/__tests__/
│   ├── src/crafting/__tests__/
│   └── src/quests/__tests__/
├── apps/api/               # Backend API tests
│   └── src/__tests__/
└── apps/web/               # Frontend tests
    └── src/store/__tests__/
```

## Running Tests

### Run All Tests

```bash
# From root directory
npm run test
```

This will run tests across all workspaces using Turborepo.

### Run Tests for Specific Workspace

```bash
# Core package tests
npm run test --workspace=@alchemy/core

# API tests
npm run test --workspace=@alchemy/api

# Web app tests
npm run test --workspace=@alchemy/web
```

### Run Tests in Watch Mode

```bash
cd packages/core && npm run test -- --watch
cd apps/api && npm run test -- --watch
cd apps/web && npm run test -- --watch
```

### Run Tests with Coverage

```bash
cd packages/core && npm run test -- --coverage
cd apps/api && npm run test -- --coverage
cd apps/web && npm run test -- --coverage
```

## Test Coverage

### Core Package (`@alchemy/core`)

**Total: 44 tests** across 3 test suites

#### XP System (`src/xp/__tests__/xp.test.ts`) - 14 tests
Tests the experience point system that drives player progression:
- `getXpForLevel()` - Calculates XP required for each level
- `getTotalXpForLevel()` - Calculates cumulative XP for a level
- `getLevelFromTotalXp()` - Determines player level from total XP
- `getXpProgressInLevel()` - Calculates progress within current level
- `addXp()` - Handles XP gains and level-ups

#### Crafting System (`src/crafting/__tests__/crafting.test.ts`) - 30 tests
Tests the recipe crafting mechanics:
- `hasRequiredIngredients()` - Validates ingredient availability
- `meetsLevelRequirement()` - Checks level prerequisites
- `canCraftRecipe()` - Comprehensive crafting validation
- `craftRecipe()` - Executes crafting and updates inventory

**Key scenarios tested:**
- Ingredient quantity validation
- Level requirements
- Inventory updates after crafting
- Multiple crafting operations
- Edge cases (exact quantities, zero quantities)

#### Quest System (`src/quests/__tests__/quests.test.ts`) - 13 tests
Tests quest eligibility and rewards:
- `isQuestEligible()` - Checks if player can start a quest
- `getAvailableQuests()` - Filters quests by player level
- `calculateQuestXpReward()` - Sums XP rewards from quests

### API Package (`@alchemy/api`)

**Total: 89 tests** across 9 service test suites

#### Auth Service (`src/__tests__/auth.service.test.ts`) - 16 tests
Tests authentication and user management:
- User registration with password validation
- Login/logout functionality
- Password reset flow
- Email verification
- Refresh token management

**Security features tested:**
- Password strength requirements (8+ chars, uppercase, numbers)
- Duplicate email/username detection
- Token expiration handling

#### Payment Service (`src/__tests__/payment.service.test.ts`) - 9 tests
Tests Stripe payment integration:
- Payment intent creation
- Payment status tracking
- Webhook event processing
- Idempotent webhook handling

**Key scenarios:**
- Order validation before payment
- Existing payment intent reuse
- Stripe webhook signature verification
- Duplicate event prevention

#### Cart Service (`src/__tests__/cart.service.test.ts`) - 12 tests
Tests shopping cart functionality:
- Cart creation and retrieval
- Adding/updating/removing items
- Stock validation
- Guest vs authenticated carts

#### Order Service (`src/__tests__/order.service.test.ts`) - 7 tests
Tests order placement and management:
- Order creation from cart
- Stock validation during checkout
- Order history retrieval
- Order access control

#### Catalog Service (`src/__tests__/catalog.service.test.ts`) - 5 tests
Tests product catalog:
- Product listing with pagination
- Category filtering
- Product details retrieval
- Active product validation

#### Cosmetics Service (`src/__tests__/cosmetics.service.test.ts`) - 5 tests
Tests cosmetic items and themes:
- Theme and skin retrieval
- Player cosmetics management
- Unlock tracking

#### Crafting Service (`src/__tests__/crafting.service.test.ts`) - 8 tests
Tests server-side crafting logic:
- Recipe retrieval
- Crafting validation (level, ingredients)
- Inventory updates via transactions
- XP rewards

#### Gamification Service (`src/__tests__/gamification.service.test.ts`) - 11 tests
Tests player progression features:
- Player progress tracking (level, XP, streaks)
- Quest management
- Quest reward claiming
- Inventory management

**Reward types tested:**
- XP rewards
- Ingredient rewards
- Cosmetic unlocks

#### Labels Service (`src/__tests__/labels.service.test.ts`) - 15 tests
Tests AI-powered label generation:
- Label generation for paid orders
- Label customization (style, tone, flavor notes)
- Label approval workflow
- Access control (user ownership)

**Key scenarios:**
- Generation with custom prompts
- Draft/approved status management
- Update restrictions on approved labels

### Web Package (`@alchemy/web`)

**Total: 11 tests** for auth store

#### Auth Store (`src/store/__tests__/authStore.test.ts`) - 11 tests
Tests Zustand state management for authentication:
- Initial state validation
- Setting/clearing authentication
- User updates
- Loading state management
- LocalStorage persistence
- Graceful error handling for corrupted data

**Features tested:**
- State persistence across sessions
- Partial state persistence (excluding loading state)
- State hydration on app initialization

## Test Patterns and Best Practices

### 1. Mocking Dependencies

All external dependencies (Prisma, Stripe, etc.) are mocked to ensure fast, isolated unit tests:

```typescript
jest.mock('../utils/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));
```

### 2. Test Organization

Tests are organized using `describe` blocks for clarity:

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should handle specific scenario', () => {
      // Test implementation
    });
  });
});
```

### 3. Clean State Management

Always reset mocks and state before each test:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  useStore.setState(initialState);
  localStorage.clear();
});
```

### 4. Testing Error Cases

Always test both success and error scenarios:

```typescript
it('should throw error if user not found', async () => {
  mockPrisma.user.findFirst.mockResolvedValue(null);
  
  await expect(
    service.getUser('user-1')
  ).rejects.toThrow('User not found');
});
```

### 5. Testing Business Logic

Focus on validating business rules:

```typescript
it('should reject weak passwords', async () => {
  await expect(
    authService.register({
      email: 'test@example.com',
      password: 'weak',  // Too short
      username: 'testuser',
    })
  ).rejects.toThrow('Password must be at least 8 characters long');
});
```

## Adding New Tests

### For Core Logic

1. Create test file: `packages/core/src/<feature>/__tests__/<feature>.test.ts`
2. Import functions to test
3. Write test cases covering:
   - Happy path scenarios
   - Edge cases
   - Error conditions
   - Boundary values

### For API Services

1. Create test file: `apps/api/src/__tests__/<service>.service.test.ts`
2. Mock Prisma and external dependencies
3. Test each service method with:
   - Valid inputs
   - Invalid inputs
   - Permission checks
   - Database transaction behavior

### For Frontend Components/Stores

1. Create test file: `apps/web/src/<feature>/__tests__/<component>.test.tsx`
2. Use React Testing Library for component tests
3. Test user interactions and state changes
4. Mock API calls and external dependencies

## Continuous Integration

Tests are automatically run on:
- Pull request creation
- Commits to main branch
- Release preparation

CI will fail if:
- Any test fails
- Code coverage drops below threshold (if configured)
- Tests take too long (timeout)

## Future Improvements

### Integration Tests
- API endpoint integration tests
- Database migration tests
- Webhook integration tests

### End-to-End Tests
- User registration and login flow
- Shopping and checkout flow
- Crafting workflow
- Quest completion flow

### Performance Tests
- Load testing for API endpoints
- Database query optimization
- Frontend rendering performance

## Troubleshooting

### Tests Failing Locally

1. **Clear node_modules and reinstall:**
   ```bash
   npm run clean
   npm install
   ```

2. **Regenerate Prisma types:**
   ```bash
   cd apps/api
   npm run prisma:generate
   ```

3. **Check Node version:**
   ```bash
   node --version  # Should be >= 20.19.4
   ```

### Mock Not Working

Ensure mocks are defined before imports:
```typescript
// ✓ Correct - mock first
jest.mock('../utils/prisma');
import { service } from '../service';

// ✗ Wrong - import first
import { service } from '../service';
jest.mock('../utils/prisma');
```

### TypeScript Errors in Tests

Ensure test dependencies are installed:
```bash
npm install --save-dev @types/jest
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Zustand Testing](https://docs.pmnd.rs/zustand/guides/testing)
- [Testing Best Practices](https://testingjavascript.com/)
