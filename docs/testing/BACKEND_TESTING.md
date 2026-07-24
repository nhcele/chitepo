# Testing Framework Documentation

## Overview

The Mindelta backend includes a comprehensive testing framework with unit tests, integration tests, and end-to-end (E2E) tests using Jest and Playwright.

## Testing Structure

```
backend/
├── src/
│   ├── auth/
│   │   └── auth.service.spec.ts          # Unit tests
│   ├── courses/
│   │   └── courses.service.spec.ts       # Unit tests
│   ├── instructor/
│   │   ├── instructor.service.spec.ts    # Unit tests
│   │   └── payout.service.spec.ts        # Unit tests
│   └── ...
├── test/
│   ├── setup.ts                          # Global test setup
│   └── courses.integration.spec.ts       # Integration tests
├── e2e/
│   ├── auth.e2e.spec.ts                  # E2E tests
│   ├── courses.e2e.spec.ts               # E2E tests
│   ├── ai-companion.e2e.spec.ts          # E2E tests
│   ├── performance.spec.ts               # Performance tests
│   ├── helpers/
│   │   └── test-helpers.ts               # Test utilities
│   ├── test-data/
│   │   └── test-data-manager.ts          # Test data management
│   └── global-setup.ts                   # E2E setup
├── jest.config.js                        # Jest configuration
├── playwright.config.ts                  # Playwright configuration
└── package.json                          # Test scripts
```

## Test Types

### 1. Unit Tests
- **Purpose**: Test individual functions and methods in isolation
- **Tools**: Jest, mocking libraries
- **Coverage**: Core services, utilities, business logic
- **Location**: `src/**/*.spec.ts`

### 2. Integration Tests
- **Purpose**: Test interaction between multiple components/services
- **Tools**: Jest, Supertest, test database
- **Coverage**: API endpoints, database operations
- **Location**: `test/**/*.spec.ts`

### 3. End-to-End (E2E) Tests
- **Purpose**: Test complete user flows in the browser
- **Tools**: Playwright
- **Coverage**: User journeys, UI interactions, performance
- **Location**: `e2e/**/*.spec.ts`

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test -- --testPathPattern=auth.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should login"
```

### E2E Tests

```bash
# Install Playwright browsers
npm run test:e2e:install

# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific E2E test file
npx playwright test auth.e2e.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium
```

### Performance Testing

```bash
# Run performance tests
npx playwright test performance.spec.ts

# Run with performance tracing
npx playwright test --trace on
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.(t|j)s',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/test/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  modulePathIgnorePatterns: ['<rootDir>/../test/'],
};
```

### Playwright Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run start:dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

## Test Data Management

### Test Data Manager

The `test-data-manager.ts` provides utilities for managing test data:

```typescript
import { TestDataManager } from '../test-data/test-data-manager';

// Get predefined test users
const instructor = TestDataManager.getTestUser('instructor');
const learner = TestDataManager.getTestUser('learner');

// Generate random test data
const newUser = TestDataManager.generateRandomUser('learner');
const newCourse = TestDataManager.generateRandomCourse(instructor.id);
```

### Test Helpers

The `test-helpers.ts` provides common E2E utilities:

```typescript
import { TestHelpers } from '../helpers/test-helpers';

const helpers = new TestHelpers(page);

// Login with test credentials
await helpers.login('instructor@mindelta.com', 'password123');

// Create test course
const courseUrl = await helpers.createTestCourse({
  title: 'Test Course',
  description: 'Test Description',
  difficulty: 'beginner',
  price: '99.99',
  estimatedDuration: '120'
});
```

## Mocking & Fixtures

### Global Setup (`test/setup.ts`)

Global test setup includes:
- Environment variable configuration
- External service mocking (OpenAI, Pinecone, AWS, etc.)
- Database connection setup
- Common test utilities

### Service Mocking

```typescript
// Mock external services
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock AI response' } }]
        })
      }
    }
  })),
}));

// Mock repositories
const mockUsersRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
```

## Coverage Reports

### Generating Coverage

```bash
# Generate coverage report
npm run test:cov

# Generate coverage for specific file
npm run test:cov -- --testPathPattern=auth.service.spec.ts

# Open coverage report in browser
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Coverage thresholds are configured in `jest.config.js`:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## Performance Testing

### Core Web Vitals

Performance tests monitor:
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Load Testing

```typescript
test('should handle concurrent users', async ({ browser }) => {
  const concurrentUsers = 5;
  const promises = [];
  
  for (let i = 0; i < concurrentUsers; i++) {
    // Create concurrent sessions
    const promise = simulateUserSession(browser);
    promises.push(promise);
  }
  
  const results = await Promise.all(promises);
  // Assert performance requirements
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:cov
      - run: npm run test:e2e:install
      - run: npm run test:e2e
```

## Best Practices

### Unit Tests
1. **Test one thing at a time** - Each test should focus on a single behavior
2. **Use descriptive names** - Test names should clearly describe what is being tested
3. **Arrange, Act, Assert** - Structure tests with clear setup, execution, and verification
4. **Mock external dependencies** - Isolate the unit under test
5. **Test edge cases** - Cover error conditions and boundary values

### Integration Tests
1. **Use test database** - Don't test against production data
2. **Test real interactions** - Test actual API endpoints and database operations
3. **Clean up after tests** - Ensure tests don't interfere with each other
4. **Test error scenarios** - Verify proper error handling
5. **Use realistic data** - Test with data similar to production

### E2E Tests
1. **Focus on user journeys** - Test complete user workflows
2. **Use page objects** - Organize locators and actions by page
3. **Wait for elements** - Use explicit waits instead of fixed delays
4. **Test multiple browsers** - Ensure cross-browser compatibility
5. **Include accessibility** - Test for accessibility compliance

## Debugging Tests

### Jest Debugging

```bash
# Run tests in debug mode
npm run test:debug

# Run specific test in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand auth.service.spec.ts
```

### Playwright Debugging

```bash
# Run E2E tests in debug mode
npm run test:e2e:debug

# Run with trace viewer
npx playwright test --trace on
npx playwright show-trace trace.zip

# Generate test code
npm run test:e2e:codegen
```

## Troubleshooting

### Common Issues

1. **Test timeout**: Increase `testTimeout` in Jest config
2. **Database connection**: Ensure test database is running
3. **Port conflicts**: Check if test server port is available
4. **Memory leaks**: Use `--detectOpenHandles` and `--forceExit` flags
5. **Mock failures**: Verify mock implementations match actual interfaces

### Performance Issues

1. **Slow tests**: Use parallel execution and selective test runs
2. **Memory usage**: Clean up resources and use proper mocking
3. **Network delays**: Mock external API calls in unit tests
4. **Browser startup**: Use `reuseExistingServer` in Playwright config

## Future Enhancements

1. **Visual Regression Testing**: Add visual comparison tests
2. **API Contract Testing**: Implement API schema validation
3. **Load Testing**: Add comprehensive load testing with k6
4. **Accessibility Testing**: Integrate axe-core for automated a11y testing
5. **Component Testing**: Add React component testing with Testing Library
