import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { expectNoA11yViolations } from '../../../tests/setup'
import interactions from '../../styles/interactions.module.css'
import Link from './Link'
import styles from './Link.module.css'

describe('Link', () => {
  it('renders correctly with children', () => {
    render(
      <MemoryRouter>
        <Link to="/apps">Apps</Link>
      </MemoryRouter>
    )

    const linkElement = screen.getByRole('link', { name: /apps/i })

    expect(linkElement).toBeInTheDocument()
    expect(linkElement).toHaveTextContent('Apps')
  })

  it('points to the correct destination', () => {
    render(
      <MemoryRouter>
        <Link to="/apps">Apps</Link>
      </MemoryRouter>
    )

    const linkElement = screen.getByRole('link', { name: /apps/i })

    expect(linkElement).toHaveAttribute('href', '/apps')
  })

  it('renders as an external anchor tag when "to" is a URL', () => {
    const externalUrl = 'https://google.com'
    render(
      <MemoryRouter>
        <Link to={externalUrl}>External Site</Link>
      </MemoryRouter>
    )

    const linkElement = screen.getByRole('link', { name: /external site/i })

    expect(linkElement).toHaveAttribute('href', externalUrl)
    expect(linkElement).toHaveAttribute('target', '_blank')
    expect(linkElement).toHaveAttribute('rel', 'noreferrer')
  })

  it('wraps the icon in an aria-hidden element so it does not gain its own accessible name', () => {
    render(
      <MemoryRouter>
        <Link to="/apps" icon={<span data-testid="icon">{'→'}</span>}>
          Apps
        </Link>
      </MemoryRouter>
    )

    const icon = screen.getByTestId('icon')

    expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true')

    // The icon must not contribute to the accessible name — only the
    // link's own text should.
    const linkElement = screen.getByRole('link', { name: 'Apps' })
    expect(linkElement).toBeInTheDocument()
  })

  it('positions the icon before the link text when iconSide is "left"', () => {
    render(
      <MemoryRouter>
        <Link to="/apps" icon={<span data-testid="icon" />} iconSide="left">
          <span data-testid="text">Apps</span>
        </Link>
      </MemoryRouter>
    )

    const linkElement = screen.getByRole('link')
    const icon = within(linkElement).getByTestId('icon')
    const text = within(linkElement).getByTestId('text')

    expect(icon.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('positions the icon after the link text when iconSide is "right" (default)', () => {
    render(
      <MemoryRouter>
        <Link to="/apps" icon={<span data-testid="icon" />}>
          <span data-testid="text">Apps</span>
        </Link>
      </MemoryRouter>
    )

    const linkElement = screen.getByRole('link')
    const icon = within(linkElement).getByTestId('icon')
    const text = within(linkElement).getByTestId('text')

    expect(text.compareDocumentPosition(icon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('has no underline by default', () => {
    render(
      <MemoryRouter>
        <Link to="/apps">Apps</Link>
      </MemoryRouter>
    )

    const linkElement = screen.getByRole('link', { name: /apps/i })

    expect(linkElement).not.toHaveClass(styles.underline)
  })

  it('applies the underline class when the underline prop is set', () => {
    render(
      <MemoryRouter>
        <Link to="/apps" underline>
          Apps
        </Link>
      </MemoryRouter>
    )

    const linkElement = screen.getByRole('link', { name: /apps/i })

    expect(linkElement).toHaveClass(styles.underline)
  })

  it('applies the tone class for the given tone', () => {
    render(
      <MemoryRouter>
        <Link to="/apps" tone="accent">
          Apps
        </Link>
      </MemoryRouter>
    )

    const linkElement = screen.getByRole('link', { name: /apps/i })

    expect(linkElement).toHaveClass(styles.accent)
  })

  it('applies the nudge direction class to the link itself, not the icon', () => {
    render(
      <MemoryRouter>
        <Link to="/apps" icon={<span data-testid="icon" />} nudge="left">
          Apps
        </Link>
      </MemoryRouter>
    )

    const icon = screen.getByTestId('icon')
    const linkElement = screen.getByRole('link', { name: /apps/i })

    // The CSS is a `.nudgeX:hover .linkIcon` ancestor/descendant rule, so
    // hovering anywhere on the link (not just the icon glyph) must trigger
    // the icon's transform — the nudge class has to sit on the link, and
    // the icon's own wrapper must not carry it (or the rule can never match).
    expect(linkElement).toHaveClass(interactions.nudgeLeft)
    expect(icon.parentElement).not.toHaveClass(interactions.nudgeLeft)
  })

  it('renders an internal link with no detectable axe violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Link to="/apps" icon={<span aria-hidden="true">{'→'}</span>}>
          View apps
        </Link>
      </MemoryRouter>
    )

    await expectNoA11yViolations(container)
  })
})
