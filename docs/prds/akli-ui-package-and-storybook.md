# PRD: akli-ui — Shared Component Package & Storybook

> Companion PRDs: `storybook-app-routing.md` in `akli-infrastructure`, `akli-ui-component-classification.md` in `personal-website`.

## Overview

A new standalone repo, `akli-ui`, publishing an npm package (`@akli-dev/ui`) that contains the generic, reusable UI components and design tokens currently living only inside `personal-website` (Header, Footer, Button, Typography, and friends). The same repo hosts Storybook as its development/documentation environment, deployed publicly at `storybook.akli.dev` — its own dedicated subdomain, bucket, and CloudFront distribution, following the same pattern established for `pokedex.akli.dev` and `sandbox.akli.dev` rather than the older path-based `apps/*` convention those two have since migrated off of.

## Problem Statement

Header, Footer, and other generic UI primitives exist only inside `personal-website`. Any other app on akli.dev (pokedex, sand-box, future apps) that wants the same header/footer/branding has no way to reuse it except copy-pasting code — which drifts as the site's design evolves (the paper-redesign token migration is a live example of exactly this kind of change). There's also no browsable catalog of the design system; understanding what components/variants exist requires reading source.

## Goals

- Generic UI components and design tokens are extracted into a versioned, publishable package (`@akli-dev/ui`) consumable by any akli.dev app
- Storybook provides an interactive, browsable catalog of every exported component/variant, deployed publicly at `storybook.akli.dev`
- Storybook ships a proper favicon/manifest icon set — not Storybook's own default favicon — matching the fix already applied to `personal-website` (#384), `pokedex` (#50), and `sand-box` (#11) for Google Search's circular-crop clipping of favicons in search result snippets
- Publishing to npm is automated via CI — no manual `npm publish` steps
- The package stays slim: only what personal-website already needs today, no speculative abstraction (e.g. `react-router-dom` is accepted as a peer dependency for `Header`/`Footer` rather than building a router-agnostic abstraction layer)
- The package works in a plain Vite + React 19 app with no personal-website-specific wiring beyond importing a global tokens stylesheet once

## Non-Goals

- Migrating `personal-website` itself to consume `@akli-dev/ui` (swapping its own `Header`/`Footer` imports for the package) — deferred to a follow-up PRD/issue once this package is published and proven via Storybook. Tracked as an open item in the companion `personal-website` PRD. **Note for that future PRD**: the font/tokens swap must land as one atomic change — replacing `personal-website`'s local `fonts.css`/`tokens.css`/`src/assets/fonts/` with the package's equivalents in the same PR that removes the originals, not a transitional period with both imported. `personal-website`'s local copy and the package's copy are separately-hashed physical files; importing both simultaneously means two different `@font-face` URLs for nominally the same font, and preload hints for both can cause the browser to fetch the font twice.
- Domain-specific components (`RecipeCard`, `RecipeDetailView`, `RecipeIngredients`, `RecipeSteps`, `RecipeTagFilter`, `RecipeSearch`, `IngredientList`, `AdminLayout`, `ProtectedRoute`, `AutosaveStatus`, `ImageUpload`, `ProcessingPlaceholder`, `FileTree`, `CodeBlock`, `ConfirmDialog`, `AppCard`) — these encode personal-website's business logic, not generic UI, and stay in `personal-website`
- A router-agnostic `Header` API (accepting an injectable `Link` component / active-path callback) — `react-router-dom` is a straight peer dependency instead
- CJS build output — the package ships ESM only; every known and planned consumer uses a modern bundler (Vite)
- Visual regression testing (Chromatic or similar) — a good follow-up once the component set stabilizes, not required for v1
- Multi-framework Storybook support (Vue, Angular, etc.) — React only, matching every akli.dev app today

## User Stories

- As the site owner, I want to import `Header`/`Footer`/`Button`/etc. from one package across pokedex, sand-box, and future apps, so branding and design stay consistent without copy-pasting code.
- As a visitor to akli.dev, I want to browse an interactive component catalog at `storybook.akli.dev`, so I can see the design system as a portfolio piece.
- As the site owner, I want new component versions to publish automatically on merge to `main`, so I don't have to remember manual release steps.
- As the site owner, I want Storybook to enforce the same accessibility bar as `personal-website` (`vitest-axe` / `eslint-plugin-jsx-a11y`), so shared components don't regress accessibility for any consumer.

## Design & UX

### Package contents (v1 extraction set)

Generic/reusable, no personal-website business logic — extracted from `personal-website`'s `src/components/`:

