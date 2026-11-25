# @akli-dev/ui

## 2.3.0

### Minor Changes

- [#98](https://github.com/vandelay87/akli-ui/pull/98) [`69be54d`](https://github.com/vandelay87/akli-ui/commit/69be54dc5b97ebedb963e3abb14b79411a1d4f1e) Thanks [@vandelay87](https://github.com/vandelay87)! - New `themeBootstrapScript` export: an inline script for an SSR consumer's `<head>` that applies the saved theme (falling back to the system theme) before first paint, using the same rules as `ThemeToggle`. The `Theme` type is now exported. `ThemeToggle` no longer throws when storage is blocked: the theme still switches, it just isn't remembered.

## 2.2.0

### Minor Changes

- [#95](https://github.com/vandelay87/akli-ui/pull/95) [`7b30154`](https://github.com/vandelay87/akli-ui/commit/7b301542726cbf1f59d750e587c1696658e62dea) Thanks [@vandelay87](https://github.com/vandelay87)! - `Image` now forwards undeclared native `<img>` props (`id`, `width`, `height`, `data-*`, …) and merges a `style` prop with its own object-fit styles. `onLoad` and `onError` receive the native event. A changed `src` now resets the image to its loading state instead of keeping the previous image or error. The blur placeholder URL is valid for a `src` that already has a query string. Lazy images render immediately with native `loading="lazy"` instead of waiting for an IntersectionObserver, and `lazy={false}` now renders `loading="eager"`.

## 2.1.2

### Patch Changes

- [#84](https://github.com/vandelay87/akli-ui/pull/84) [`c614ba1`](https://github.com/vandelay87/akli-ui/commit/c614ba18445591118d146953c49411f6bdc3d1e1) Thanks [@vandelay87](https://github.com/vandelay87)! - Mark the `iconUploadCloud`, `iconAddImage`, and `iconReplace` glyphs `aria-hidden="true"`, matching every other glyph, so screen readers skip them as decorative.

## 2.1.1

### Patch Changes

- [#74](https://github.com/vandelay87/akli-ui/pull/74) [`7ffb8c1`](https://github.com/vandelay87/akli-ui/commit/7ffb8c14ee2bcc6abed4a3300b80d14441d34f2b) Thanks [@vandelay87](https://github.com/vandelay87)! - Fix `Image`'s priority preload link to carry the same `srcSet`/`sizes` (including the default responsive fallback) as the rendered `<img>`, so the browser preloads the resource it actually uses instead of logging an unused-preload warning.

## 2.1.0

### Minor Changes

- [#70](https://github.com/vandelay87/akli-ui/pull/70) [`63c0798`](https://github.com/vandelay87/akli-ui/commit/63c0798d4ba871bcafb08926c542e7b6f01dbd7e) Thanks [@vandelay87](https://github.com/vandelay87)! - Add rotateIcon prop to Link, for icon glyphs that need a static rotation independent of the hover nudge direction.

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
