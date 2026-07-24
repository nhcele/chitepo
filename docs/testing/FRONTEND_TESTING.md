# Frontend Testing Guide

This guide covers the testing setup and best practices for the Mindelta frontend application.

## 🧪 **Testing Stack**

### **Core Technologies:**
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **User Event** - Advanced user interaction simulation
- **MSW** - API mocking (optional, for integration tests)

### **Configuration Files:**
- `jest.config.js` - Jest configuration with Next.js setup
- `jest.setup.js` - Global test setup and mocks
- `test-utils.tsx` - Custom render utilities and helpers

## 📁 **Test Structure**

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
│   ├── CourseCard.tsx
│   └── CourseCard.test.tsx
├── pages/
│   ├── index.tsx
│   └── index.test.tsx
├── test-utils.tsx
└── __tests__/
    └── integration/
```

## 🚀 **Getting Started**

### **Installation:**
```bash
# Testing dependencies are already included in package.json
npm install --save-dev @testing-library/user-event
```

### **Run Tests:**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

## 📋 **Testing Commands**

### **Available Scripts:**
```bash
npm test                 # Run all tests once
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:ci         # Run tests for CI (no watch, coverage)
```

### **Coverage Reports:**
- Coverage reports are generated in `coverage/` directory
- Target coverage: 70% for branches, functions, lines, statements
- HTML report: `coverage/lcov-report/index.html`

## 🎯 **Testing Best Practices**

### **1. Test User Behavior, Not Implementation**
```tsx
// ✅ Good - Test what user sees and does
test('submits form when user clicks submit', async () => {
  const user = userEvent.setup()
  render(<ContactForm />)
  
  await user.type(screen.getByLabelText('Email'), 'test@example.com')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  
  expect(screen.getByText('Form submitted!')).toBeInTheDocument()
})

// ❌ Bad - Test implementation details
test('calls handleSubmit when submit button is clicked', () => {
  const handleSubmit = jest.fn()
  render(<ContactForm onSubmit={handleSubmit} />)
  
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
  
  expect(handleSubmit).toHaveBeenCalled()
})
```

### **2. Use Meaningful Queries**
```tsx
// ✅ Good - Accessible queries
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email address')
screen.getByPlaceholderText('Enter your email')

// ❌ Bad - Implementation-specific queries
container.querySelector('.submit-button')
container.querySelector('[data-testid="submit"]')
```

### **3. Test Component Variants**
```tsx
test('renders button with different variants', () => {
  const { rerender } = render(<Button variant="primary">Primary</Button>)
  expect(screen.getByRole('button')).toHaveClass('bg-blue-600')
  
  rerender(<Button variant="secondary">Secondary</Button>)
  expect(screen.getByRole('button')).toHaveClass('bg-gray-200')
})
```

### **4. Mock External Dependencies**
```tsx
// Mock API calls
jest.mock('@/lib/api', () => ({
  fetchCourses: jest.fn(() => Promise.resolve(mockCourses))
}))

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() })
}))
```

## 🔧 **Test Utilities**

### **Custom Render Function:**
```tsx
import { render } from '@/test-utils'

// Automatically wraps with providers (Router, Query, Theme)
render(<MyComponent />)
```

### **Mock Data Generators:**
```tsx
import { createMockCourse, createMockUser } from '@/test-utils'

const mockCourse = createMockCourse({ title: 'Custom Course' })
const mockUser = createMockUser({ role: 'instructor' })
```

### **Test Helpers:**
```tsx
import { waitForAsync, mockLocalStorage } from '@/test-utils'

// Wait for async operations
await waitForAsync()

