# @akli-dev/ui

## 2.0.0

### Major Changes

- [#62](https://github.com/vandelay87/akli-ui/pull/62) [`f6075c4`](https://github.com/vandelay87/akli-ui/commit/f6075c4e8e3d0bd780e6d330921292e1cc647aa9) Thanks [@vandelay87](https://github.com/vandelay87)! - CSS now ships per-component instead of one global stylesheet. Previously, `dist/index.css` bundled every component's compiled styles into a single file, so `import { Button } from '@akli-dev/ui'` shipped `Button`'s CSS plus every other component's CSS an app never rendered. As of this release, each component's own compiled JS carries an import for only its own CSS, so a consumer's bundler tree-shakes unused component CSS the same way it already tree-shook unused component JS — `import { Button } from '@akli-dev/ui'` now ships only `Button`'s styles, plus any CSS it genuinely shares with other components. This makes bundles smaller for any consumer that uses only a subset of the package's components.

  **Consumer-facing contract change:** `@akli-dev/ui/index.css` is no longer a required import. It still exists and is still exported at that path, but now contains only global keyframe animations (used by components like `Loading`'s spinner) rather than per-component styles.

  - A new setup needs only two CSS imports:

    ```ts
    import '@akli-dev/ui/fonts.css'
    import '@akli-dev/ui/tokens.css'
    ```

  - An existing consumer already importing `@akli-dev/ui/index.css` doesn't need to change anything — the import still resolves and nothing breaks. It's just smaller now (global keyframes only), since the per-component styles it used to carry now travel alongside each component's own JS import instead.

  See the README's "Required CSS imports" and "Migrating from v1" sections for the full updated setup.

## 1.0.0

### Major Changes

- [#30](https://github.com/vandelay87/akli-ui/pull/30) [`435d653`](https://github.com/vandelay87/akli-ui/commit/435d6539cf477643587501280e485b4b6ddd22f9) Thanks [@vandelay87](https://github.com/vandelay87)! - Initial release of `@akli-dev/ui`: shared React components, design tokens, and fonts extracted from personal-website, with Storybook as the interactive component catalog.
