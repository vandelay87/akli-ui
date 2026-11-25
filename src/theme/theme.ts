export type Theme = 'light' | 'dark'

const THEME_ATTRIBUTE = 'data-theme'
const STORAGE_KEY = 'theme'
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

const isTheme = (value: string | null): value is Theme =>
  value === 'light' || value === 'dark'

/**
 * The theme a page should start in: an existing `data-theme` on `<html>`
 * (set by a theme bootstrap), then the saved theme, then the system theme,
 * then light. Never throws, even where storage is blocked.
 */
export const getInitialTheme = (): Theme => {
  const attribute = document.documentElement.getAttribute(THEME_ATTRIBUTE)
  if (isTheme(attribute)) return attribute

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isTheme(saved)) return saved

    return window.matchMedia(SYSTEM_DARK_QUERY).matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export const applyTheme = (theme: Theme): void => {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme)
}

/**
 * Applies the theme and saves it for the next visit. Where storage is
 * blocked, the theme still switches for this visit but isn't remembered.
 */
export const saveTheme = (theme: Theme): void => {
  applyTheme(theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Blocked storage: applied for this visit, not remembered.
  }
}

/**
 * An inline script for an SSR consumer's `<head>`, so the theme is applied
 * before first paint. Runs the same resolution as `getInitialTheme`.
 */
export const themeBootstrapScript = `(function () {
  var root = document.documentElement
  var isTheme = function (value) { return value === 'light' || value === 'dark' }
  if (isTheme(root.getAttribute(${JSON.stringify(THEME_ATTRIBUTE)}))) return
  var theme = 'light'
  try {
    var saved = localStorage.getItem(${JSON.stringify(STORAGE_KEY)})
    theme = isTheme(saved)
      ? saved
      : window.matchMedia(${JSON.stringify(SYSTEM_DARK_QUERY)}).matches ? 'dark' : 'light'
  } catch (error) {}
  root.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)}, theme)
})()`
