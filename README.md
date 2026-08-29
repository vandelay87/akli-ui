# akli-ui

Shared UI component package (`@akli-dev/ui`) and Storybook for [akli.dev](https://akli.dev).

Browse every component, its variants, and its accessibility report at **[storybook.akli.dev](https://storybook.akli.dev)**.

See `docs/prds/` for the planned scope.

## Components

`Button`, `Callout`, `Card`, `Footer`, `Grid`, `Header`, `Image`, `Input`, `Link`, `List`, `Loading`, `ThemeToggle`, `Typography`, plus a shared icon set (`icons` — imported individually, e.g. `IconPlus`). All import from the package's single entry point:

```tsx
import { Button, Typography } from '@akli-dev/ui'
```

Full props and live examples for each are in Storybook, not duplicated here — Storybook's autodocs are generated from the same source, so they can't drift out of sync with the actual component the way hand-written docs can.

Written in TypeScript; type declarations ship with the package, no `@types/*` package needed.

## Installation

```sh
pnpm add @akli-dev/ui
```

Peer dependencies (install alongside it if the consuming app doesn't already have them): `react` `^19`, `react-dom` `^19`, `react-router-dom` `^7`. `vite` `^8` is listed as an optional peer dependency (for non-Vite consumers, which don't use the plugin below at all) — but for Vite-based consumers, which is every current consumer of this package, `preloadFonts()` (below) is a required setup step, not an optional one.

### Required CSS imports

A working setup needs three CSS imports:

- `@akli-dev/ui/fonts.css` — the self-hosted `@font-face` declarations (Geist, JetBrains Mono, plus a metric-matched `'Geist Fallback'` face).
- `@akli-dev/ui/tokens.css` — the design tokens (colors, spacing, typography, etc.), including `--font-sans`, `--font-mono`, and the `body` base rule that applies them.
- `@akli-dev/ui/index.css` — the compiled component styles (`Button`, `Typography`, and every other component's actual CSS Modules output). Skip this one and components render completely unstyled even with the two above in place.

**`fonts.css` must be imported before `tokens.css`**, and both once, at the app's entry point, before first render. `index.css` has no ordering dependency relative to the other two — import it wherever convenient alongside them.

The reason the fonts/tokens order matters: `tokens.css` defines

```css
--font-sans:
  'Geist', 'Geist Fallback', system-ui, -apple-system, 'Segoe UI', Roboto,
  sans-serif;
```

`'Geist Fallback'` is a metric-matched local-font face (`local('Arial')`, etc., re-shaped via `ascent-override`/`descent-override`/`size-adjust` to match Geist Regular's box model) that only `fonts.css` declares. It exists to hold layout steady during the `font-display: swap` transition — the browser paints with the fallback face immediately, then swaps to the real downloaded webfont without the text reflowing, because the two faces occupy the same box. If `tokens.css` is imported (or evaluated) before `fonts.css`, or `fonts.css` is skipped, the browser has no `'Geist Fallback'` face to match — the fallback slot in `--font-sans` resolves to a generic system font with different metrics instead, risking a flash of unstyled content and/or a font-swap layout shift (CLS) when the real Geist face finally loads.

```ts
// main.tsx (or wherever the app's entry point is)
import '@akli-dev/ui/fonts.css'
import '@akli-dev/ui/tokens.css'
import '@akli-dev/ui/index.css'
```

### Font preloading (`preloadFonts()`)

**Required for every Vite-based consumer of this package**, alongside the CSS import order above — it's the primary mitigation against a font-swap layout shift (CLS) for a font this central to the page's initial render.

`fonts.css` references its font file via `url(...)`, not inlined. When the consuming app imports `@akli-dev/ui/fonts.css`, its own Vite build re-processes and re-hashes that font file into its `dist/assets/`, so only that build knows the resulting final filename. `@akli-dev/ui/vite-plugin` exports `preloadFonts()`, which hooks into the build to find that filename and inject a `<link rel="preload">` for it into the built `index.html`. Skipping it doesn't crash the app — the `swap` + fallback-face mechanism above still holds the layout steady — but the font is discovered and fetched later than it should be, so it's a required step, not an optional optimization.

Add it to the app's `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { preloadFonts } from '@akli-dev/ui/vite-plugin'

export default defineConfig({
  plugins: [react(), preloadFonts()],
})
```

It's a no-op if `@akli-dev/ui/fonts.css` was never imported (there's nothing to preload) and only runs during `vite build`, not `vite dev`.

### Theming

Every component reads color/spacing/typography values from `tokens.css`'s CSS custom properties, switching between a light and dark set based on a single attribute: `data-theme="light"` or `data-theme="dark"` on `<html>`.

`ThemeToggle` manages this automatically — on mount it reads `localStorage`, falls back to `prefers-color-scheme`, sets `data-theme` accordingly, and updates both on click. No setup is required beyond rendering it:

```tsx
import { ThemeToggle } from '@akli-dev/ui'

function App() {
  return <ThemeToggle />
}
```

An SSR consumer that wants to avoid a flash of the wrong theme on first paint can set `data-theme` itself, before hydration, via an inline bootstrap script — `ThemeToggle` detects an existing value and respects it instead of re-deriving one. This is an opt-in optimization, not a requirement.

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

## Releasing

Versioning and publishing to npm are automated with [Changesets](https://github.com/changesets/changesets). A PR that changes published package behavior (anything under `src/`, not internal-only tooling/docs) needs a changeset:

```sh
pnpm changeset
```

This prompts for a bump type (patch/minor/major) and a summary, then writes a `.changeset/<random-name>.md` file, committed as part of the PR. It's what tells the release automation this change should ship in the next version — a PR merged without one queues no release at all.

From there it's hands-off:

1. Merging a PR to `main` (with its changeset file included) makes the `Release` workflow open or update a "Version Packages" PR that bumps `package.json`'s version and writes the changelog from every pending changeset.
2. Merging _that_ PR is the actual release: it triggers `npm publish` for the new version, authenticated via npm trusted publishing (OIDC) — no npm token is stored anywhere in this repo.

See `.github/workflows/release.yml` and `.github/scripts/release-publish.sh` for the implementation.

## License

[MIT](./LICENSE)
