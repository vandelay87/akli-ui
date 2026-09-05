---
"@akli-dev/ui": major
---

CSS now ships per-component instead of one global stylesheet. Previously, `dist/index.css` bundled every component's compiled styles into a single file, so `import { Button } from '@akli-dev/ui'` shipped `Button`'s CSS plus every other component's CSS an app never rendered. As of this release, each component's own compiled JS carries an import for only its own CSS, so a consumer's bundler tree-shakes unused component CSS the same way it already tree-shook unused component JS — `import { Button } from '@akli-dev/ui'` now ships only `Button`'s styles, plus any CSS it genuinely shares with other components. This makes bundles smaller for any consumer that uses only a subset of the package's components.

**Consumer-facing contract change:** `@akli-dev/ui/index.css` is no longer a required import. It still exists and is still exported at that path, but now contains only global keyframe animations (used by components like `Loading`'s spinner) rather than per-component styles.

- A new setup needs only two CSS imports:

  ```ts
  import '@akli-dev/ui/fonts.css'
  import '@akli-dev/ui/tokens.css'
  ```

- An existing consumer already importing `@akli-dev/ui/index.css` doesn't need to change anything — the import still resolves and nothing breaks. It's just smaller now (global keyframes only), since the per-component styles it used to carry now travel alongside each component's own JS import instead.

See the README's "Required CSS imports" and "Migrating from v1" sections for the full updated setup.
