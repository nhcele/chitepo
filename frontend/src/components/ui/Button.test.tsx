import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary-600', 'text-white')
  })

  it('renders with variant secondary', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByRole('button', { name: 'Secondary Button' })
    
    expect(button).toHaveClass('bg-secondary-500', 'text-charcoal')
  })

  it('renders with variant outline', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button', { name: 'Outline Button' })
    
    expect(button).toHaveClass('border', 'border-border/60')
  })

  it('renders with variant ghost', () => {
    render(<Button variant="ghost">Ghost Button</Button>)
    const button = screen.getByRole('button', { name: 'Ghost Button' })
    
    expect(button).toHaveClass('hover:bg-forest-100')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    let button = screen.getByRole('button', { name: 'Small' })
    expect(button).toHaveClass('text-sm')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button', { name: 'Large' })
    expect(button).toHaveClass('text-base')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    
    const button = screen.getByRole('button', { name: 'Disabled' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders with loading state', () => {
    render(<Button loading>Loading</Button>)
    
    const button = screen.getByRole('button', { name: 'Loading' })
    expect(button).toBeDisabled()
    expect(button.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    
    const button = screen.getByRole('button', { name: 'Custom' })
    expect(button).toHaveClass('custom-class')
  })

  it('renders as link when href is provided', () => {
    render(
      <Button href="/test">
        Link Button
      </Button>
    )
    
    const link = screen.getByRole('link', { name: 'Link Button' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref Button</Button>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current).toBeInTheDocument()
  })

  it('applies focus styles when focused', () => {
    render(<Button>Focus Button</Button>)
    
    const button = screen.getByRole('button', { name: 'Focus Button' })
    button.focus()
    
    expect(button).toHaveFocus()
  })

  it('handles keyboard events', () => {
    const handleKeyDown = jest.fn()
    render(<Button onKeyDown={handleKeyDown}>Keyboard</Button>)
    
    const button = screen.getByRole('button', { name: 'Keyboard' })
    fireEvent.keyDown(button, { key: 'Enter' })
    
    expect(handleKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'Enter' })
    )
  })
})
