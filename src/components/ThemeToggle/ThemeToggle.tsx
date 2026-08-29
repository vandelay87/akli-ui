import { useLayoutEffect, useState } from 'react'
import { iconMoon, iconSun } from '../icons'
import styles from './ThemeToggle.module.css'

type Theme = 'light' | 'dark'

const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark'

const resolveInitialTheme = (): Theme => {
  // localStorage/matchMedia access can throw in privacy-restricted contexts
  // (Safari private mode, storage-blocked iframes, strict tracking
  // protection). Fall back to 'light' — matching this component's default
  // state — rather than letting the mount crash.
  try {
    const stored = localStorage.getItem('theme')
    if (isTheme(stored)) return stored

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/**
 * Self-contained by default: on mount, if `<html>` has no `data-theme`
 * attribute yet, it derives the theme from `localStorage` (falling back to
 * `prefers-color-scheme`) and sets `data-theme` itself. No setup required
 * for a plain CSR app.
 *
 * SSR consumers who want to avoid a flash of the wrong theme on first paint
 * can optionally set `data-theme` on `<html>` themselves, before hydration,
 * via their own inline bootstrap script. If present, ThemeToggle detects
 * and respects it instead of re-deriving from `localStorage`/
 * `prefers-color-scheme`. This is an opt-in optimization, not a requirement.
 */
const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>('light')

  useLayoutEffect(() => {
    // Can't read this via a lazy useState initializer instead: the server
    // always renders 'light' (no `document`), and an inline bootstrap
    // script sets data-theme on <html> before hydration to avoid a flash
    // of the wrong theme. Reading it during the client's hydration render
    // would mismatch the server-rendered markup — this has to correct the
    // mirror after hydration completes, not during it.
    const domTheme = document.documentElement.getAttribute('data-theme')

    if (isTheme(domTheme)) {
      // Bootstrap script (opt-in for SSR consumers) already ran and set
      // data-theme — respect it as-is rather than re-deriving from
      // localStorage/prefers-color-scheme.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(domTheme)
      return
    }

    // No pre-hydration bootstrap script (CSR-only consumer) — determine
    // the theme ourselves and set data-theme on <html>, since nothing else
    // will.
    const resolvedTheme = resolveInitialTheme()
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    setTheme(resolvedTheme)
  }, [])

  const isDark = theme === 'dark'

  const handleClick = () => {
    const nextTheme: Theme = isDark ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem('theme', nextTheme)
    setTheme(nextTheme)
  }

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={handleClick}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className={styles.glyph} aria-hidden="true">
        {isDark ? iconSun : iconMoon}
      </span>
    </button>
  )
}

export default ThemeToggle
