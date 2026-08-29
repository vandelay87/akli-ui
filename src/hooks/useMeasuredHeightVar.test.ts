import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MockResizeObserver } from '../../tests/setup'
import { useMeasuredHeightVar } from './useMeasuredHeightVar'

// The shared MockResizeObserver (tests/setup.ts, registered globally on
// window.ResizeObserver) auto-fires its callback once from `observe()` but
// also tracks every constructed instance and exposes `fire(entry)`, so this
// file drives it directly instead of shadowing window.ResizeObserver with a
// separate local mock — the dedup/caching test below needs to fire the same
// observer instance repeatedly with custom entries, which `fire` supports.

const makeEntry = (blockSize: number, element: Element): Partial<ResizeObserverEntry> => ({
  target: element,
  borderBoxSize: [{ blockSize, inlineSize: 0 } as ResizeObserverSize],
})

beforeEach(() => {
  MockResizeObserver.instances = []
})

afterEach(() => {
  document.documentElement.style.removeProperty('--test-height')
  vi.restoreAllMocks()
})

describe('useMeasuredHeightVar', () => {
  it('sets the CSS custom property on document.documentElement when the observed element resizes', () => {
    const element = document.createElement('div')
    const ref = { current: element }

    renderHook(() => useMeasuredHeightVar(ref, '--test-height'))

    const [observer] = MockResizeObserver.instances
    act(() => {
      observer.fire(makeEntry(48, element))
    })

    expect(document.documentElement.style.getPropertyValue('--test-height')).toBe('48px')
  })

  it('skips the write when a later firing rounds to the same height (caching)', () => {
    const element = document.createElement('div')
    const ref = { current: element }

    renderHook(() => useMeasuredHeightVar(ref, '--test-height'))

    const [observer] = MockResizeObserver.instances
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
    const [observer] = MockResizeObserver.instances

    unmount()

    expect(observer.disconnect).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the ref is not yet attached to an element', () => {
    const ref = { current: null }

    renderHook(() => useMeasuredHeightVar(ref, '--test-height'))

    expect(MockResizeObserver.instances).toHaveLength(0)
  })
})
