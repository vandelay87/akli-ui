import Button from '@components/Button'
import ThemeToggle from '@components/ThemeToggle'
import { useMeasuredHeightVar } from '@hooks/useMeasuredHeightVar'
import type { FC } from 'react'
import { useRef } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import styles from './Header.module.css'

export interface HeaderLink {
  label: string
  to: string
}

export type HeaderVariant = 'public' | 'admin' | 'logged-out'

export interface HeaderProps {
  /** @default 'public' */
  variant?: HeaderVariant
  /** Wordmark text. @default 'Akli Aissat' */
  brand?: string
  brandTo?: string
  /** Nav links; the current page is derived from the URL, not a per-link flag. */
  links?: HeaderLink[]
  /** Admin: signed-in email shown at right. */
  email?: string
  /** Admin: renders the "Log out" button when set. */
  onLogout?: () => void
  className?: string
}

const isLinkActive = (pathname: string, to: string) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)

const Header: FC<HeaderProps> = ({
  variant = 'public',
  brand = 'Akli Aissat',
  brandTo = '/',
  links = [],
  email,
  onLogout,
  className: extraClassName,
}) => {
  const { pathname } = useLocation()
  const headerRef = useRef<HTMLElement>(null)

  useMeasuredHeightVar(headerRef, '--header-height')

  const className = [
    styles.header,
    styles.sticky,
    variant === 'admin' && styles.admin,
    extraClassName,
  ]
    .filter(Boolean)
    .join(' ')

  const navLabel = variant === 'admin' ? 'Admin navigation' : 'Main navigation'

  const nav = links.length > 0 && (
    <nav aria-label={navLabel} className={styles.nav}>
      {links.map((link) => (
        <RouterLink
          key={link.to}
          to={link.to}
          className={styles.navLink}
          aria-current={isLinkActive(pathname, link.to) ? 'page' : undefined}
        >
          {link.label}
        </RouterLink>
      ))}
    </nav>
  )

  return (
    <header ref={headerRef} className={className}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <RouterLink to={brandTo} className={styles.brand}>
            {brand}
          </RouterLink>

          {variant === 'admin' && nav}
        </div>

        <div className={styles.actions}>
          {variant === 'public' && nav}

          {variant === 'logged-out' && <span className={styles.loggedOutLabel}>Admin</span>}

          {variant === 'admin' && (
            <>
              {email && <span className={styles.email}>{email}</span>}
              {onLogout && (
                <Button onClick={onLogout} variant="outline" size="sm">
                  Log out
                </Button>
              )}
            </>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default Header
