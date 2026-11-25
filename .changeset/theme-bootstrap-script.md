---
'@akli-dev/ui': minor
---

New `themeBootstrapScript` export: an inline script for an SSR consumer's `<head>` that applies the saved theme (falling back to the system theme) before first paint, using the same rules as `ThemeToggle`. The `Theme` type is now exported. `ThemeToggle` no longer throws when storage is blocked: the theme still switches, it just isn't remembered.
