// Barrel export for @akli-dev/ui.
//
// Ports Button, Typography, and IconPlus from personal-website as the
// milestone-1 build-architecture spike (issue #3) — just enough real
// component code to prove the package's Vite-library-mode build works
// before the full component extraction (issue #4) commits to an
// architecture. Whether a barrel or per-component subpath export shape
// tree-shakes cleanly is exactly what the spike is verifying, so this
// stays a single barrel for now rather than pre-empting that call.
//
// Side-effect import, not a re-export: animations.css is a plain
// (non-CSS-Module) global stylesheet holding the `spin`/`shimmer`/
// `shimmerSweep` @keyframes that Button.module.css's `animation:
// global(spin) ...` depends on. It has no JS-visible exports — the
// import exists purely so this entry's CSS output (dist/index.css)
// includes it, per `sideEffects: ["*.css"]` in package.json (which
// keeps bundlers from tree-shaking away a JS import with no bindings).
// Matches how personal-website's own entry CSS (src/index.css) pulls
// in the same file: `@import './styles/animations.css'`.
import './styles/animations.css'

// Plain relative specifiers on purpose, not the `@components`/`@hooks`
// aliases (see vite.config.ts's tsconfig `paths` / resolve.alias entries) —
// this is the package's public barrel, and unplugin-dts's alias-rewrite pass
// (transformAlias in unplugin-dts's bundled runtime) resolves aliased
// specifiers here against the wrong base directory, emitting dist/index.d.ts
// re-exports like `../../../../../src/components/Button` that point outside
// the published dist/ tree entirely (confirmed by reading unplugin-dts's
// source; reproduced with both the tsconfig-paths-derived alias and a
// manually-specified `aliases` option, so it's not specific to
// `pathsToAliases`). A literal relative import never enters that rewrite
// path — TS's declaration emitter passes it through verbatim — and because
// entryRoot: 'src' makes dist/ mirror src/'s structure 1:1, the untouched
// specifier already resolves correctly post-build. Both aliases remain fine
// to use in non-exported/internal files (e.g. Grid.tsx's `@components/List`,
// Image.tsx's `@hooks/usePreloadImage`) — confirmed empirically (built and
// inspected dist/) that files reached only via this barrel's re-export, not
// unplugin-dts's own entries, aren't subject to the same rewrite bug. Just
// don't reach for either alias in this file specifically.
export { default as Button } from './components/Button'
export type { ButtonProps } from './components/Button/Button'
export { default as Typography } from './components/Typography'
export { default as Link } from './components/Link'
export type { LinkProps } from './components/Link/Link'
export { default as Input } from './components/Input'
export type { InputProps } from './components/Input/Input'
export { default as Card } from './components/Card'
export type { CardProps } from './components/Card/Card'
export { default as Callout } from './components/Callout'
export type { CalloutProps } from './components/Callout/Callout'
export { default as Grid } from './components/Grid'
export { default as Image } from './components/Image'
export type { ImageProps } from './components/Image/Image'
export { default as Loading } from './components/Loading'
export type { LoadingProps } from './components/Loading/Loading'
export { default as List, ListItem } from './components/List'
export type { ListProps, ListItemProps } from './components/List/List'
export { IconPlus, IconPreview, IconAlertCircle } from './components/icons'
export type { SizedIconProps, IconAlertCircleProps } from './components/icons'
export {
  iconChevronUp,
  iconChevronDown,
  iconRemove,
  iconEdit,
  iconPublish,
  iconWarning,
  iconDelete,
  iconRetry,
  iconLock,
  iconInvite,
  iconUnpublish,
  iconDocument,
  iconViewPublic,
  iconNotFound,
  iconUploadCloud,
  iconAddImage,
  iconReplace,
} from './components/icons'
