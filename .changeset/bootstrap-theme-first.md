---
'@akli-dev/ui': patch
---

`bootstrapTheme()` now injects its script as the first element of `<head>` regardless of plugin order. Previously, listing `preloadFonts()` (or any other plugin that prepends to `<head>`) after it pushed the font preload above the theme bootstrap.
