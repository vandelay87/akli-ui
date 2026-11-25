import { STORAGE_KEY, SYSTEM_DARK_QUERY, THEME_ATTRIBUTE } from './theme'

/**
 * An inline script for an SSR consumer's `<head>`, so the theme is applied
 * before first paint. Runs the same resolution as `getInitialTheme`.
 */
export const themeBootstrapScript = `(function () {
  var root = document.documentElement
  var isTheme = function (value) { return value === 'light' || value === 'dark' }
  if (isTheme(root.getAttribute('${THEME_ATTRIBUTE}'))) return
  var theme = 'light'
  try {
    var saved = localStorage.getItem('${STORAGE_KEY}')
    theme = isTheme(saved)
      ? saved
      : window.matchMedia('${SYSTEM_DARK_QUERY}').matches ? 'dark' : 'light'
  } catch (error) {}
  root.setAttribute('${THEME_ATTRIBUTE}', theme)
})()`
