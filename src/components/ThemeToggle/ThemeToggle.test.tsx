import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ThemeToggle from './ThemeToggle'

// jsdom does not implement `window.matchMedia` (confirmed empirically: a
// throwaway assertion of `typeof window.matchMedia` under this project's
// jsdom environment returns 'undefined', not 'function') — unlike the
// project's global IntersectionObserver mock (tests/setup.ts), this can't be
// a single fixed-behavior global default, since different test cases here
// need different `matches` results for the same mocked API. So it's
// constructed per test instead. Shaped like the real MediaQueryList
// (`matches`, `media`) plus every listener-registration method (both the
// modern EventTarget-style `addEventListener`/`removeEventListener` and the
// legacy `addListener`/`removeListener`) as no-op vi.fn()s, defensively:
// the real implementation may register a change listener to react to a live
// OS theme-preference switch (issue #5 has ThemeToggle "read...
// prefers-color-scheme", and a real-world component doing that plausibly
// also listens for changes to it), and a mock missing whichever method it
// calls would throw instead of the test failing on an assertion.
const mockMatchMedia = (matches: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

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
