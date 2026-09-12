---
"@akli-dev/ui": patch
---

Fix `Image`'s priority preload link to carry the same `srcSet`/`sizes` (including the default responsive fallback) as the rendered `<img>`, so the browser preloads the resource it actually uses instead of logging an unused-preload warning.
