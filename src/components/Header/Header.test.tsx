import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import Header from './Header'

const renderWithRouter = (ui: ReactElement, { route = '/' } = {}) => {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}

const LINKS = [
  { label: 'Recipes', to: '/admin/recipes' },
  { label: 'Users', to: '/admin/users' },
]

// Header renders the real ThemeToggle (not mocked here, matching the source
// personal-website test's approach of exercising it for real). Unlike
// personal-website's original ThemeToggle, this repo's version also reads
// `prefers-color-scheme` via `window.matchMedia`, which jsdom does not
// implement — without this, ThemeToggle throws on mount and every Header
// test fails. None of the assertions below depend on which theme value
// ThemeToggle resolves to (they match `/switch to (dark|light) mode/i`), so
// a single fixed `matches` value is fine here — this is a minimal
// browser-API shim for the missing jsdom feature, not a mock of ThemeToggle
// itself. localStorage/data-theme are also reset each test so no run leaks
// state into the next.
beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

describe('Header', () => {
  it('renders a banner landmark', () => {
    renderWithRouter(<Header />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders the brand link pointing to brandTo', () => {
    renderWithRouter(<Header brand="akli.dev" brandTo="/admin" />)
    expect(screen.getByRole('link', { name: 'akli.dev' })).toHaveAttribute('href', '/admin')
  })

  it('renders the ThemeToggle in every variant', () => {
    const variants = ['public', 'admin', 'logged-out'] as const
    variants.forEach((variant) => {
      const { unmount } = renderWithRouter(<Header variant={variant} />)
      expect(screen.getByRole('button', { name: /switch to (dark|light) mode/i })).toBeInTheDocument()
      unmount()
    })
  })

  describe('public variant', () => {
    it('renders nav links and marks the active route with aria-current', () => {
      renderWithRouter(<Header variant="public" links={LINKS} />, { route: '/admin/recipes' })

      const recipesLink = screen.getByRole('link', { name: 'Recipes' })
      const usersLink = screen.getByRole('link', { name: 'Users' })

      expect(recipesLink).toHaveAttribute('aria-current', 'page')
      expect(usersLink).not.toHaveAttribute('aria-current')
    })

    it('renders no logout button or email', () => {
      renderWithRouter(<Header variant="public" links={LINKS} />)
      expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument()
    })
  })

  describe('admin variant', () => {
    it('renders the signed-in email and a working Log out button', () => {
      const onLogout = vi.fn()
      renderWithRouter(
        <Header variant="admin" links={LINKS} email="admin@example.com" onLogout={onLogout} />,
        { route: '/admin/recipes' }
      )

      expect(screen.getByText('admin@example.com')).toBeInTheDocument()

      const logoutButton = screen.getByRole('button', { name: /log out/i })
      fireEvent.click(logoutButton)

      expect(onLogout).toHaveBeenCalledTimes(1)
    })

    it('marks the active route with aria-current', () => {
      renderWithRouter(<Header variant="admin" links={LINKS} />, { route: '/admin/users' })

      expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: 'Recipes' })).not.toHaveAttribute('aria-current')
    })

    it('moves aria-current to the newly active link when navigating via click', () => {
      renderWithRouter(<Header variant="admin" links={LINKS} />, { route: '/admin/recipes' })

      expect(screen.getByRole('link', { name: 'Recipes' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: 'Users' })).not.toHaveAttribute('aria-current')

      fireEvent.click(screen.getByRole('link', { name: 'Users' }))

      expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('link', { name: 'Recipes' })).not.toHaveAttribute('aria-current')
    })
  })

  describe('logged-out variant', () => {
    it('renders no nav links and no logout button', () => {
      renderWithRouter(
        <Header variant="logged-out" links={LINKS} email="admin@example.com" onLogout={vi.fn()} />
      )

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Recipes' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument()
    })
  })

  describe('--header-height custom property', () => {
    afterEach(() => {
      document.documentElement.style.removeProperty('--header-height')
    })

    it('sets --header-height on the document root after mount', () => {
      renderWithRouter(<Header />)

      const headerHeight = document.documentElement.style.getPropertyValue('--header-height')

      expect(headerHeight).not.toBe('')
      expect(headerHeight).toMatch(/^\d+(\.\d+)?px$/)
    })
  })
})
