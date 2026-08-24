import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Card from './Card'
import styles from './Card.module.css'

describe('Card', () => {
  it('renders children inside a div by default', () => {
    render(<Card>Card content</Card>)

    const card = screen.getByText('Card content')

    expect(card).toBeInTheDocument()
    expect(card.tagName).toBe('DIV')
  })

  it('renders as the element passed via the "as" prop', () => {
    render(<Card as="section">Section content</Card>)

    const card = screen.getByText('Section content')

    expect(card.tagName).toBe('SECTION')
  })

  it('renders a real button with the shared focus ring when onClick is provided, and fires onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<Card onClick={handleClick}>Click me</Card>)

    const button = screen.getByRole('button', { name: /click me/i })

    expect(button).toHaveAttribute('type', 'button')
    // Card.module.css's `.asButton` composes the shared `focusRing` utility
    // from interactions.module.css. Vitest's CSS Modules transform doesn't
    // resolve cross-file `composes` merging (only Card.module.css's own
    // local token is present at test time), so we assert the `asButton`
    // class itself — the token that carries the focus ring in the real
    // stylesheet — rather than the composed class name directly.
    expect(button).toHaveClass(styles.asButton)

    await user.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies the fill class when fill is true', () => {
    render(<Card fill>Filled content</Card>)

    expect(screen.getByText('Filled content')).toHaveClass(styles.fill)
  })

  it('applies the hover class when hover is true', () => {
    render(<Card hover>Hoverable content</Card>)

    expect(screen.getByText('Hoverable content')).toHaveClass(styles.hover)
  })
})