- `Header`, `Footer`, `ThemeToggle` — shared site chrome
- `Button`, `Typography`, `Link`, `Input`, `Card`, `Callout`, `Grid`, `Image`, `Loading`, `List`/`ListItem`, `icons` — primitives. `List`/`ListItem` is added to this list (not in the original scoping pass) because `Grid` re-exposes it — it isn't optional.
- `src/styles/tokens.css`, `fonts.css`, `text.module.css`, `animations.css`, `interactions.module.css`, `stateBox.module.css` — the paper design system's tokens and shared style primitives, plus the `.woff2` font files and OFL license files under `src/assets/fonts/` that `fonts.css`'s `@font-face` rules reference via relative `url()` — these binary assets move with `fonts.css`, or its CSS references 404
- `fonts.css` must be extracted (and consumed) *before* `tokens.css`: `personal-website` deliberately loads them in that order today because `tokens.css`'s `--font-sans` list depends on the metric-matched `'Geist Fallback'` face that only `fonts.css` declares — this ordering dependency is carried into the package's docs, not just its own file order (see Performance below)
- Internal (non-exported) implementation details these components depend on and that must move with them: the `useMeasuredHeightVar` hook (`Header`), `usePreloadImage` hook (`Image`), and the `isExternalHref` util (`Link`) — all portable with no further personal-website coupling
- `Input` currently wraps its ref forwarding in `forwardRef` (`personal-website`'s `Input.tsx`) — a pre-React-19 pattern. Since this package targets React 19 exclusively (see Peer dependencies below), extraction is the natural point to modernize it to a plain `ref` prop instead of carrying the `forwardRef` wrapper into a brand-new package. Scoped to `Input` specifically — a grep of `personal-website`'s components for `forwardRef` at implementation time should confirm whether any other extracted component has the same pattern before assuming it's isolated to just this one
- `Footer` imports `SOCIAL_LINKS` (Akli's actual GitHub/LinkedIn/email) and hardcodes `"akli.dev"` — this is deliberate, not a scoping mistake: every akli.dev app is expected to share the same owner branding, so `Footer`'s content is not parameterized

Left in `personal-website` (domain-specific, not part of this extraction): `RecipeCard`, `RecipeDetailView`, `RecipeIngredients`, `RecipeSteps`, `RecipeTagFilter`, `RecipeSearch`, `IngredientList`, `AdminLayout`, `ProtectedRoute`, `AutosaveStatus`, `ImageUpload`, `ProcessingPlaceholder`, `FileTree`, `CodeBlock`, `ConfirmDialog`, `AppCard`.

### Storybook

- Every exported component gets a `.stories.tsx` covering all documented variants/props (e.g. `Header`'s `variant: 'public' | 'admin' | 'logged-out'`)
- A toolbar theme toggle switches `data-theme` on `<html>` via a global decorator, so components render identically to production light/dark mode
- Autodocs (`tags: ['autodocs']`) generates a props table + description per component from TSDoc comments (existing components like `Header` already have `@default` JSDoc comments that autodocs will pick up)
- `addon-a11y` runs axe checks live in the Storybook UI, complementing (not replacing) `vitest-axe` component tests
- Deployed as a static build to `storybook.akli.dev` (its own dedicated bucket and CloudFront distribution, per the `akli-infrastructure` companion PRD); discovery (a new card on `personal-website`'s Apps page) is owned by the `personal-website` companion PRD, not this one
- Ships its own distinct favicon/icon set (see Favicon & manifest below) — a new Storybook-specific design, not a reuse of `personal-website`'s "a" mark, matching how `pokedex` and `sand-box` each got their own app-specific icon rather than the base site's branding

### States

Storybook is public with no auth — no empty/error/loading states beyond Storybook's own default docs/canvas/controls views.

## Technical Considerations

### Repo & stack

- New repo `akli-ui`, public on GitHub
- Package manager: pnpm, version-pinned via `"packageManager": "pnpm@<version>"` in `package.json` (corepack-resolved, matching `personal-website`'s own `pnpm@11.9.0` pin) — not left to whatever pnpm happens to be installed on a given machine or CI runner
- `"engines": { "node": ">=24" }`, matching `personal-website`'s current pin — CI fails fast on a Node/pnpm mismatch rather than producing a build that behaves differently locally vs. in CI
- Stack mirrors `personal-website` where sensible, kept slim: React 19, TypeScript (strict), Vite in library mode, CSS Modules, the same ESLint rule set (`func-style: expression`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import-x`), Prettier, Vitest + Testing Library + `vitest-axe`
- `react-router-dom` is a `peerDependency` (and `devDependency` for local dev/tests/Storybook) — not bundled, matching how `Header.tsx` already imports it directly today
- `"license": "MIT"` in `package.json` plus a `LICENSE` file at repo root — neither exists in `personal-website`/`akli-infrastructure` today (both `"private": true`, never published), but `@akli-dev/ui` is a real published npm package and an unlicensed public package is a real adoption/tooling friction point (npmjs.com flags it, and license-checking tooling in any consumer's CI would too)
- `"repository"`, `"homepage"`, and `"bugs"` fields in `package.json` pointing at `github.com/vandelay87/akli-ui` — standard npm metadata; also what npmjs.com uses to render the "Repository"/"Homepage" links on the package page. (Trusted Publisher matching itself is configured separately, on npmjs.com — see Versioning & release — not derived from this field.)

### Package build

- `vite build` in library mode, output `format: ['es']` only (no CJS)
- Type declarations generated via `vite-plugin-dts`
- `package.json` `exports` map: a main entry (`.`) for components, plus a separate `./tokens.css` export path for the global stylesheet that consuming apps import once at their root. Each JS-bearing entry (`.`) declares an explicit `"types"` condition pointing at its own `.d.ts` (not left to `main`/`types` top-level-field fallback resolution) — required for correct resolution under `moduleResolution: "bundler"`/`"nodenext"` in consuming apps; a missing `"types"` condition inside `exports` is a common way ESM-only packages silently break type resolution for consumers even though the JS itself works fine
- `"files": ["dist"]` in `package.json` (or an equivalent `.npmignore`) so `npm publish` ships only the built package — not source `.tsx`/`.stories.tsx`/tests/docs/config files. Without this, npm's default publish behavior includes the whole working tree (minus `.gitignore`d paths), which is both unnecessary weight for every installer and a way for internal-only files to leak into the public package
- Peer dependencies: `react@^19`, `react-dom@^19`, `react-router-dom@^7` (matching `personal-website`'s current versions)
- `build.target` set explicitly to a modern baseline (e.g. `esnext`) rather than left at whatever default the installed Vite version ships — every declared/planned consumer is itself a modern Vite + React 19 app (see Goals), so there's no reason to pay for legacy-browser transpilation/polyfill weight in a package whose entire consumer base doesn't need it. Confirm the exact recommended target string against the installed Vite version's current docs at implementation time rather than assuming a value from this PRD, since Vite's own target presets/defaults have changed across major versions.
- **CSS Modules build approach — resolved via a milestone-1 spike, not assumed upfront.** A default `vite build` in library mode transforms `.module.css` imports at build time (hashed class names baked into the compiled JS, processed CSS emitted separately) — it does not leave raw source `.module.css` untouched next to compiled JS the way plain "ship as-is" implies. There's also a known Vite gotcha where a node_modules package whose JS still contains raw CSS-Module imports can trip up dev-server dependency pre-bundling (`optimizeDeps`, esbuild-based) in consuming apps. Before committing to an architecture, milestone 1 includes building 1–2 real components and installing the package into a scratch Vite app to verify both `pnpm dev` and a production build work. Default/fallback plan if the "ship raw `.module.css`" approach proves fragile: precompile CSS Modules into an already-hashed stylesheet at package-build time, so the JS ships with final class names baked in and the consumer imports one compiled CSS file — simpler and more robust, and the preferred starting point unless the spike shows the raw-passthrough approach works cleanly.
- `package.json` declares `"sideEffects": ["*.css"]` (not `false`) so bundlers don't strip CSS imports as dead code, while still allowing tree-shaking of unused component JS. Whether the public API is a single barrel export (`@akli-dev/ui` exporting everything) or per-component subpath exports (`@akli-dev/ui/Header`, etc.) is decided during the milestone-1 spike based on what tree-shakes cleanly in practice — the AC below requires tree-shaking to work either way, not a specific export shape.

### Performance

Packaging itself (ESM + tree-shaking + CSS Modules) introduces no inherent overhead versus today's in-repo components — same code, same CSS, bundled into the consumer's own output either way, contingent on tree-shaking actually working (which is why this is verified by a spike below, not assumed). This section was reviewed by the project's performance-engineer specialist; several gaps below were caught during that review, not assumed away.

- **Font loading is a two-part mechanism — `font-display: swap` alone is not the actual CLS fix.** `fonts.css` already declares `swap` on every `@font-face`, but the real mitigation in `personal-website` today is a separate, metric-matched `'Geist Fallback'` face (`ascent-override`/`descent-override`/`size-adjust`, computed via capsize) referenced in `tokens.css`'s `--font-sans` list — `swap` alone still shifts layout if the fallback's box metrics don't match the web font. Both the fallback face declaration *and* its position in `--font-sans` must survive extraction; verifying `swap` is present is necessary but not sufficient.
- **Import order: `fonts.css`, then `@akli-dev/ui/tokens.css`, once, at the consuming app's entry point, before first render.** Late-imported or wrong-order stylesheets produce either a flash of unstyled content or a font-swap layout shift (see Package contents above for why the order matters specifically). This is documented in the package's README/Storybook docs as a hard requirement, not left implicit.
- **Font preloading is in v1, via a shipped Vite plugin — not a hardcoded link.** `personal-website`'s own `<link rel="preload">` (`index.html`) works only because Vite owns that HTML file and rewrites the literal source path to its final hashed `dist/assets/...` name at build time. `@akli-dev/ui` doesn't own the consumer's `index.html`, and once the font ships inside `node_modules/@akli-dev/ui`, its filename gets re-hashed again by *the consumer's own* build when it processes the `url()` reference in `fonts.css` — so a hardcoded link in the package's docs would silently go stale on the next build. The fix is a small Vite plugin, `@akli-dev/ui/vite-plugin`, exporting `preloadFonts()`, that the consumer adds to their own `vite.config.ts` `plugins` array. Because it runs *inside* the consumer's build, it has access to the actual final hashed filename via Rollup's `generateBundle` hook and injects the correct `<link rel="preload" as="font" type="font/woff2" crossorigin>` into the consumer's built `index.html` via Vite's `transformIndexHtml` hook — no hardcoding, no staleness risk, same outcome `personal-website` gets natively. Documented in the package's README as a required (not optional) setup step alongside the CSS import order, since it's the primary CLS mitigation for a font this central to every consumer's initial render.
  - Prerequisite this depends on: `build.assetsInlineLimit` must exclude the `.woff2` font file(s) from base64-inlining during the package's own build — an inlined font has no separate URL to preload against, silently defeating the whole mechanism. Verified explicitly in the milestone-1 spike (below), not assumed from Vite's defaults.
  - `swap` plus the correctly-extracted fallback face (above) remains the mitigation for any consumer that doesn't add the plugin — the plugin is documented as required, but the fallback still holds if someone skips it.
- **The milestone-1 spike is scoped concretely:** the scratch app renders enough real text set in the web fonts to actually surface a font-swap layout shift (a near-empty page can pass "no CLS" trivially regardless of whether the fallback config is correct); the tree-shaking check imports one icon from the `icons` barrel specifically, in addition to a standalone component — a barrel of many small named exports (`icons` has ~20) is the classic real-world tree-shaking failure mode in UI libraries, and a single standalone component alone gives weaker assurance; and "no CLS" is measured as a Lighthouse CLS score of `0` against that scratch page, not a vaguer "attributable to" judgment call. The spike also builds and wires up `preloadFonts()` into the scratch app's `vite.config.ts` and confirms, via the scratch app's built `index.html`, that the injected `<link rel="preload">` references the actual final hashed font filename the scratch build emitted (not a stale/guessed path) — this is what settles whether the `generateBundle`/`transformIndexHtml` approach works at all before it's relied on in Milestones 2+.
- **Bundle-size / tree-shaking check: an ongoing CI gate, not a one-off spike.** The milestone-1 spike settles the *architecture*, but nothing else stops a later regression (a new component reintroducing a barrel-coupling issue, a Changesets release accidentally flipping `sideEffects`) from creeping back in across milestones 2 onward. A lightweight assertion (e.g. `size-limit`, or a script asserting one component's/icon's production chunk excludes another's) runs in CI on every PR, not just once during the spike. This gate is JS-only: if the milestone-1 spike lands on the precompiled-single-stylesheet CSS fallback (see Package build), one CSS import pulling in every component's styles is an accepted tradeoff of that approach, not a regression to chase.

### Theme bootstrap (`ThemeToggle`)

`ThemeToggle` never reads `localStorage` or `prefers-color-scheme` itself today — it only mirrors a `data-theme` attribute that `personal-website`'s inline bootstrap `<script>` sets on `<html>` before hydration (an SSR flash-of-wrong-theme fix). Extracted as-is, any CSR-only consumer (pokedex, sand-box, Storybook) would get a toggle that always assumes `'light'` on load and never reflects the page's actual/previously-chosen theme — this directly contradicts the package's own goal of "no personal-website-specific wiring beyond importing tokens.css once," so it's resolved now rather than left as an open question:

- `ThemeToggle` becomes self-contained by default: on mount, it reads `localStorage.getItem('theme')` (falling back to `prefers-color-scheme`) and sets `data-theme` itself, rather than assuming an external bootstrap script already ran
- The SSR-specific pre-hydration bootstrap-script optimization (avoiding a flash of the wrong theme) remains available as an opt-in for consumers that do SSR (i.e. `personal-website`, once its own migration lands) — documented in the package's README/Storybook docs as an optional step, not a requirement

### Versioning & release

- [Changesets](https://github.com/changesets/changesets) for semver bumps and changelog generation — a single lightweight devDependency purpose-built for this exact shape (single-package repo, automated npm publish via CI)
- On merge to `main`, a GitHub Action runs the Changesets release flow: if changeset files are pending, it opens/updates a "Version Packages" PR; once that PR merges, it publishes to npm automatically
- **Publishes via npm Trusted Publishing (OIDC), not a static token** — consistent with the OIDC-over-static-credentials pattern already adopted for every AWS deploy in this project (`per-app-buckets-and-oidc-deploy.md`). The publish job declares `permissions: id-token: write`; npm's CLI exchanges that token directly with the registry at publish time. No `NPM_TOKEN` or any other long-lived npm credential exists in this repo, in GitHub secrets, or anywhere else.
  - Requires npm CLI `>=11.5.1` in the CI runner — verify/pin the version explicitly rather than assuming whatever ships with the workflow's Node setup, since trusted publishing silently isn't available on older CLI versions.
  - One-time setup (analogous to registering the AWS OIDC provider once): in the `@akli-dev/ui` package's Settings on npmjs.com, add this exact GitHub repo + publish workflow file as a **Trusted Publisher**. Done once before the first automated publish; no per-run action needed afterward.
  - Whoever implements this should confirm at implementation time that the chosen publish mechanism (`changesets/action`, or a custom `npm publish` step if that action's OIDC support lags) correctly picks up the OIDC exchange — check current Changesets/npm docs rather than assuming, since trusted publishing is a newer npm feature.
  - Bonus, not the primary motivation: trusted publishing also generates signed provenance attestations automatically, verifying the published artifact was built from this exact repo/commit/workflow — a supply-chain integrity property that a static token doesn't provide.

### Storybook build & deploy

- Storybook (current major), Vite builder (`@storybook/react-vite`), matching the package's own build tooling
- Addons: `essentials` (docs/controls/actions), `a11y`, and a theme-toggle decorator driving `data-theme`
- `build-storybook` output is deployed to `s3://<StorybookBucket>` **root** (no path prefix — this bucket serves only Storybook, from its own dedicated CloudFront distribution) with a CloudFront invalidation on that distribution, e.g. `aws s3 sync ./storybook-static s3://$S3_BUCKET_NAME --delete`
- Authenticates via GitHub OIDC, not static credentials: `aws-actions/configure-aws-credentials@v5` with `role-to-assume: <StorybookDeployRole ARN>`, and the job declares `permissions: id-token: write`. `StorybookDeployRole` is created by the companion `akli-infrastructure` PRD (`storybook-app-routing.md`), scoped only to `StorybookBucket` and its own distribution's invalidation — this repo never holds a static AWS key, matching the OIDC pattern already live for `pokedex` and `sand-box`'s deploy workflows. The Role ARN isn't sensitive and can be committed directly in `deploy.yml` (or kept as a repo variable).
- This deploy step is only useful in production once the companion `akli-infrastructure` PRD's `StorybookBucket`/`StorybookDeployRole`/`StorybookSiteStack` land.
- No secret values are recorded in this PRD or committed to any repo

### Favicon & manifest

Storybook must not ship with its default favicon — it needs the same real icon set every other akli.dev app has, including the fix already applied to `personal-website` (#384), `pokedex` (#50), and `sand-box` (#11): Google Search crops favicons into a circle in search-result snippets, and the original icon set(s) clipped the logo when cropped that way. The replacement set (already proven across all three existing apps) is the baseline to match here, not a from-scratch design:

- Icon set: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `apple-touch-icon.png` (180×180), `android-chrome-192x192.png`, `android-chrome-512x512.png` — same file set and sizes as the other three apps
- **Storybook gets its own distinct icon design**, not a reuse of `personal-website`'s "a" mark — matching how `pokedex` and `sand-box` each shipped an app-specific icon rather than the base site's branding. Source artwork must be provided by the user before this can ship (same prerequisite pattern as the Apps-page screenshot in the `personal-website` companion PRD) — not owned by whoever implements this PRD.
- Wired into Storybook the same way `index.html` does it for the other apps: `<link rel="icon">` (multiple sizes), `<link rel="apple-touch-icon">`, `<link rel="manifest">` — but Storybook doesn't hand-author its own `index.html`, so this goes through `.storybook/manager-head.html` (injected into the Storybook manager UI's `<head>`) and `staticDirs` in `.storybook/main.ts` pointing at wherever the icon files live in this repo, so they're copied into `storybook-static/` on build and deployed alongside the rest of the static output
- `site.webmanifest`: same shape as the other three apps (`icons` array with `"purpose": "any maskable"` on both `android-chrome` sizes, `theme_color`, `background_color`, `display: "standalone"`), with `name`/`short_name` reflecting Storybook (e.g. `"Storybook — akli.dev"` / `"Storybook"`, matching the `"Pokédex — akli.dev"` / `"Pokédex"` pattern `pokedex` uses) rather than reusing `personal-website`'s manifest values verbatim
- Verified the same way the existing fix was verified: the icon survives Google's circular crop without clipping — not just "a favicon exists" — spot-checked against the same reference set that already passed this for the other three apps

### CI (pull requests)

- Mirrors `personal-website`'s `ci.yml` shape: lint, test (`vitest run`, including `vitest-axe` assertions), build (package + Storybook) on every PR
- No deploy/publish steps run on PRs — only on merge to `main`
- `.github/dependabot.yml` configured identically to `personal-website`'s and `akli-infrastructure`'s (npm + github-actions ecosystems, weekly, grouped minor/patch updates) — a new repo starting without it is how dependency-update coverage silently has a gap; this repo should have the same coverage from its first commit, not added later once something's already gone stale

### Accessibility

- **Target: WCAG 2.2 AA.** `eslint-plugin-jsx-a11y` is included in this repo's ESLint config, matching `personal-website`.
- **Correction from an earlier draft of this PRD**: `vitest-axe` assertions are *not* an existing pattern being carried over for these specific components. In `personal-website` today, `axe(container)` coverage exists only at the page/view level (`Home`, `Apps`, `Recipes`, etc.) — none of `Header`, `Footer`, `ThemeToggle`, `Button`, `Typography`, `Link`, `Input`, `Card`, `Callout`, `Grid`, `Image`, or `Loading` have a `vitest-axe` assertion today. Adding one to each of the 12 extracted components in this repo is net-new test authoring (precedented elsewhere in the codebase, but not a mechanical port) and is sized accordingly in Milestones 2–3.
- `vitest-axe` (runs in jsdom) and Storybook's `addon-a11y` (runs in a real browser) are complementary, not redundant: jsdom cannot evaluate color contrast, focus-indicator visibility, or keyboard operability, so "no axe violations" is necessary but not sufficient. To make the real-browser check CI-enforced rather than a manual Storybook-UI activity, `@storybook/test-runner` (drives `addon-a11y` headlessly via Playwright) is added to the CI workflow.
- Focus-visible styles must use enough CSS specificity to survive being embedded inside a consumer's own global CSS/reset — a real risk once these components ship into `pokedex`/`sand-box`/future apps, unlike `personal-website` where the design system owns all the CSS on the page. Verified in both themes.
- A lightweight contrast-ratio check (a small script or unit test computing contrast for the documented token pairs against AA minimums) guards the exported tokens, since Chromatic/visual regression is explicitly out of scope for v1 and neither `vitest-axe` nor jsdom can catch contrast regressions.
- Storybook docs (autodocs or a shared "Accessibility" MDX page) state each component's required usage contract — e.g. `Input` needs an associated label, icon-only `Button`/`ThemeToggle` need an explicit `aria-label`, `Card`'s auto-`button`-semantics-when-`onClick` behavior, decorative `icons` need `aria-hidden` — since the audience for this package is someone importing it without reading the source.
- Icon-only interactive elements (`ThemeToggle`, icon-only `Button` variants) are checked against the WCAG 2.2 target-size criterion (≥24×24px) via a manual pass — axe-core's automated coverage of WCAG 2.2-specific criteria (target size, focus-not-obscured) is thin-to-absent, so this can't be assumed covered by "axe says no violations."
- Before the first `npm publish`, a manual keyboard-only pass across all component stories (tab order, visible focus, no traps) plus a spot-check of any live-region/status content is required, in both themes — neither is verifiable by axe.

### Milestones

1. Repo scaffold: `package.json` (`packageManager` pin, `engines`, `license`, `repository`/`homepage`/`bugs`, `files`), `LICENSE`, `tsconfig`, Vite lib config (`build.target`, `exports` map with per-entry `"types"` conditions), ESLint/Prettier, `.github/dependabot.yml`, CI workflow (lint/test/build on PR, plus an ongoing bundle-size gate — see Performance) — plus the CSS Modules build spike (build 1–2 real components, `fonts.css` + `tokens.css`, and one icon from the `icons` barrel; install into a scratch Vite app that renders real text; verify `dev` and production build both work; confirm JS tree-shaking with a bundle-size check on both the component and the icon import; run Lighthouse against the scratch app targeting a CLS score of `0`; build `@akli-dev/ui/vite-plugin`'s `preloadFonts()` and confirm it injects a correctly-hashed `<link rel="preload">` into the scratch app's built `index.html`) to settle the package's CSS/export architecture and performance baseline before extracting everything else
2. Extract components + tokens from `personal-website` into this repo (copied, not moved yet — `personal-website` keeps its own copies until its own migration lands per the companion PRD); existing non-a11y tests carried over unchanged
3. Add `vitest-axe` coverage to each extracted component (net-new — see Accessibility below), and set up Storybook: stories for every component, `addon-a11y` (+ `@storybook/test-runner` in CI), autodocs, theme toggle
4. Release automation: Changesets + npm publish workflow, first `0.1.0` publish to `@akli-dev/ui`
5. Storybook deploy workflow: build + sync to `StorybookBucket` root via OIDC, gated on the `akli-infrastructure` PRD's bucket/Role/site-stack landing first; favicon/manifest icon set wired in via `manager-head.html`/`staticDirs` before this first real deploy, gated on the user providing Storybook-specific source artwork
6. Apps page card — cross-referenced, implemented under the `personal-website` companion PRD, not owned here

## Acceptance Criteria

- [ ] New repo `akli-ui` exists, public, with `docs/prds/` containing this PRD
- [ ] `package.json` publishes as `@akli-dev/ui`, ESM only, with `react`, `react-dom`, `react-router-dom` declared as peer dependencies
- [ ] `Header`, `Footer`, `ThemeToggle`, `Button`, `Typography`, `Link`, `Input`, `Card`, `Callout`, `Grid`, `Image`, `Loading`, `List`/`ListItem`, `icons` are exported from the package with their existing props/behavior preserved
- [ ] `useMeasuredHeightVar`, `usePreloadImage`, and `isExternalHref` move into the package as internal (non-exported) implementation details of `Header`/`Image`/`Link` respectively
- [ ] Design tokens (`tokens.css` and related shared stylesheets) are exported at a separate `@akli-dev/ui/tokens.css` path, importable once at a consuming app's root
- [ ] `package.json` declares `"sideEffects": ["*.css"]`; importing a single component from a scratch consuming app (e.g. just `Button`) does not pull unrelated components' JS into that app's production bundle (verified via a build output/bundle-analysis check, not just visual inspection)
- [ ] `package.json` includes `"packageManager"` (pinned pnpm version), `"engines": {"node": ">=24"}`, `"license": "MIT"`, and `"repository"`/`"homepage"`/`"bugs"` fields; a `LICENSE` file exists at repo root
- [ ] `npm publish --dry-run` (or `npm pack`) shows only `dist/` (plus standard metadata files) in the tarball — no source `.tsx`/`.stories.tsx`/tests/config files included
- [ ] Every JS-bearing entry in the `exports` map declares an explicit `"types"` condition; a clean TypeScript consumer (`moduleResolution: "bundler"`) resolves types correctly with no manual `paths` workaround
- [ ] `build.target` is set explicitly (not left at the installed Vite version's default) to a modern-only baseline appropriate for this package's Vite + React 19 consumer base
- [ ] `Input`'s ref forwarding no longer uses `forwardRef` — modernized to a plain `ref` prop, consistent with targeting React 19 exclusively
- [ ] `.github/dependabot.yml` exists, configured identically to `personal-website`'s/`akli-infrastructure`'s (npm + github-actions ecosystems, weekly, grouped minor/patch)
- [ ] `ThemeToggle` is self-contained: on mount in a CSR-only app (no bootstrap script present), it reads `localStorage`/`prefers-color-scheme` and reflects the correct theme without requiring any external pre-hydration script; the SSR bootstrap-script optimization is documented as an opt-in, not required
- [ ] Every exported component has a corresponding `.test.tsx` (non-a11y assertions carried over from `personal-website` where they exist; net-new elsewhere) passing under this repo's Vitest setup
- [ ] Every exported component has a `vitest-axe` assertion with no violations (net-new for all 12+ components — none exist at this level in `personal-website` today)
- [ ] A contrast-ratio check for the exported design tokens' documented pairs passes AA minimums
- [ ] Every exported component has a `.stories.tsx` with autodocs enabled and all documented variants covered
- [ ] Storybook's `addon-a11y` is installed and enabled, and runs headlessly in CI via `@storybook/test-runner` (not only interactively in the Storybook UI)
- [ ] Storybook docs (autodocs or a shared "Accessibility" MDX page) state each component's required accessibility usage contract (labelling requirements, which ARIA is auto-applied vs. what the consumer must supply, keyboard behavior already handled)
- [ ] Icon-only interactive components (`ThemeToggle`, icon-only `Button` variants) meet the WCAG 2.2 AA target-size criterion (≥24×24px) — verified manually, not assumed from automated axe checks
- [ ] A keyboard-only pass across all component stories (tab order, visible focus, no traps), in both themes, is completed and signed off before the first `npm publish`
- [ ] Storybook's toolbar theme toggle switches `data-theme` on `<html>`; every component is manually checked in both themes for visual correctness and for the focus-visible/contrast items above
- [ ] CI runs lint, test, and build on every PR; no deploy/publish steps run on PRs
- [ ] On merge to `main`, Changesets automation opens/updates a "Version Packages" PR when changesets are pending, and publishes to npm once that PR merges
- [ ] Publishing authenticates via npm Trusted Publishing (OIDC) — the publish job declares `permissions: id-token: write`, `@akli-dev/ui` has this repo/workflow registered as a Trusted Publisher on npmjs.com, and no `NPM_TOKEN` or other static npm credential exists anywhere in the repo or its GitHub secrets
- [ ] On merge to `main`, `build-storybook` output deploys to `StorybookBucket` root via the OIDC-assumed `StorybookDeployRole` and invalidates its dedicated CloudFront distribution (contingent on the `akli-infrastructure` PRD's bucket/Role/site-stack being live); no static AWS credentials are stored in this repo
- [ ] Storybook ships its own distinct favicon/icon set (`favicon.ico`, 16/32/48px PNGs, `apple-touch-icon.png`, `android-chrome-192x192.png`/`512x512.png`, `site.webmanifest`) — not Storybook's default favicon, and not a reuse of `personal-website`'s "a" mark
- [ ] The icon set survives Google Search's circular crop without clipping, matching the fix already verified for `personal-website`/`pokedex`/`sand-box` (#384/#50/#11)
- [ ] Favicon `<link>` tags and the manifest are injected into Storybook's built output via `.storybook/manager-head.html` and `staticDirs`, and are present in the deployed `storybook-static/` output at `storybook.akli.dev`
- [ ] `npm install @akli-dev/ui` in a clean Vite + React 19 project, importing `Header` and `@akli-dev/ui/tokens.css`: `pnpm dev` and a production build both complete with no console errors/warnings, and no missing-peer-dependency errors beyond the documented `react-router-dom` requirement
- [ ] Every `@font-face` in `fonts.css` declares `font-display: swap`; the metric-matched `'Geist Fallback'` face and its position in `tokens.css`'s `--font-sans` list survive extraction unchanged
- [ ] Font `.woff2` and license files under `src/assets/fonts/` are included in the package and resolve correctly (no 404s) from the built `fonts.css`
- [ ] Package docs (README/Storybook) state the required import order — `fonts.css`, then `@akli-dev/ui/tokens.css`, once, at the consuming app's entry point, before first render — with the FOUC/CLS risk of getting this wrong explained
- [ ] The milestone-1 scratch-app spike (rendering real text) confirms: importing a single component's or a single icon's production chunk excludes other components'/icons' JS (tree-shaking works), and a Lighthouse run against the scratch app scores CLS `0`
- [ ] `@akli-dev/ui/vite-plugin` exports `preloadFonts()`; added to a consuming app's `vite.config.ts` `plugins` array, it injects a `<link rel="preload" as="font" type="font/woff2" crossorigin>` into that app's built `index.html` referencing the actual final hashed font filename from that build (not a hardcoded or stale path) — verified in the milestone-1 scratch app
- [ ] The package's own build does not base64-inline the font asset (`build.assetsInlineLimit` excludes it) — a prerequisite for `preloadFonts()` having a real URL to target
- [ ] Package README documents `preloadFonts()` as a required setup step (alongside the `fonts.css`/`tokens.css` import order), not optional
- [ ] A bundle-size assertion (e.g. `size-limit` or equivalent) runs in CI on every PR from milestone 1 onward, not only as a one-time milestone-1 check
- [ ] `pnpm lint`, `pnpm test`, and both the package and Storybook builds pass with no errors

## Open Questions

- ~~Should the `@akli-dev` npm org be created now...~~ — resolved: the `@akli-dev` npm org has been created.
- Barrel export (`@akli-dev/ui` exporting everything) vs. per-component subpath exports (`@akli-dev/ui/Header`, etc.) — resolved during the milestone-1 CSS Modules spike based on what tree-shakes cleanly (see Technical Considerations: Package build).
