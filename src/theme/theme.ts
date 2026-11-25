export type Theme = 'light' | 'dark'

export const THEME_ATTRIBUTE = 'data-theme'
export const STORAGE_KEY = 'theme'
export const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

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
  const root = document.documentElement
  if (root.getAttribute(THEME_ATTRIBUTE) !== theme) {
    root.setAttribute(THEME_ATTRIBUTE, theme)
  }
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
