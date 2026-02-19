import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
          <Toaster />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Custom matchers
export const expectElementToBeInTheDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text)
}

export const expectElementToHaveClass = (element: HTMLElement | null, className: string) => {
  expect(element).toHaveClass(className)
}

// Mock data generators
export const createMockUser = (overrides = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'USER',
  avatar: null,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  ...overrides,
})

export const createMockCourse = (overrides = {}): Course => ({
  id: 'course-123',
  title: 'Test Course',
  subtitle: 'Test Subtitle',
  description: 'Test Description',
  difficulty: 'BEGINNER',
  duration: 180,
  price: 99.99,
  thumbnail: null,
  status: 'PUBLISHED',
  instructorId: 'instructor-123',
  tags: ['test'],
  estimatedDuration: 180,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  ...overrides,
})

export const createMockModule = (overrides = {}): Module => ({
  id: 'module-123',
  title: 'Test Module',
  description: 'Test Module Description',
  orderIndex: 1,
  courseId: 'course-123',
  estimatedDurationMin: 60,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  ...overrides,
})

export const createMockLesson = (overrides = {}): Lesson => ({
  id: 'lesson-123',
  title: 'Test Lesson',
  content: 'Test Content',
  orderIndex: 1,
  moduleId: 'module-123',
  type: 'VIDEO',
  durationSeconds: 1800,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  ...overrides,
})

export const createMockEnrollment = (overrides = {}): Enrollment => ({
  id: 'enrollment-123',
  userId: 'user-123',
  courseId: 'course-123',
  progressPercent: 50,
  completedAt: null,
  enrolledAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  ...overrides,
})

export const createMockNotification = (overrides = {}): Notification => ({
  id: 'notification-123',
  userId: 'user-123',
  title: 'Test Notification',
  message: 'Test Message',
  type: 'INFO',
  read: false,
  createdAt: '2023-01-01T00:00:00Z',
  ...overrides,
})

// Mock API responses
export const createMockApiResponse = function<T>(data: T, success = true) {
  return {
    success,
    data,
    message: success ? 'Success' : 'Error',
    errors: success ? [] : ['Error message'],
  }
}

export const createMockPaginatedResponse = function<T>(data: T[], total = data.length) {
  return {
    data,
    pagination: {
      page: 1,
      limit: 10,
      total,
      totalPages: Math.ceil(total / 10),
      hasNext: total > 10,
      hasPrev: false,
    },
  }
}

// Test utilities
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

export const mockIntersectionObserver = () => {
  const observe = jest.fn()
  const unobserve = jest.fn()
  const disconnect = jest.fn()

  // @ts-ignore
  global.IntersectionObserver = jest.fn(() => ({
    observe,
    unobserve,
    disconnect,
  }))

  return { observe, unobserve, disconnect }
}

export const mockResizeObserver = () => {
  const observe = jest.fn()
  const unobserve = jest.fn()
  const disconnect = jest.fn()

  // @ts-ignore
  global.ResizeObserver = jest.fn(() => ({
    observe,
    unobserve,
    disconnect,
  }))

  return { observe, unobserve, disconnect }
}

export const mockMediaQuery = (matches = false) => {
  // @ts-ignore
  global.matchMedia = jest.fn().mockImplementation(query => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
}

export const mockLocalStorage = () => {
  const store: Record<string, string> = {}

  // @ts-ignore
  global.localStorage = {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }
}

export const mockSessionStorage = () => {
  const store: Record<string, string> = {}

  // @ts-ignore
  global.sessionStorage = {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }
}

// React testing utilities
export const withAuth = (component: React.ReactElement, user: User) => {
  return (
    <AllTheProviders>
      {component}
    </AllTheProviders>
  )
}

export const withRouter = (component: React.ReactElement, initialEntries = ['/']) => {
  return (
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

// Form testing utilities
export const fillForm = async (form: HTMLElement, data: Record<string, string>) => {
  const inputs = form.querySelectorAll('input, textarea, select')
  
  inputs.forEach(input => {
    const element = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    const name = element.getAttribute('name')
    
    if (name && data[name]) {
      if (element.tagName === 'SELECT') {
        const select = element as HTMLSelectElement
        select.value = data[name]
      } else {
        const inputElement = element as HTMLInputElement | HTMLTextAreaElement
        inputElement.value = data[name]
      }
      
      element.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
}

export const submitForm = async (form: HTMLElement) => {
  form.dispatchEvent(new Event('submit', { bubbles: true }))
}

// Accessibility testing utilities
export const testAccessibility = async (container: HTMLElement) => {
  const buttons = container.querySelectorAll('button')
  const inputs = container.querySelectorAll('input, textarea, select')
  
  buttons.forEach(button => {
    expect(button).toHaveAttribute('aria-label')
  })
  
  inputs.forEach(input => {
    expect(input).toHaveAttribute('aria-label')
  })
}

// Performance testing utilities
export const measureRenderTime = async (component: React.ReactElement) => {
  const start = performance.now()
  customRender(component)
  const end = performance.now()
  
  return end - start
}

// Error boundary testing utilities
export const createErrorBoundary = (onError: jest.Mock) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props)
      this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
      return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      onError(error, errorInfo)
    }

    render() {
      if (this.state.hasError) {
        return <div>Something went wrong</div>
      }

      return this.props.children
    }
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }
export { default as userEvent } from '@testing-library/user-event'
