import react from '@vitejs/plugin-react'
import dts from 'unplugin-dts/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Vite's default `base: '/'` root-anchors any non-inlined asset URL
  // (e.g. the font file url()'d from fonts.css) to the site's domain root,
  // which is only correct for an app deployed at that root — wrong for an
  // npm package's dist/ output, which is consumed from inside another
  // app's node_modules and never served from `/` itself. `'./'` makes
  // those URLs relative to the referencing file's own location instead
  // (see build.rollupOptions.output.assetFileNames below for the sibling
  // fix — restoring the content hash — and the longer note above
  // build.lib for why both were needed).
  base: './',
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.json',
      // Default entryRoot is the longest common ancestor of every file the
      // dts pass touches — since tsconfig.json's own `include` also lists
      // the root-level vite.config.ts, that common ancestor becomes the
      // repo root instead of src/, which nests output under dist/src/... and
      // additionally emits a stray dist/vite.config.d.ts. Pinning entryRoot
      // to src/ (and scoping include/exclude below to just the library's
      // own source) makes declaration output mirror the built JS structure
      // (dist/index.d.ts, dist/components/...) instead.
      entryRoot: 'src',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    }),
  ],
  resolve: {
    alias: {
      '@components': '/src/components',
    },
  },
  build: (() => {
    // Declared outside `build` so `assetFileNames` below can derive its
    // CSS-entry check from the same object instead of hand-copying its
    // keys into a second literal — a second, manually-synced list is how a
    // future 4th CSS entry silently ends up hashed into `assets/` instead
    // of its declared `exports` map path (no build/type error, just a
    // 404 for whoever imports it).
    const entry = {
      // `index`'s JS import graph pulls in every component's own
      // `.module.css` (plus animations.css, see src/index.ts), which Vite
      // compiles into a sibling `dist/index.css` — required reading for
      // consumers, not just a build detail: `dist/index.css` is the
      // *only* place component styles (e.g. Button's/Typography's actual
      // class rules) live, so a consumer that skips importing it gets
      // fully unstyled components even after importing `tokens.css`/
      // `fonts.css`. It's exported at `@akli-dev/ui/index.css` in
      // package.json's `exports` map (same flat-string shape as
      // `./tokens.css`/`./fonts.css`) — a required third import alongside
      // those two, in any order relative to them (only fonts.css-before-
      // tokens.css is order-sensitive; index.css has no such dependency).
      index: 'src/index.ts',
      tokens: 'src/styles/tokens.css',
      fonts: 'src/styles/fonts.css',
      // Node-side entry: consumed from a *consuming app's* own
      // vite.config.ts (via `@akli-dev/ui/vite-plugin`), never imported
      // from src/index.ts or any component, so it shares this build's
      // config (target/format) without pulling in any React/DOM code —
      // its own import graph is just the `Plugin` type from `vite`.
      'vite-plugin': 'src/vite-plugin.ts',
    }
    // Every entry except `vite-plugin` produces a `dist/<key>.css`
    // sibling that needs the unhashed-filename treatment in
    // assetFileNames below — `index` does via its JS import graph (see
    // its comment above), `tokens`/`fonts` are standalone CSS entries.
    // Deriving this from `entry`'s own keys means a future 5th entry
    // (another standalone CSS file, say) is covered automatically; only
    // a future JS-only entry (like `vite-plugin`) would need adding to
    // the filter below.
    const cssEntryNames = new Set(
      Object.keys(entry)
        .filter((key) => key !== 'vite-plugin')
        .map((key) => `${key}.css`)
    )

    return {
      // Vite 8's documented default (`'baseline-widely-available'`) targets
      // real end-user browsers, which is the right call for an application's
      // own build but not for this package's dist output: dist/ is consumed
      // by another bundler (the consuming app's own Vite/Rollup build), which
      // applies its own target/downleveling for its actual deployed browser
      // matrix. Transpiling twice — once here to a conservative baseline, then
      // again in the consumer's build — only adds dead transforms. `esnext`
      // is Vite's documented escape hatch for exactly this "library, not an
      // app" case: minimal transpilation, native ESM/dynamic-import assumed.
      target: 'esnext',
      // Library mode defaults cssCodeSplit to false (every entry's CSS
      // combines into one file), which Vite's Rolldown-based build now
      // actively rejects when a CSS file is also present in the entry map
      // (rolldownOptions.input may not include CSS files under
      // cssCodeSplit: false). Since one of the two entries below (tokens.css)
      // is a standalone CSS entry rather than CSS pulled in via a JS import,
      // each entry needs its own independent CSS output — this both satisfies
      // that constraint and is what we want anyway (dist/index.css for the
      // component barrel's CSS Modules output, dist/tokens.css for the
      // tokens.css export subpath, not one merged file).
      cssCodeSplit: true,
      // NOTE: `assetsInlineLimit` (including its function form, which a prior
      // pass configured here to force-exclude .woff2 from inlining) is dead
      // code under `build.lib` — verified by reading Vite 8's own source
      // (node_modules/vite/dist/node/chunks/node.js, the `shouldInline`
      // function backing asset URL resolution): when `environment.config.
      // build.lib` is set, it returns `true` (always inline) unconditionally,
      // *before* ever consulting `assetsInlineLimit`. This isn't a size-based
      // default that a stricter limit can override — it's a hard short-circuit
      // specific to library builds, on the theory that a library's dist/
      // should be self-contained without a consumer having to wire up asset
      // copying. So `assetsInlineLimit` was removed rather than left in
      // pointing at nothing.
      //
      // The one thing `shouldInline` checks *before* the lib-mode
      // short-circuit is a `?no-inline` (or `?inline`) query suffix on the
      // asset specifier itself — confirmed empirically (rebuilt with the
      // suffix added to fonts.css's url()s and inspected dist/output). That's
      // the actual escape hatch, applied at the call site instead: see the
      // `?no-inline` suffix on each `url(...)` in src/styles/fonts.css.
      //
      // Two more defaults specific to lib mode needed correcting alongside it,
      // both confirmed by inspecting Vite's resolved build config source
      // (`libOptions ? '[name].[ext]' : …` for assetFileNames) and by
      // rebuilding and diffing dist/ output before/after:
      //   - Library builds default rollupOptions.output.assetFileNames to
      //     `[name].[ext]` (no hash) — appropriate for the entries themselves
      //     (stable import paths like `./tokens.css`), wrong for a
      //     non-entry asset like the font file, which needs a content hash so
      //     the (separately built) preloadFonts() plugin gets a cache-busted
      //     URL and consumers get long-term-cacheable font requests. Restored
      //     explicitly below.
      //   - `base` defaults to `/`, so a non-inlined asset's url() gets
      //     rewritten to a root-absolute path (`/geist-....woff2`) — correct
      //     for an app deployed at a domain root, wrong for an npm package
      //     whose dist/ is consumed from inside another app's node_modules
      //     and never itself served from `/`. `base: './'` makes the emitted
      //     url() relative to fonts.css's own location instead, which is
      //     right regardless of where the consuming app mounts things (the
      //     font file ships in the same dist/ folder as fonts.css).
      lib: {
        // Two entries, not one: `index` is the real JS library entry
        // (src/index.ts, the component barrel); `tokens` is a plain CSS file
        // used directly as a Rollup input rather than something imported by
        // JS. Vite's library-mode docs only document build.lib.entry for JS
        // entries and cover CSS solely as a side effect of a JS import
        // (bundled via build.lib.cssFileName) — there's no documented
        // "standalone CSS library entry" API. In practice, though, Vite's CSS
        // plugin processes any .css module passed as a Rollup input into its
        // own output asset regardless of whether it's reached via a JS import
        // or listed directly as an entry (this is the same mechanism behind
        // Vite's documented multi-page CSS-entry support) — confirmed
        // empirically here: this produces a clean standalone dist/tokens.css
        // with no JS wrapper. This is simpler than the alternative of
        // reaching for build.rollupOptions.input separately from build.lib
        // (which risks Vite's lib-mode input resolution overwriting or
        // conflicting with a manually-specified rollupOptions.input) or a
        // third-party plugin like vite-plugin-lib-inject-css, which solves a
        // different problem (associating per-component CSS with per-component
        // JS chunks in a multi-entry component library) than "ship one
        // standalone global stylesheet alongside the JS entry."
        entry,
        formats: ['es'],
        fileName: '[name]',
      },
      rollupOptions: {
        output: {
          // Must be a function, not a flat string: a flat
          // `'assets/[name]-[hash][extname]'` pattern applies to *every*
          // Rollup-emitted asset, which in this build includes not just the
          // font file but the three CSS *entry* outputs themselves (Rollup
          // treats build.lib's CSS entries as "assets" too, confirmed by
          // logging assetInfo here during development — index.css/tokens.css/
          // fonts.css all pass through this same hook). Those three need to
          // keep their exact, unhashed, dist-root names — package.json's
          // `exports` map (and consumers' hard-required `fonts.css`-then-
          // `tokens.css` import-order docs) point at fixed paths like
          // `./dist/fonts.css`, not a hashed filename that changes every
          // build. So: pass the lib-mode default (`[name][extname]`, no
          // hash) through unchanged for those three, and only apply the
          // hashed `assets/` pattern to everything else — in practice, only
          // the font file, reached via fonts.css's `?no-inline`-marked
          // url()s.
          assetFileNames: (assetInfo) => {
            const isCssEntry = (assetInfo.names ?? [assetInfo.name]).some(
              (name) => (name ? cssEntryNames.has(name) : false)
            )
            return isCssEntry
              ? '[name][extname]'
              : 'assets/[name]-[hash][extname]'
          },
        },
      },
    }
  })(),
  test: {
    environment: 'jsdom',
  },
})
