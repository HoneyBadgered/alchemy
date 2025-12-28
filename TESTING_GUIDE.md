# Testing Guide for Alchemy Project

This guide provides comprehensive information on running and writing tests for the Alchemy tea blending application.

## Table of Contents

- [Quick Start](#quick-start)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Goals](#coverage-goals)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Install Dependencies
```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### Run All Tests
```bash
# Run all tests across all workspaces
pnpm test

# Run with coverage
pnpm test:coverage
```

### Run Tests for Specific Package
```bash
# Backend API tests
cd apps/api && pnpm test

# Frontend web tests
cd apps/web && pnpm test

# Mobile app tests
cd apps/mobile && pnpm test
```

## Test Structure

### Backend API (`apps/api`)

```
apps/api/
├── src/
│   ├── __tests__/
│   │   ├── *.service.test.ts        # Service layer unit tests
│   │   ├── *.routes.test.ts         # API route tests
│   │   └── integration-*.test.ts    # Integration tests
│   ├── services/                    # Business logic
│   ├── routes/                      # API endpoints
│   └── utils/                       # Utilities
└── package.json
```

**Test Framework:** Jest  
**Test Count:** 19 service tests + 5 route tests + 3 integration tests  
**Coverage Target:** 80%+

### Frontend Web (`apps/web`)

```
apps/web/
├── src/
│   ├── __tests__/
│   │   └── integration/             # Integration tests
│   ├── components/
│   │   └── __tests__/               # Component tests
│   ├── contexts/
│   │   └── __tests__/               # Context tests
│   ├── hooks/
│   │   └── __tests__/               # Hook tests
│   └── store/
│       └── __tests__/               # State management tests
└── package.json
```

**Test Framework:** Vitest + React Testing Library  
**Test Count:** 18 test files, 113 tests  
**Coverage Target:** 80%+

### Mobile App (`apps/mobile`)

```
apps/mobile/
├── src/
│   ├── __tests__/                   # App-level tests
│   ├── components/
│   │   └── __tests__/               # Component tests
│   └── contexts/
│       └── __tests__/               # Context tests
└── package.json
```

**Test Framework:** Jest + React Native Testing Library  
**Test Count:** 1 test file, 10 tests  
**Coverage Target:** 70%+

## Running Tests

### Backend API

```bash
cd apps/api

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test auth.service.test.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="should create user"
```

### Frontend Web

```bash
cd apps/web

# Run all tests
pnpm test

# Run tests in UI mode
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test BlendingPage.test.tsx
```

### Mobile

```bash
cd apps/mobile

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Writing Tests

### API Service Tests

```typescript
// apps/api/src/__tests__/example.service.test.ts
import { ExampleService } from '../services/example.service';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    model: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('ExampleService', () => {
  let service: ExampleService;

  beforeEach(() => {
    service = new ExampleService();
    jest.clearAllMocks();
  });

  it('should create a record', async () => {
    const mockData = { id: '1', name: 'Test' };
    (prisma.model.create as jest.Mock).mockResolvedValue(mockData);

    const result = await service.create({ name: 'Test' });

    expect(result).toEqual(mockData);
    expect(prisma.model.create).toHaveBeenCalledWith({
      data: { name: 'Test' },
    });
  });
});
```

### API Route Tests

```typescript
// apps/api/src/__tests__/example.routes.test.ts
import Fastify, { FastifyInstance } from 'fastify';
import { exampleRoutes } from '../routes/example.routes';
import { ExampleService } from '../services/example.service';

jest.mock('../services/example.service');

describe('Example Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(exampleRoutes);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should handle GET request', async () => {
    const mockData = { id: '1', name: 'Test' };
    ExampleService.prototype.get = jest.fn().mockResolvedValue(mockData);

    const response = await app.inject({
      method: 'GET',
      url: '/example/1',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockData);
  });
});
```

### Integration Tests

```typescript
// apps/api/src/__tests__/integration-example.test.ts
import Fastify, { FastifyInstance } from 'fastify';
import { exampleRoutes } from '../routes/example.routes';
import { relatedRoutes } from '../routes/related.routes';
import { prisma } from '../utils/prisma';

jest.mock('../utils/prisma');

describe('Example Integration Flow', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(exampleRoutes);
    await app.register(relatedRoutes);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should complete full workflow', async () => {
    // Setup mocks
    (prisma.model.create as jest.Mock).mockResolvedValue({ id: '1' });
    
    // Step 1: Create
    const createResponse = await app.inject({
      method: 'POST',
      url: '/example',
      payload: { name: 'Test' },
    });
    expect(createResponse.statusCode).toBe(201);

    // Step 2: Retrieve
    const getResponse = await app.inject({
      method: 'GET',
      url: '/example/1',
    });
    expect(getResponse.statusCode).toBe(200);
  });
});
```

### Frontend Component Tests

```typescript
// apps/web/src/components/__tests__/Example.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExampleComponent } from '../ExampleComponent';

describe('ExampleComponent', () => {
  it('should render and handle interaction', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(<ExampleComponent onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
```

### Mobile Tests

```typescript
// apps/mobile/src/__tests__/Example.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ExampleComponent } from '../components/ExampleComponent';

describe('ExampleComponent', () => {
  it('should render and handle press', () => {
    const mockOnPress = jest.fn();

    const { getByText } = render(
      <ExampleComponent onPress={mockOnPress} />
    );

    const button = getByText('Press Me');
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

## Coverage Goals

### Overall Targets

| Layer | Current | Target | Priority |
|-------|---------|--------|----------|
| Backend Services | 85% | 85% | ✅ Met |
| Backend Routes | 15% | 70% | 🟡 High |
| Backend Integration | 60% | 100% | 🟡 High |
| Frontend Components | 65% | 80% | 🟡 High |
| Frontend Pages | 30% | 70% | 🔴 Critical |
| Mobile Overall | 15% | 70% | 🔴 Critical |

### Viewing Coverage Reports

```bash
# Backend
cd apps/api && pnpm test -- --coverage
# Open coverage/lcov-report/index.html in browser

# Frontend
cd apps/web && pnpm test:coverage
# Open coverage/lcov-report/index.html in browser

# Mobile
cd apps/mobile && pnpm test:coverage
# Open coverage/lcov-report/index.html in browser
```

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull request creation or update

Workflow file: `.github/workflows/test-coverage.yml`

### Coverage Reporting

- Coverage reports uploaded to Codecov
- PR comments show coverage changes
- Artifacts saved for 30 days
- Coverage trends tracked over time

### Running Locally Like CI

```bash
# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install --frozen-lockfile

# Generate Prisma client
cd apps/api && pnpm prisma generate

# Run tests with CI flags
cd apps/api && pnpm test -- --ci --coverage
cd apps/web && pnpm test:coverage -- --run
cd apps/mobile && pnpm test:coverage
```

## Best Practices

### DO:
- ✅ Write tests for new features before merging
- ✅ Mock external dependencies (Prisma, Stripe, APIs)
- ✅ Test both success and error cases
- ✅ Use descriptive test names
- ✅ Keep tests independent and isolated
- ✅ Test user-visible behavior, not implementation
- ✅ Clear mocks between tests

### DON'T:
- ❌ Skip writing tests to "save time"
- ❌ Test implementation details
- ❌ Share state between tests
- ❌ Use real database/API calls
- ❌ Ignore failing tests
- ❌ Write overly complex tests

## Troubleshooting

### Common Issues

#### Tests Failing After Dependency Update

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Regenerate Prisma types
cd apps/api && pnpm prisma generate
```

#### Mock Not Working

Ensure mocks are defined before imports:
```typescript
// ✓ Correct
jest.mock('../utils/prisma');
import { service } from '../service';

// ✗ Wrong
import { service } from '../service';
jest.mock('../utils/prisma');
```

#### TypeScript Errors in Tests

```bash
# Ensure test dependencies are installed
pnpm install --save-dev @types/jest
```

#### Tests Timing Out

Increase timeout for long-running tests:
```typescript
it('should complete long operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

#### Coverage Not Generated

```bash
# Backend: Ensure Jest is configured correctly
cd apps/api && cat jest.config.js

# Frontend: Ensure Vitest is configured correctly
cd apps/web && cat vitest.config.ts
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Fastify Testing](https://fastify.dev/docs/latest/Guides/Testing/)
- [TESTING.md](./TESTING.md) - Original testing documentation
- [COVERAGE_REPORT.md](./COVERAGE_REPORT.md) - Detailed coverage analysis

## Contributing

When adding new tests:

1. Follow existing test patterns in the codebase
2. Place tests in `__tests__` directories
3. Name files with `.test.ts` or `.test.tsx` suffix
4. Run tests locally before committing
5. Ensure coverage doesn't decrease
6. Update this guide if adding new testing patterns

## Support

For questions or issues with testing:
1. Check this guide and [TESTING.md](./TESTING.md)
2. Review existing test files for examples
3. Check the [COVERAGE_REPORT.md](./COVERAGE_REPORT.md) for coverage goals
4. Open an issue on GitHub for persistent problems
