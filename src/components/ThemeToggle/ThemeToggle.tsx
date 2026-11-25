import { useLayoutEffect, useState } from 'react'
import interactions from '../../styles/interactions.module.css'
import {
  applyTheme,
  getInitialTheme,
  saveTheme,
  type Theme,
} from '../../theme/theme'
import { cx } from '../../utils/cx'
import { iconMoon, iconSun } from '../Icons'
import styles from './ThemeToggle.module.css'

/**
 * Self-contained by default: on mount it applies the saved theme, falling
 * back to the system theme. SSR consumers can inline `themeBootstrapScript`
 * in `<head>` to apply the theme before first paint; ThemeToggle then keeps
 * the `data-theme` already on `<html>`.
 */
const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>('light')

  useLayoutEffect(() => {
    // Read after hydration, not in a useState initializer: the server always
    // renders 'light', and a theme bootstrap may already have set data-theme.
    const initialTheme = getInitialTheme()
    applyTheme(initialTheme)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme)
  }, [])

  const isDark = theme === 'dark'

  const handleClick = () => {
    const nextTheme: Theme = isDark ? 'light' : 'dark'
    saveTheme(nextTheme)
    setTheme(nextTheme)
  }

  return (
    <button
      type="button"
      className={cx(styles.toggle, interactions.focusRing)}
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
