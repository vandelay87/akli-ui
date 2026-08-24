import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { expectNoA11yViolations, mockMatchMedia } from '../../../tests/setup'
import ThemeToggle from './ThemeToggle'

describe('ThemeToggle self-contained mount (CSR-only, no bootstrap script)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('with no data-theme and no localStorage value, falls back to a dark system preference: sets data-theme="dark" and renders "Switch to light mode"', () => {
    mockMatchMedia(true)

    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('with no data-theme and no localStorage value, falls back to a light system preference: sets data-theme="light" and renders "Switch to dark mode"', () => {
    mockMatchMedia(false)

    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  })

  it('with no data-theme, prefers the localStorage value over system preference: uses "dark" from localStorage even though the system prefers light', () => {
    localStorage.setItem('theme', 'dark')
    mockMatchMedia(false)

    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('when data-theme is already set on <html> (opt-in bootstrap script already ran), respects it as-is and does not override with a conflicting localStorage value', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'dark')
    mockMatchMedia(true)

    render(<ThemeToggle />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  })
})

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    // Unlike personal-website's original ThemeToggle (which this test block
    // is ported from), this repo's version also reads `prefers-color-scheme`
    // via `window.matchMedia` as a fallback when neither data-theme nor
    // localStorage is set — jsdom doesn't implement matchMedia at all, so
    // that fallback path throws without a mock. Only the first test below
    // (no data-theme set beforehand) actually hits that path; the rest set
    // data-theme before rendering, which short-circuits before matchMedia is
    // ever called. A fixed value is fine here since none of this block's
    // assertions depend on system-preference resolution — that's covered by
    // the describe block above.
    mockMatchMedia(false)
  })

  it('renders a round icon button with an accessible label describing the switch action', () => {
    render(<ThemeToggle />)

    expect(
      screen.getByRole('button', { name: /switch to (dark|light) mode/i })
    ).toBeInTheDocument()
  })

  it('renders with no detectable axe violations', async () => {
    const { container } = render(<ThemeToggle />)

    await expectNoA11yViolations(container)
  })

  it('labels the button "Switch to dark mode" when the current theme is light', () => {
    document.documentElement.setAttribute('data-theme', 'light')

    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  })

  it('reflects the theme already set on the document root on initial render (no hydration mismatch)', () => {
    // Simulates the blocking no-flash script having already set data-theme
    // before React mounts. The toggle must reflect that on first render,
    // not default to assuming light.
    document.documentElement.setAttribute('data-theme', 'dark')

    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('flips data-theme on the document root and updates its label when clicked', () => {
    document.documentElement.setAttribute('data-theme', 'light')

    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }))

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  })

  it('persists the new theme to the existing "theme" localStorage key (kept, not renamed)', () => {
    document.documentElement.setAttribute('data-theme', 'light')

    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(localStorage.getItem('theme')).toBe('dark')
    // The design reference's `akli-theme` key is an explicit non-adoption per the PRD.
    expect(localStorage.getItem('akli-theme')).toBeNull()
  })
})
