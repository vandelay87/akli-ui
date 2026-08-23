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

export { default as Button } from '@components/Button'
export type { ButtonProps } from '@components/Button/Button'
export { default as Typography } from '@components/Typography'
export { IconPlus } from '@components/icons'
export type { SizedIconProps } from '@components/icons'
