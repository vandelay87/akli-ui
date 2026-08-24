import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// vitest-axe runs in jsdom, and jsdom cannot evaluate color-contrast (no real
// layout/rendering) — see tests/setup.ts's comment on the same limitation.
// This file is the "separate, explicit contrast-ratio check" that comment
// promises: it re-derives contrast ratios for tokens.css's documented
// AA-override pairs directly from the current source file (not from a
// hardcoded snapshot of hex values), so an edit to a foreground *or*
// background token that regresses contrast is caught automatically.

const AA_NORMAL_TEXT_MIN = 4.5

// ── WCAG 2.x contrast math ──────────────────────────────────────────────
// Deliberately hand-rolled rather than pulling in a dependency for one
// well-known, ~20-line formula (sRGB -> linear RGB via the standard gamma
// curve, relative luminance via the standard coefficients, then the
// (L1+0.05)/(L2+0.05) ratio) — https://www.w3.org/TR/WCAG21/#contrast-minimum

type Rgb = { r: number; g: number; b: number }
type Rgba = Rgb & { a: number }

const srgbChannelToLinear = (channel: number): number => {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

const relativeLuminance = ({ r, g, b }: Rgb): number =>
  0.2126 * srgbChannelToLinear(r) + 0.7152 * srgbChannelToLinear(g) + 0.0722 * srgbChannelToLinear(b)

const contrastRatio = (a: Rgb, b: Rgb): number => {
  const lumA = relativeLuminance(a)
  const lumB = relativeLuminance(b)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

// Alpha-composites a translucent color over an opaque backdrop (both of
// tokens.css's tint backgrounds, --color-success-bg/--color-warning-bg, are
// declared as rgba() washes, not solid hex, since they're meant to tint
// whatever surface they sit on).
const compositeOver = (fg: Rgba, backdrop: Rgb): Rgb => ({
  r: fg.r * fg.a + backdrop.r * (1 - fg.a),
  g: fg.g * fg.a + backdrop.g * (1 - fg.a),
  b: fg.b * fg.a + backdrop.b * (1 - fg.a),
})

// ── tokens.css parsing ──────────────────────────────────────────────────
// Reads the real file and extracts each theme's custom-property
// declarations into a name -> raw-value map, resolving var(--x) references
// within the same theme block. This is what makes the check a genuine
// regression guard: it reflects whatever tokens.css currently says, not a
// copy frozen at the time this test was written.

const tokensCssPath = join(dirname(fileURLToPath(import.meta.url)), 'tokens.css')
const tokensCss = readFileSync(tokensCssPath, 'utf-8')

const extractBlock = (css: string, selector: string): string => {
  const selectorIndex = css.indexOf(selector)
  if (selectorIndex === -1) {
    throw new Error(`tokens.css: could not find selector ${JSON.stringify(selector)}`)
  }
  const braceOpen = css.indexOf('{', selectorIndex)
  // None of :root's or [data-theme="dark"]'s declarations contain nested
  // braces, so the first line that is just "}" closes the block.
  // Relies on tokens.css's convention of an unindented top-level "}" vs. indented nested braces.
  const braceClose = css.indexOf('\n}', braceOpen)
  return css.slice(braceOpen + 1, braceClose)
}

const parseDeclarations = (block: string): Map<string, string> => {
  const declarations = new Map<string, string>()
  const declarationPattern = /--([a-zA-Z0-9-]+):\s*([^;]+);/g
  let match: RegExpExecArray | null
  while ((match = declarationPattern.exec(block)) !== null) {
    const [, name, rawValue] = match
    declarations.set(name, rawValue.trim())
  }
  return declarations
}

const VAR_REFERENCE_PATTERN = /^var\(--([a-zA-Z0-9-]+)\)$/

// Resolves a token's raw value, following var(--x) references within the
// same theme block (e.g. --color-text-faint-on-field: var(--color-text-faint)
// in light mode, --color-success-on-tint: var(--color-success) in dark mode).
const resolveRawValue = (declarations: Map<string, string>, tokenName: string): string => {
  const seen = new Set<string>()
  let current = tokenName
  for (;;) {
    if (seen.has(current)) {
      throw new Error(`tokens.css: circular var() reference resolving --${tokenName}`)
    }
    seen.add(current)
    const rawValue = declarations.get(current)
    if (rawValue === undefined) {
      throw new Error(`tokens.css: no declaration found for --${current}`)
    }
    const varMatch = VAR_REFERENCE_PATTERN.exec(rawValue)
    if (!varMatch) {
      return rawValue
    }
    current = varMatch[1]
  }
}

const HEX_PATTERN = /^#([0-9a-fA-F]{6})$/
const RGBA_PATTERN = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/

const resolveOpaqueColor = (declarations: Map<string, string>, tokenName: string): Rgb => {
  const rawValue = resolveRawValue(declarations, tokenName)
  const hexMatch = HEX_PATTERN.exec(rawValue)
  if (hexMatch) {
    const hex = hexMatch[1]
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    }
  }
  throw new Error(
    `tokens.css: --${tokenName} resolved to ${JSON.stringify(rawValue)}, expected an opaque #RRGGBB hex value`
  )
}

const resolveTranslucentColor = (declarations: Map<string, string>, tokenName: string): Rgba => {
  const rawValue = resolveRawValue(declarations, tokenName)
  const rgbaMatch = RGBA_PATTERN.exec(rawValue)
  if (!rgbaMatch) {
    throw new Error(
      `tokens.css: --${tokenName} resolved to ${JSON.stringify(rawValue)}, expected an rgb()/rgba() value`
    )
  }
  const [, r, g, b, a] = rgbaMatch
  return { r: Number(r), g: Number(g), b: Number(b), a: a === undefined ? 1 : Number(a) }
}

const rootDeclarations = parseDeclarations(extractBlock(tokensCss, ':root {'))
const darkDeclarations = parseDeclarations(extractBlock(tokensCss, '[data-theme="dark"] {'))

// ── Documented pairs ─────────────────────────────────────────────────────
// Every pair below corresponds to a "WCAG AA override" comment (or, for
// --color-text-faint-on-field, an explicit stated ratio) in tokens.css,
// stating a deliberately-tuned foreground token against a specific named
// background token. Extracted for both the light (:root) and dark
// ([data-theme="dark"]) blocks. None of these pairings are large-text/UI
// components (they're status text and faint/caption text), so all are held
// to the 4.5:1 normal-text minimum rather than the 3:1 large-text one.
//
// --color-success-on-tint/--color-warning-on-tint are documented against
// their own translucent --color-*-bg token ("on their own tint
// backgrounds"), not a solid color, so there's no single unambiguous hex to
// diff against. --color-bg is used as the compositing backdrop here: it's
// the one token tokens.css's own comments already treat as the system's
// default "paper" surface (--color-text-faint's comment describes its ratio
// as being measured "on paper", i.e. against --color-bg), making it the
// most defensible canonical backdrop rather than an arbitrary pick.
type PairSpec = {
  label: string
  foreground: string
  background: string
  /** Set for tint pairs whose named background token is a translucent rgba() wash. */
  compositeBackdrop?: string
}

type DocumentedPair = {
  name: string
  declarations: Map<string, string>
  foreground: string
  background: string
  compositeBackdrop?: string
}

// One entry per documented pairing — independent of theme. Crossed with
// `themes` below to produce both the light and dark test cases, so adding a
// pair here automatically covers both themes instead of relying on someone
// to remember to duplicate it into a second, hand-maintained list.
const pairSpecs: PairSpec[] = [
  {
    label: '--color-text-faint on --color-bg',
    foreground: 'color-text-faint',
    background: 'color-bg',
  },
  {
    label: '--color-text-faint-on-surface on --color-surface',
    foreground: 'color-text-faint-on-surface',
    background: 'color-surface',
  },
  {
    label: '--color-text-faint-on-field on --color-field',
    foreground: 'color-text-faint-on-field',
    background: 'color-field',
  },
  {
    label: '--color-success-on-tint on --color-success-bg (composited over --color-bg)',
    foreground: 'color-success-on-tint',
    background: 'color-success-bg',
    compositeBackdrop: 'color-bg',
  },
  {
    label: '--color-warning-on-tint on --color-warning-bg (composited over --color-bg)',
    foreground: 'color-warning-on-tint',
    background: 'color-warning-bg',
    compositeBackdrop: 'color-bg',
  },
]

const themes: { prefix: string; declarations: Map<string, string> }[] = [
  { prefix: 'light', declarations: rootDeclarations },
  { prefix: 'dark', declarations: darkDeclarations },
]

const documentedPairs: DocumentedPair[] = pairSpecs.flatMap((spec) =>
  themes.map((theme) => ({
    name: `${theme.prefix}: ${spec.label}`,
    declarations: theme.declarations,
    foreground: spec.foreground,
    background: spec.background,
    compositeBackdrop: spec.compositeBackdrop,
  }))
)

describe('tokens.css contrast ratios', () => {
  it.each(documentedPairs)('$name meets the WCAG AA normal-text minimum (4.5:1)', (pair) => {
    const fg = resolveOpaqueColor(pair.declarations, pair.foreground)
    const bg = pair.compositeBackdrop
      ? compositeOver(
          resolveTranslucentColor(pair.declarations, pair.background),
          resolveOpaqueColor(pair.declarations, pair.compositeBackdrop)
        )
      : resolveOpaqueColor(pair.declarations, pair.background)

    const ratio = contrastRatio(fg, bg)

    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT_MIN)
  })
})
