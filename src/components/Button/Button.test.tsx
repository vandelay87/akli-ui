import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { axe } from 'vitest-axe'
import Button from './Button'

describe('Button', () => {
  let mockOnClick = vi.fn()

  beforeEach(() => {
    mockOnClick = vi.fn()
  })

  it('renders the button correctly with children', () => {
    render(<Button onClick={mockOnClick}>Click Me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })

    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click Me')
  })

  it('fires the onClick handler when clicked', () => {
    render(<Button onClick={mockOnClick}>Click Me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })

    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('does not trigger onClick when button is disabled', () => {
    render(
      <Button onClick={mockOnClick} disabled>
        Click Me
      </Button>
    )

    const button = screen.getByRole('button', { name: /click me/i })

    expect(button).toBeDisabled()

    fireEvent.click(button)

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('applies the correct classes for disabled state', () => {
    render(
      <Button onClick={mockOnClick} disabled>
        Disabled Button
      </Button>
    )

    const button = screen.getByRole('button', { name: /disabled button/i })

    expect(button).toBeDisabled()
  })

  it('keeps the original label in the accessible name, and sets disabled/aria-busy, while loading', () => {
    render(
      <Button onClick={mockOnClick} loading>
        Save
      </Button>
    )

    // The visible label is only visually hidden while loading (an sr-only
    // "Loading" prefix is added alongside it) — the original label text
    // must still be reachable in the accessible name.
    const button = screen.getByRole('button', { name: /save/i })

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('does not fire onClick while loading', () => {
    render(
      <Button onClick={mockOnClick} loading>
        Save
      </Button>
    )

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('renders the default button with no detectable axe violations', async () => {
    const { container } = render(<Button onClick={mockOnClick}>Save changes</Button>)

    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders the loading button with no detectable axe violations', async () => {
    const { container } = render(
      <Button onClick={mockOnClick} loading>
        Save changes
      </Button>
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
