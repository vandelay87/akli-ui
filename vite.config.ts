import react from '@vitejs/plugin-react'
import dts from 'unplugin-dts/vite'
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import { defineConfig } from 'vitest/config'
import pkg from './package.json' with { type: 'json' }
import { stripModuleCssInfix } from './scripts/dist-css-naming.ts'

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
    // Reads each chunk's `viteMetadata.importedCss` (a Vite-internal
    // property, not a native Rollup/Rolldown one) in generateBundle and
    // writes a literal `import './X.css'` into that chunk's own compiled
    // output. Paired with rollupOptions.output.preserveModules below,
    // that's what makes a consumer's bundler drop a component's CSS
    // whenever it drops the component — no per-component CSS import for
    // the consumer to remember, and no way to forget one.
    //
    // Floor-pinned to ^2.2.0 in package.json deliberately: preserveModules
    // support landed in exactly that version, and before it the plugin
    // silently emitted nothing under preserveModules rather than failing
    // the build. Confirmed against this repo's Vite 8 / Rolldown 1.2 build
    // (the plugin's own history is Rollup-based Vite 5) that
    // `viteMetadata.importedCss` really is populated when it reads it, and
    // that every injected specifier resolves to a file the build emits.
    libInjectCss(),
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
      // `.stories.tsx` (Storybook, co-located per-component like `.test.tsx`)
      // matches the include glob above same as `.test.tsx` does — excluded
      // for the same reason: neither is part of the package's public API,
      // and without this a stray `dist/components/<Name>/<Name>.stories.d.ts`
      // ships in every published version for every component with a story.
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.stories.ts',
        'src/**/*.stories.tsx',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@components': '/src/components',
      '@hooks': '/src/hooks',
    },
  },
  build: (() => {
    const entry = {
      // The component barrel. Its JS import graph still reaches every
      // component's `.module.css`, but `preserveModules` below now splits
      // each of those out alongside the module that imports it rather
      // than collapsing them into one `dist/index.css` — so the only CSS
      // left at this entry's own level is animations.css's global
      // keyframes (see src/index.ts's side-effect import). That file is
      // emitted as `dist/index.css` (see assetFileNames below) to keep
      // package.json's `./index.css` export resolving: it's no longer a
      // required import for consumers, since each component's compiled JS
      // now carries its own CSS import, but a v1 consumer that still has
      // the line gets a small real file instead of a 404.
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
    // Names of entries whose own declared source is a `.css` file (today:
    // tokens, fonts) — these already get an unhashed dist-root name via the
    // entry-name branch below and need no redirect. Derived from `entry`'s
    // own values, not hand-copied, for the same reason the old `cssEntryNames`
    // was: a literal list is how a future 3rd standalone CSS entry silently
    // drifts out of sync with no build error, just a wrong dist/ path.
    const standaloneCssEntryNames = new Set(
      Object.entries(entry)
        .filter(([, source]) => source.endsWith('.css'))
        .map(([key]) => `${key}.css`)
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
      // that constraint and is what we want anyway (dist/tokens.css for the
      // tokens.css export subpath, not one merged file). Now doubly
      // required: `importedCss`, the metadata libInjectCss reads, is only
      // populated when CSS is code-split (the plugin sets this itself, but
      // leaving it explicit keeps the reason for it visible here).
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
        //
        // That last clause is still an accurate description of why the
        // plugin didn't help *this* block — tokens.css/fonts.css remain
        // standalone CSS entries, unaffected by it — but it is no longer
        // the whole story: the "different problem" it solves is now the
        // package's headline behaviour, so it's wired into `plugins`
        // above (see the preserveModules note in rollupOptions.output).
        entry,
        formats: ['es'],
        // No `fileName`: rollupOptions.output.entryFileNames below takes
        // precedence over the entryFileNames Vite derives from it (Vite
        // spreads the user's `output` last), and under preserveModules
        // there is no longer a small fixed entry set for a per-entry
        // filename function to name — every preserved module is emitted
        // through the same pattern.
      },
      rollupOptions: {
        // Without this, peerDependencies (react, react-dom, react-router-dom)
        // get bundled straight into dist/index.js instead of resolving to the
        // consumer's own copy at runtime — confirmed by inspecting
        // dist/index.js, which contained react's actual jsx-runtime source
        // (Symbol.for('react.transitional.element') etc. — internal markers
        // only react's own package defines) and react-router-dom's source.
        // Two React instances (one bundled in here, one from the consumer's
        // node_modules) means this package's components call useContext
        // against a dispatcher the consumer's ReactDOM render never
        // initializes — reproduced empirically as `TypeError: Cannot read
        // properties of null (reading 'useContext')` in a scratch consumer
        // app. Vite's build doesn't infer `external` from peerDependencies
        // automatically, so it's derived from package.json here instead of a
        // hand-copied literal — a second, manually-synced list is how a
        // future peer dependency (added, removed, or renamed) silently
        // drifts out of sync and reintroduces this exact bug with no
        // build error to catch it.
        external: Object.keys(pkg.peerDependencies).map(
          (name) => new RegExp(`^${name}($|/)`)
        ),
        output: {
          // Emit one output module per source module instead of
          // collapsing `index`'s whole import graph into a single
          // dist/index.js. That's what makes per-component CSS
          // tree-shaking possible: each `.module.css` becomes its own
          // chunk with its own CSS asset, and libInjectCss (above) writes
          // a real `import './X.css'` into the compiled module that owns
          // it — so a consumer's own tree-shaking drops a component's CSS
          // for free whenever it drops the component's JS. Rooting at
          // `src` strips the leading `src/` so dist/ mirrors src/ 1:1,
          // matching what unplugin-dts's `entryRoot: 'src'` already does
          // for `.d.ts` output.
          preserveModules: true,
          preserveModulesRoot: 'src',
          // Set here rather than via `build.lib.fileName` (see the note
          // there): under preserveModules this pattern names *every*
          // emitted module, not just the four declared entries, and
          // `[name]` already carries each module's src-relative directory.
          entryFileNames: '[name].js',
          // Must be a function, not a flat string: a flat
          // `'assets/[name]-[hash][extname]'` pattern applies to *every*
          // Rollup-emitted asset, and the only one in this build that
          // wants a content hash is the font file (reached via fonts.css's
          // `?no-inline`-marked url()s), which needs a cache-busted URL for
          // the separately built preloadFonts() plugin to preload.
          //
          // Every CSS asset wants no hash, for three different reasons that
          // happen to share an answer. `tokens.css`/`fonts.css` are named in
          // package.json's `exports` map and must keep their exact dist-root
          // names. The one plain (non-`.module.css`) CSS file reached via
          // `index`'s own JS import graph — animations.css, see the `index`
          // entry comment above — must land at `index.css` for the same
          // reason. Every per-module CSS file preserveModules emits wants to
          // sit next to the module that imports it, mirroring src/ the way
          // dist/ already does for JS and `.d.ts`. A hash would buy nothing
          // for any of the three: none of this CSS is served directly — the
          // consumer's own build re-bundles and re-hashes it, resolving it
          // through the import statement libInjectCss injects, which is
          // generated from whatever filename this hook returns.
          assetFileNames: (assetInfo) => {
            const name = (assetInfo.names ?? [assetInfo.name]).find(Boolean)
            if (!name?.endsWith('.css')) return 'assets/[name]-[hash][extname]'
            if (standaloneCssEntryNames.has(name)) return '[name][extname]'
            if (!name.endsWith('.module.css')) return 'index.css'
            // See stripModuleCssInfix's own comment (scripts/dist-css-naming.ts)
            // for why the `.module` infix has to go, not just what this does —
            // shared with check-css-tree-shaking.ts so the rule lives in one place.
            return stripModuleCssInfix(name)
          },
        },
      },
    }
  })(),
  test: {
    // Required, not just a convenience for test files that skip importing
    // describe/it/expect/vi: @testing-library/jest-dom's side-effect import
    // (tests/setup.ts) registers its matchers against the global `expect`,
    // which only exists with globals: true — without it, jest-dom's own
    // import throws `ReferenceError: expect is not defined` before any test
    // file even runs, regardless of what that file itself imports.
    // Confirmed empirically; matches personal-website's own vite.config.ts.
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
