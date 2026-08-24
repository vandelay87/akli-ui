import '@testing-library/jest-dom'
import { vi } from 'vitest'

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
export class MockResizeObserver {
  observe: ReturnType<typeof vi.fn>
  unobserve = vi.fn()
  disconnect = vi.fn()

  constructor(callback: ResizeObserverCallback) {
    this.observe = vi.fn((element: Element) => {
      callback([{ target: element } as ResizeObserverEntry], {} as ResizeObserver)
    })
  }
}

window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
