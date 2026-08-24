import { useLayoutEffect, useState } from 'react'
import styles from './ThemeToggle.module.css'

type Theme = 'light' | 'dark'

const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark'

const resolveInitialTheme = (): Theme => {
  const stored = localStorage.getItem('theme')
  if (isTheme(stored)) return stored

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

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
      <span aria-hidden="true">{isDark ? '☀' : '☾'}</span>
    </button>
  )
}

export default ThemeToggle
