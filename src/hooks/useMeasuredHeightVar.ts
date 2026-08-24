import { useEffect, useRef, type RefObject } from 'react'

// Writes an element's live-measured border-box height to a CSS custom
// property on the document root via ResizeObserver, so consumers (e.g.
// `scroll-margin-block-start` on a landmark that sits below a sticky
// element) can track the element's real rendered size instead of a
// hand-tuned token approximation.
export const useMeasuredHeightVar = (
  ref: RefObject<HTMLElement | null>,
  propertyName: string
): void => {
  const lastHeightRef = useRef<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // entry.borderBoxSize, not getBoundingClientRect() — borderBoxSize is by
    // definition the content+padding+border box, so it already includes the
    // element's border-block-end without forcing a synchronous layout read on
    // every firing (getBoundingClientRect() falls back for the handful of
    // older engines that don't support borderBoxSize). Also re-fires on wrap
    // (e.g. single row -> two rows on narrow viewports), so the custom
    // property stays accurate for consumers like
    // scroll-margin-block-start without them needing wrap-aware media
    // queries. The rounded height is cached so sub-pixel jitter mid-resize
    // doesn't trigger redundant writes — every setProperty ripples a
    // style/layout recalc out to those consumers, not just the observed
    // element.
    const observer = new ResizeObserver((entries) => {
      const [entry] = entries
      const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height
      const roundedHeight = Math.round(height)

      if (roundedHeight === lastHeightRef.current) return

      lastHeightRef.current = roundedHeight
      document.documentElement.style.setProperty(propertyName, `${roundedHeight}px`)
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [ref, propertyName])
}
