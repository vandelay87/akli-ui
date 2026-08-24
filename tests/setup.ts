import '@testing-library/jest-dom'
import { expect, vi } from 'vitest'
import { configureAxe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

// Register vitest-axe's `toHaveNoViolations` matcher project-wide. Note: axe
// cannot evaluate `color-contrast` under jsdom (no real layout/rendering), so
// that rule is inherently unreliable in this environment — a separate,
// explicit contrast-ratio check (added elsewhere as part of this issue)
// covers what this matcher can't.
expect.extend(matchers)

// Shared axe runner, pre-configured once (via vitest-axe's `configureAxe`)
// rather than passed per-call, with `color-contrast` disabled for the same
// reason noted above: every component test that asserts "no axe violations"
// would otherwise pay for a rule that can't produce a meaningful result
// under jsdom.
const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } })

// Shared assertion for "renders with no detectable axe violations", used
// across every component test file so the axe configuration (and the
// color-contrast exclusion above) lives in exactly one place.
export const expectNoA11yViolations = async (container: Element): Promise<void> => {
  expect(await axe(container)).toHaveNoViolations()
}

// jsdom does not implement IntersectionObserver. Image.tsx's lazy-loading
// effect (`new IntersectionObserver(...)`) throws under jsdom without this,
// which Image.test.tsx's default (lazy, non-priority) render path hits
// immediately — this isn't optional test-authoring infra, the component
// can't mount in jsdom at all without it. Ported (trimmed) from
// personal-website's tests/setup.ts, which registers this globally for the
// same reason; ResizeObserver's mock was left out since nothing in this
// package's components use it (confirmed via grep).
export class MockIntersectionObserver {
  observe: ReturnType<typeof vi.fn>
  unobserve = vi.fn()
  disconnect = vi.fn()
  root = null
  rootMargin = ''
  thresholds = []

  constructor(callback: IntersectionObserverCallback) {
    this.observe = vi.fn((element: Element) => {
      callback(
        [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    })
  }
}

window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

// jsdom does not implement ResizeObserver either. useMeasuredHeightVar
// (`new ResizeObserver(...)`, used by Header) throws under jsdom without
// this, same situation as IntersectionObserver above. Ported (trimmed) from
// personal-website's tests/setup.ts, which registers this globally for the
// same reason.
//
// Auto-fires its callback once, synchronously, from `observe()` — sufficient
// for consumers that just need "don't throw, fire once" (e.g. Header.test.tsx,
// which never inspects the resulting height value). Also tracks every
// constructed instance and exposes `fire(entry)` so a test that needs finer
// control (e.g. useMeasuredHeightVar.test.ts's dedup/caching test, which must
// fire the same observer instance repeatedly with custom entries) can reach
// in and drive it manually — reset `MockResizeObserver.instances = []` in
// that file's own `beforeEach` since the array is static and accumulates
// across tests within a file.
export class MockResizeObserver {
  static instances: MockResizeObserver[] = []
  callback: ResizeObserverCallback
  observe: ReturnType<typeof vi.fn>
  unobserve = vi.fn()
  disconnect = vi.fn()

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    MockResizeObserver.instances.push(this)
    this.observe = vi.fn((element: Element) => {
      callback([{ target: element } as ResizeObserverEntry], this as unknown as ResizeObserver)
    })
  }

  fire(entry: Partial<ResizeObserverEntry>) {
    this.callback([entry as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
}

window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

// jsdom does not implement `window.matchMedia` (confirmed empirically: a
// throwaway assertion of `typeof window.matchMedia` under this project's
// jsdom environment returns 'undefined', not 'function'). Shaped like the
// real MediaQueryList (`matches`, `media`) plus every listener-registration
// method (both the modern EventTarget-style `addEventListener`/
// `removeEventListener` and the legacy `addListener`/`removeListener`) as
// no-op vi.fn()s, defensively: a component reading `prefers-color-scheme`
// may also register a change listener to react to a live OS theme-preference
// switch, and a mock missing whichever method it calls would throw instead
// of the test failing on an assertion.
//
// Exported as a parameterized function rather than registered globally like
// IntersectionObserver/ResizeObserver above, since callers need different
// `matches` results per test (ThemeToggle.test.tsx varies it across cases;
// Header.test.tsx always passes `false`, since none of its assertions depend
// on which theme value ThemeToggle resolves to).
export const mockMatchMedia = (matches: boolean): void => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}
