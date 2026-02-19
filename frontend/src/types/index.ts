// User Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'student' | 'instructor' | 'admin'
  bio?: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

// Course Types (matching actual component structure)
export interface Course {
  id: string
  title: string
  subtitle: string
  instructor: string
  rating: number
  students: number
  duration: number // in minutes
  coverImage: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

// UI Component Props
export interface CourseCardProps {
  course: Course
  variant?: 'default' | 'compact' | 'featured'
  loading?: boolean
  bookmarkable?: boolean
  bookmarked?: boolean
  showProgress?: boolean
  progress?: number
  onClick?: (course: Course) => void
  onBookmark?: (courseId: string) => void
  className?: string
}

export interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  suggestions?: string[]
  loading?: boolean
  className?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Form Types
export interface LoginForm {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterForm {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'student' | 'instructor'
  agreeToTerms: boolean
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
