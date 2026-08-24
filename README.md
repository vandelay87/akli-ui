# akli-ui

Shared UI component package (`@akli-dev/ui`) and Storybook for [akli.dev](https://akli.dev).

See `docs/prds/` for the planned scope.

## Installation

```sh
pnpm add @akli-dev/ui
```

Peer dependencies (install alongside it if your app doesn't already have them): `react` `^19`, `react-dom` `^19`, `react-router-dom` `^7`. `vite` `^8` is listed as an optional peer dependency (for non-Vite consumers, which don't use the plugin below at all) — but if you're on Vite, as every current consumer of this package is, `preloadFonts()` (below) is a required setup step, not an optional one.

### Required CSS imports

A working setup needs three CSS imports:

- `@akli-dev/ui/fonts.css` — the self-hosted `@font-face` declarations (Geist, JetBrains Mono, plus a metric-matched `'Geist Fallback'` face).
- `@akli-dev/ui/tokens.css` — the design tokens (colors, spacing, typography, etc.), including `--font-sans`, `--font-mono`, and the `body` base rule that applies them.
- `@akli-dev/ui/index.css` — the compiled component styles (`Button`, `Typography`, and every other component's actual CSS Modules output). Skip this one and components render completely unstyled even with the two above in place.

**`fonts.css` must be imported before `tokens.css`**, and both once, at your app's entry point, before first render. `index.css` has no ordering dependency relative to the other two — import it wherever convenient alongside them.

The reason the fonts/tokens order matters: `tokens.css` defines

```css
--font-sans:
  'Geist', 'Geist Fallback', system-ui, -apple-system, 'Segoe UI', Roboto,
  sans-serif;
```

`'Geist Fallback'` is a metric-matched local-font face (`local('Arial')`, etc., re-shaped via `ascent-override`/`descent-override`/`size-adjust` to match Geist Regular's box model) that only `fonts.css` declares. It exists to hold layout steady during the `font-display: swap` transition — the browser paints with the fallback face immediately, then swaps to the real downloaded webfont without the text reflowing, because the two faces occupy the same box. If `tokens.css` is imported (or evaluated) before `fonts.css`, or `fonts.css` is skipped, the browser has no `'Geist Fallback'` face to match — the fallback slot in `--font-sans` resolves to a generic system font with different metrics instead, and you risk a flash of unstyled content and/or a font-swap layout shift (CLS) when the real Geist face finally loads.

```ts
// main.tsx (or wherever your app's entry point is)
import '@akli-dev/ui/fonts.css'
import '@akli-dev/ui/tokens.css'
import '@akli-dev/ui/index.css'
```

### Font preloading (`preloadFonts()`)

**Required for every Vite-based consumer of this package**, alongside the CSS import order above — it's the primary mitigation against a font-swap layout shift (CLS) for a font this central to the page's initial render.

`fonts.css` references its font file via `url(...)`, not inlined. When your app imports `@akli-dev/ui/fonts.css`, _your own_ Vite build re-processes and re-hashes that font file into your `dist/assets/`, so only your build knows the resulting final filename. `@akli-dev/ui/vite-plugin` exports `preloadFonts()`, which hooks into your build to find that filename and inject a `<link rel="preload">` for it into your built `index.html`. Skipping it doesn't crash the app — the `swap` + fallback-face mechanism above still holds the layout steady — but the font is discovered and fetched later than it should be, so treat it as a required step, not an optional optimization.

Add it to your own `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { preloadFonts } from '@akli-dev/ui/vite-plugin'

export default defineConfig({
  plugins: [react(), preloadFonts()],
})
```

It's a no-op if `@akli-dev/ui/fonts.css` was never imported (there's nothing to preload) and only runs during `vite build`, not `vite dev`.

### Usage

```tsx
// main.tsx
import '@akli-dev/ui/fonts.css'
import '@akli-dev/ui/tokens.css'
import '@akli-dev/ui/index.css'

import { Button } from '@akli-dev/ui'

function App() {
  return <Button onClick={() => console.log('clicked')}>Click me</Button>
}
```
