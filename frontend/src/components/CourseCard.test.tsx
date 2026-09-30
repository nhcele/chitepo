import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CourseCard from './CourseCard'
import type { Course } from '@/types'

const mockCourse: Course = {
  id: '1',
  title: 'Test Course',
  subtitle: 'This is a test course subtitle',
  instructor: 'John Doe',
  rating: 4.5,
  students: 150,
  duration: 120, // 2 hours in minutes
  coverImage: 'https://example.com/thumbnail.jpg',
  difficulty: 'beginner'
}

describe('CourseCard Component', () => {
  it('renders course information correctly', () => {
    render(<CourseCard course={mockCourse} />)
    
    expect(screen.getByText('Test Course')).toBeInTheDocument()
    expect(screen.getByText('This is a test course subtitle')).toBeInTheDocument()
    expect(screen.getByText('by John Doe')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
  })

  it('displays course duration in human readable format', () => {
    render(<CourseCard course={mockCourse} />)
    
    expect(screen.getByText('2h 0m')).toBeInTheDocument()
  })

  it('displays difficulty level', () => {
    render(<CourseCard course={mockCourse} />)
    
    expect(screen.getByText('beginner')).toBeInTheDocument()
  })

  it('renders course image', () => {
    render(<CourseCard course={mockCourse} />)
    
    const image = screen.getByAltText('Test Course')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/thumbnail.jpg')
  })

  it('renders as a link to course details', () => {
    render(<CourseCard course={mockCourse} />)

    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('href', '/courses/1')
  })
})