// Mock localStorage
const localStorageMock = mockLocalStorage()
```

## 📝 **Component Testing Patterns**

### **1. Basic Component Test:**
```tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
  
  it('handles click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### **2. Component with Props:**
```tsx
test('renders different variants', () => {
  const variants = ['primary', 'secondary', 'outline']
  
  variants.forEach(variant => {
    const { unmount } = render(<Button variant={variant}>Test</Button>)
    expect(screen.getByRole('button')).toHaveClass(`btn-${variant}`)
    unmount()
  })
})
```

### **3. Component with State:**
```tsx
test('toggles visibility when button is clicked', async () => {
  const user = userEvent.setup()
  render(<ToggleComponent />)
  
  expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  
  await user.click(screen.getByRole('button', { name: 'Toggle' }))
  
  expect(screen.getByText('Hidden content')).toBeInTheDocument()
})
```

## 📄 **Page Testing Patterns**

### **1. Page with Data Fetching:**
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import HomePage from './index'

// Mock React Query
jest.mock('react-query', () => ({
  useQuery: () => ({
    data: mockCourses,
    isLoading: false,
    error: null,
  })
}))

describe('Home Page', () => {
  it('displays featured courses', async () => {
    render(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText('React Course')).toBeInTheDocument()
    })
  })
})
```

### **2. Page with Loading States:**
```tsx
test('shows loading skeleton while fetching data', () => {
  jest.mock('react-query', () => ({
    useQuery: () => ({ data: null, isLoading: true, error: null })
  }))
  
  render(<HomePage />)
  expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
})
```

### **3. Page with Error States:**
```tsx
test('shows error message when data fails to load', () => {
  jest.mock('react-query', () => ({
    useQuery: () => ({ data: null, isLoading: false, error: new Error('Failed') })
  }))
  
  render(<HomePage />)
  expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
})
```

## 🔗 **Integration Testing**

### **1. User Journey Testing:**
```tsx
test('user can search for courses and enroll', async () => {
  const user = userEvent.setup()
  render(<App />)
  
  // Search for a course
  await user.type(screen.getByPlaceholderText('Search courses'), 'react')
  await user.click(screen.getByRole('button', { name: 'Search' }))
  
  // Select a course
  await user.click(screen.getByText('React Fundamentals'))
  
  // Enroll in course
  await user.click(screen.getByRole('button', { name: 'Enroll Now' }))
  
  // Verify enrollment
  expect(screen.getByText('You are enrolled!')).toBeInTheDocument()
})
```

### **2. Form Submission Testing:**
```tsx
test('user can register with valid data', async () => {
  const user = userEvent.setup()
  render(<RegistrationPage />)
  
  await user.type(screen.getByLabelText('First Name'), 'John')
  await user.type(screen.getByLabelText('Last Name'), 'Doe')
  await user.type(screen.getByLabelText('Email'), 'john@example.com')
  await user.type(screen.getByLabelText('Password'), 'password123')
  await user.click(screen.getByRole('button', { name: 'Register' }))
  
  await waitFor(() => {
    expect(screen.getByText('Registration successful!')).toBeInTheDocument()
  })
})
```

## 🎨 **UI Testing Patterns**

### **1. Responsive Design Testing:**
```tsx
test('renders mobile layout on small screens', () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 640,
  })
  
  render(<Navigation />)
  expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
})
```

### **2. Accessibility Testing:**
```tsx
test('supports keyboard navigation', async () => {
  const user = userEvent.setup()
  render(<CourseCard course={mockCourse} />)
  
  const card = screen.getByRole('article')
  card.focus()
  
  await user.keyboard('{Enter}')
  
  expect(screen.getByText('Loading course details...')).toBeInTheDocument()
})
```

### **3. Theme Testing:**
```tsx
test('applies dark theme styles', () => {
  render(<ThemeProvider theme="dark">
    <Button>Dark Button</Button>
  </ThemeProvider>)
  
  expect(screen.getByRole('button')).toHaveClass('dark:bg-gray-800')
})
```

## 🔧 **Mocking Strategies**

### **1. API Mocking:**
```tsx
// __mocks__/lib/api.js
export const fetchCourses = jest.fn(() => Promise.resolve(mockCourses))
export const enrollInCourse = jest.fn(() => Promise.resolve({ success: true }))
```

### **2. Component Mocking:**
```tsx
jest.mock('@/components/ComplexComponent', () => ({
  ComplexComponent: ({ children }) => <div data-testid="complex-mock">{children}</div>
}))
```

### **3. Hook Mocking:**
```tsx
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, login: jest.fn() })
}))
```

## 📊 **Coverage Guidelines**

### **Target Coverage:**
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### **What to Test:**
- ✅ User interactions and behaviors
- ✅ Component rendering with different props
- ✅ Error states and loading states
- ✅ Form validation and submission
- ✅ Navigation and routing

### **What NOT to Test:**
- ❌ Implementation details (internal state, private methods)
- ❌ Third-party library functionality
- ❌ CSS styles (unless they affect functionality)
- ❌ Static content that never changes

## 🚨 **Common Testing Issues**

### **1. Act Warnings:**
```tsx
// ❌ Causes act warning
fireEvent.click(screen.getByRole('button'))

// ✅ Use userEvent for proper async handling
await user.click(screen.getByRole('button'))
```

### **2. Mock Implementation:**
```tsx
// ❌ Incomplete mock
jest.mock('next/router', () => ({}))

// ✅ Complete mock with all used methods
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  })
}))
```

### **3. Async Testing:**
```tsx
// ❌ Doesn't wait for updates
expect(screen.getByText('Success')).toBeInTheDocument()

// ✅ Wait for async updates
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

## 🛠 **Debugging Tests**

### **1. Screen Debug:**
```tsx
import { screen } from '@testing-library/react'

// Print entire DOM
screen.debug()

// Print specific element
screen.debug(screen.getByTestId('course-card'))
```

### **2. Logging Helpers:**
```tsx
test('debug test', () => {
  render(<MyComponent />)
  
  // Log helpful information
  console.log('Role options:', screen.getByRole('button', { name: /submit/i }))
  console.log('All buttons:', screen.getAllByRole('button'))
})
```

### **3. Visual Testing:**
```tsx
// Take screenshots for visual regression testing
import { toMatchSnapshot } from 'jest-image-snapshot'

expect.extend({ toMatchSnapshot })

test('component matches snapshot', () => {
  const { container } = render(<MyComponent />)
  expect(container).toMatchSnapshot()
})
```

## 📚 **Testing Resources**

### **Documentation:**
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [User Event Docs](https://testing-library.com/docs/user-event/intro/)

### **Best Practices:**
- [Testing Playground](https://testing-playground.com/)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-testing-mistakes)
- [Testing Best Practices](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

### **Advanced Topics:**
- Visual Regression Testing
- E2E Testing with Playwright
- Performance Testing
- Accessibility Testing

---

**Remember**: Good tests focus on user behavior and provide confidence that your application works as expected. Keep tests simple, readable, and maintainable! 🧪✨
