// Node-side entry, not a browser entry: this file runs inside a *consuming*
// app's own `vite.config.ts` (added to that app's `plugins` array), never in
// the browser bundle produced by `src/index.ts`. It deliberately imports
// nothing from `src/index.ts` or any component — only the `Plugin` type from
// `vite` — so it stays free of React/DOM code and can be built as its own
// clean, minimal entry (see the `vite-plugin` entry in vite.config.ts).
//
// See docs/prds/akli-ui-package-and-storybook.md (Technical Considerations →
// Performance) for the full "why": `@akli-dev/ui` ships its font inside
// `dist/fonts.css` as a `url(...)` reference, not an inlined asset. When a
// consumer imports `@akli-dev/ui/fonts.css`, *their* build re-processes that
// `url()` and copies/re-hashes the font file into *their* own
// `dist/assets/...`. Only that consumer's build knows the resulting hashed
// filename — so a `<link rel="preload">` pointing at it can't be hardcoded
// anywhere in this package. This plugin finds the real filename via Rollup's
// `generateBundle` hook (fired once per build, given the full output
// manifest) and injects the preload tag into the consumer's built
// `index.html` via Vite's `transformIndexHtml` hook.
import type { Plugin } from 'vite'

// Matches the *original* (pre-hash) asset name Vite/Rollup preserves in an
// OutputAsset's `names` array — e.g. "geist-sans-latin-variable.woff2" — not
// the final hashed `fileName` (e.g.
// "assets/geist-sans-latin-variable-BGnTDqni.woff2"), which varies per build
// and can't be pattern-matched reliably. "geist-sans" is specific enough to
// be unambiguous against this package's other shipped font (JetBrains Mono)
// while tolerant of upstream renames to the weight/subset portion of the
// filename.
//
// Only the Geist Sans variable font is targeted, deliberately: it backs
// `--font-sans` (src/styles/tokens.css), the typeface used for render-critical
// body text, which is exactly what the PRD's CLS/font-swap concern is about.
// JetBrains Mono is used for code blocks — not part of the initial paint for
// most content, so preloading it would spend the browser's limited
// preload-priority budget on a font that, unlike the sans face, isn't
// typically visible before the user has scrolled to a code block.
const GEIST_SANS_NAME_PATTERN = /geist-sans/i
const WOFF2_EXTENSION_PATTERN = /\.woff2$/i

/**
 * Vite plugin for consuming apps: injects a `<link rel="preload">` for
 * `@akli-dev/ui`'s Geist Sans variable font into the app's built
 * `index.html`, pointing at that build's actual final hashed asset
 * filename.
 *
 * Add to the consuming app's own `vite.config.ts`:
 *
 * ```ts
 * import { preloadFonts } from '@akli-dev/ui/vite-plugin'
 *
 * export default defineConfig({
 *   plugins: [react(), preloadFonts()],
 * })
 * ```
 *
 * No-op (injects nothing) if the consumer never actually imports
 * `@akli-dev/ui/fonts.css` — the Geist Sans asset then never appears in the
 * bundle for `generateBundle` to find. Vite/Rollup only invoke
 * `generateBundle` during an actual `vite build`, so this is also correctly
 * inert during `vite dev`, where a warning would just be noise.
 */
export const preloadFonts = (): Plugin => {
  // Fresh closure per call — no module-scope mutable state — so two
  // consumers (or two builds in the same process, e.g. tests) never share
  // or clobber each other's resolved filename.
  let base = '/'
  let fontFileName: string | undefined

  return {
    name: '@akli-dev/ui:preload-fonts',

    configResolved(config) {
      base = config.base
    },

    generateBundle(_options, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset') continue
        if (!WOFF2_EXTENSION_PATTERN.test(asset.fileName)) continue

        // `names` is the current (non-deprecated) field; `name` is kept as a
        // fallback for older Rollup/Rolldown builds that only populate it.
        const originalNames = asset.names.length > 0 ? asset.names : asset.name ? [asset.name] : []

        if (originalNames.some((name) => GEIST_SANS_NAME_PATTERN.test(name))) {
          fontFileName = asset.fileName
          break
        }
      }

      if (!fontFileName) {
        // A real `vite build` ran (generateBundle is output-only — it never
        // fires during `vite dev`) but no Geist Sans asset showed up. The
        // most likely cause is the consumer added this plugin without
        // importing `@akli-dev/ui/fonts.css`, which is worth flagging: the
        // preload silently does nothing otherwise. `this.warn` surfaces as a
        // normal Rollup/Vite build warning rather than a raw console log.
        this.warn(
          '@akli-dev/ui/vite-plugin: preloadFonts() could not find the Geist Sans font asset in this build\'s output. ' +
            "Did you forget to import '@akli-dev/ui/fonts.css'? No preload link will be injected.",
        )
      }
    },

    transformIndexHtml() {
      if (!fontFileName) return

      const normalizedBase = base.endsWith('/') ? base : `${base}/`

      return [
        {
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            crossorigin: true,
            href: `${normalizedBase}${fontFileName}`,
          },
          // 'head-prepend' (Vite's own default for injected tags) puts the
          // preload as early in <head> as possible, which is the point of
          // preloading at all — the browser should discover and start
          // fetching the font before it otherwise would.
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}
