import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useMeasuredHeightVar } from './useMeasuredHeightVar'

// The shared MockResizeObserver in tests/setup.ts fires its callback exactly
// once, synchronously, from `observe()` — it can't simulate a second resize.
// This local mock captures the callback so tests can fire it repeatedly with
// controlled entries.
class ControllableResizeObserver {
  static instances: ControllableResizeObserver[] = []
  callback: ResizeObserverCallback
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    ControllableResizeObserver.instances.push(this)
  }

  fire(entry: Partial<ResizeObserverEntry>) {
    this.callback([entry as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
}

const originalResizeObserver = window.ResizeObserver

const makeEntry = (blockSize: number, element: Element): Partial<ResizeObserverEntry> => ({
  target: element,
  borderBoxSize: [{ blockSize, inlineSize: 0 } as ResizeObserverSize],
})

beforeEach(() => {
  ControllableResizeObserver.instances = []
  window.ResizeObserver = ControllableResizeObserver as unknown as typeof ResizeObserver
})

afterEach(() => {
  window.ResizeObserver = originalResizeObserver
  document.documentElement.style.removeProperty('--test-height')
  vi.restoreAllMocks()
})

describe('useMeasuredHeightVar', () => {
  it('sets the CSS custom property on document.documentElement when the observed element resizes', () => {
    const element = document.createElement('div')
    const ref = { current: element }

    renderHook(() => useMeasuredHeightVar(ref, '--test-height'))

    const [observer] = ControllableResizeObserver.instances
    act(() => {
      observer.fire(makeEntry(48, element))
    })

    expect(document.documentElement.style.getPropertyValue('--test-height')).toBe('48px')
  })

  it('skips the write when a later firing rounds to the same height (caching)', () => {
    const element = document.createElement('div')
    const ref = { current: element }

    renderHook(() => useMeasuredHeightVar(ref, '--test-height'))

    const [observer] = ControllableResizeObserver.instances
    const setPropertySpy = vi.spyOn(document.documentElement.style, 'setProperty')

    act(() => {
      observer.fire(makeEntry(48, element))
    })
    expect(setPropertySpy).toHaveBeenCalledTimes(1)

    act(() => {
      observer.fire(makeEntry(48.2, element)) // rounds to the same 48px — no redundant write
    })
    expect(setPropertySpy).toHaveBeenCalledTimes(1)

    act(() => {
      observer.fire(makeEntry(60, element))
    })
    expect(setPropertySpy).toHaveBeenCalledTimes(2)
    expect(document.documentElement.style.getPropertyValue('--test-height')).toBe('60px')
  })

  it('disconnects the observer on unmount', () => {
    const element = document.createElement('div')
    const ref = { current: element }

    const { unmount } = renderHook(() => useMeasuredHeightVar(ref, '--test-height'))
    const [observer] = ControllableResizeObserver.instances

    unmount()

    expect(observer.disconnect).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the ref is not yet attached to an element', () => {
    const ref = { current: null }

    renderHook(() => useMeasuredHeightVar(ref, '--test-height'))

    expect(ControllableResizeObserver.instances).toHaveLength(0)
  })
})
