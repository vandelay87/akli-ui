# akli-ui

Shared UI component package (`@akli-dev/ui`) published to npm, plus its Storybook (deployed at `storybook.akli.dev`). Extracted from `personal-website`, whose CLAUDE.md is a useful reference for shared conventions (theming, PRD workflow) — but this repo is a *library*, not an app: everything here ships to consumers, so changes carry a different weight than an app's internal code.

## PRDs

Before implementing any new feature, check `docs/prds/` for a relevant PRD. If one exists, read it fully and follow the spec. Do not add features beyond what the PRD describes.

## Stack

- React 19 + TypeScript
- Vite 8 (library mode — `format: ['es']`, ESM-only, `target: 'esnext'`)
- CSS Modules
- Storybook 10 (`@storybook/react-vite`, `addon-a11y`, `addon-docs`/autodocs, `@storybook/test-runner`)
- Vitest + Testing Library + `vitest-axe`
- Changesets (versioning + npm Trusted Publishing/OIDC — no npm token stored in this repo)
- Package manager: pnpm (do not use npm or yarn)

## Conventions

- Components live in `src/components/<Name>/<Name>.tsx` with a co-located `<Name>.module.css`, `<Name>.test.tsx`, `<Name>.stories.tsx`, and a barrel `index.ts`.
- Path aliases: `@components/`, `@hooks/` only — narrower than `personal-website`'s set, since this package has no pages/contexts/api layer.
- The public API is a single barrel export (`src/index.ts` → `@akli-dev/ui`), not per-component subpaths — deliberately settled in issue #3's tree-shaking spike. Every new component/icon/type meant for consumers gets added there explicitly; nothing is public by default.
- Use `cx()` (`src/utils/cx.ts`) for conditional className joining — not hand-rolled `.filter(Boolean).join(' ')` or template-literal concatenation.
- Dark mode via `data-theme="light"|"dark"` on `<html>`, same mechanism as `personal-website`. `ThemeToggle` manages it; see the README's Theming section for the consumer-facing contract.
- Icons live in `src/components/icons/`, split across two files with different conventions that currently coexist rather than one having fully replaced the other:
  - `iconGlyphs.tsx` — bare JSX `<svg>` constants, sized either via explicit `width`/`height` on the `<svg>` itself, or left unsized and sized by the *consumer's* CSS via a descendant selector (e.g. `.wrapper svg { width; height }`). Check which pattern an icon already uses before adding a sibling — see the pitfall below before picking blind.
  - `icons.tsx` — components typed `FC<SizedIconProps>`, sized via an explicit `size` prop.
  - When adding a new icon with a single, known consumer, match whichever convention that file/component already uses. Don't introduce a third pattern.
- Shared CSS composables live in `src/styles/interactions.module.css` (`composes: x from '../../styles/interactions.module.css'`), plus `formField.module.css`, `stateBox.module.css`, `text.module.css`. Some of these have no consumer within this package's own `src/` yet — see the pitfall below before assuming that means "delete it."
- Accessibility bar: `vitest-axe` (jsdom, per-component, can't evaluate `color-contrast`) + `eslint-plugin-jsx-a11y` at lint time + Storybook's `addon-a11y` (real-browser axe-core, gated in CI against both light and dark themes) + `src/styles/tokens.contrast.test.ts` (a dedicated script re-deriving contrast ratios for the documented AA-override token pairs, since neither `vitest-axe` nor jsdom can catch a contrast regression). All four layers exist because each covers a gap the others can't — don't treat any one as sufficient on its own.
- Every exported component needs `vitest-axe` coverage on its meaningful rendered states, matching the pattern already used across the existing components: `import { axe } from 'vitest-axe'`, `expect(await axe(container)).toHaveNoViolations()`.

## Greppable gates

- `pnpm check:mdx-docs` (`scripts/check-mdx-docs-render.ts`, runs in CI in the `storybook-a11y` job) — fails the build if a standalone MDX docs page (tagged `unattached-mdx`, not backed by any `.stories.tsx`) throws while rendering. `@storybook/test-runner` only generates tests from `.stories.tsx` exports, so a page like `.storybook/Accessibility.mdx` is otherwise structurally invisible to it.
- `pnpm check:bundle-size` (`.size-limit.json`, runs in CI in the `check` job) — asserts that importing a single component/icon from `dist/index.js` stays within a tight per-import budget, sampled one-per-family (a leaf primitive, an icon, a composite/chrome component, a text primitive, a hook-dependent component). This is the regression gate for tree-shaking staying intact — a future change that reintroduces cross-component coupling, or a Changesets release that drops `sideEffects`, fails this instead of shipping silently.

## Pitfalls (hard-won, don't rediscover these)

- **"No consumer within this package's own `src/`" is not the same claim as "unused."** This package's whole purpose is to serve components/pages not yet extracted from `personal-website`. Before removing a token, icon, or CSS module for being unused, check whether `personal-website` actually consumes it today — it very often does (confirmed precedent: `--color-success-bg`/`--color-warning-bg`, and a large batch of icons/CSS modules surfaced by a full-epic `/simplify` pass, were both nearly removed on this exact mistake before checking).
- **A CSS class on a wrapping element cannot override a hardcoded `width`/`height` attribute on an icon's own `<svg>` root** — only a rule targeting the `<svg>` element itself (a descendant selector, or removing the attribute and sizing purely via CSS) can. Hit repeatedly across `Button`, `ThemeToggle`, and `Image` before becoming a known pattern — check which sizing convention an icon uses (see Conventions above) before wiring it into a new consumer.
- **`vite.config.ts`'s `rollupOptions.external` must stay derived from `peerDependencies`, never hand-listed.** Without it, `react`/`react-dom`/`react-router-dom` get bundled directly into `dist/index.js` instead of resolving to the consumer's own copy — this shipped once (caught in issue #12's consumer-integration verification, not by any automated gate) and breaks every real consumer with `Cannot read properties of null (reading 'useContext')` on first render, since the app ends up with two separate React instances.
- **`package.json`'s `version` is never hand-edited.** Changesets owns it entirely — add a changeset (`pnpm changeset`) instead. The first real `npm publish` is a manual, one-time exception (see the README's Releasing section) since npm's Trusted Publisher UI requires the package to already exist before it can be configured.

## Workflow

- Always run `/simplify` after completing an issue, before opening the PR.
- A PR that changes published package behavior (anything under `src/`, not internal-only tooling/docs/CI) needs a changeset (`pnpm changeset`) in the same PR — a merge without one queues no release.

## Publishing & deployment

Two independent release paths, not one:

- **The npm package** — Changesets-driven. Merging a PR with a changeset opens/updates a "Version Packages" PR; merging *that* triggers `npm publish` via npm Trusted Publishing (OIDC). See the README's Releasing section.
- **Storybook** — deployed to `storybook.akli.dev` (S3 + CloudFront) on push to `main`, independent of npm releases — see `.github/workflows/deploy-storybook.yml`.
