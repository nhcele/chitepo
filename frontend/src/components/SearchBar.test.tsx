import React from 'react'
import { render, screen } from '@testing-library/react'
import SearchBar from './SearchBar'

describe('SearchBar Component', () => {
  it('renders search bar when open', () => {
    render(<SearchBar isOpen={true} onClose={jest.fn()} />)
    
    expect(screen.getByPlaceholderText(/search courses, instructors, topics/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<SearchBar isOpen={false} onClose={jest.fn()} />)
    
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument()
  })

  it('shows empty state when no query', () => {
    render(<SearchBar isOpen={true} onClose={jest.fn()} />)
    
    expect(screen.getByText(/find courses, instructors, and topics quickly/i)).toBeInTheDocument()
  })
})
