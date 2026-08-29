import { useEffect } from 'react'

interface UsePreloadImageOptions {
  fetchPriority?: 'high' | 'low' | 'auto'
  crossOrigin?: 'anonymous' | 'use-credentials'
  srcSet?: string
  sizes?: string
}

export const usePreloadImage = (
  src: string | undefined,
  options: UsePreloadImageOptions = {}
): void => {
  const { fetchPriority = 'high', crossOrigin, srcSet, sizes } = options

  useEffect(() => {
    if (!src || typeof document === 'undefined') return

    // Check for existing link to prevent duplicates
    const selector = `link[rel="preload"][href="${src}"]`
    if (document.head.querySelector(selector)) return

    // Create the preload link
    const link = document.createElement('link')
    link.rel = 'preload'
    link.setAttribute('as', 'image')
    link.href = src

    if (srcSet) link.setAttribute('imagesrcset', srcSet)
    if (sizes) link.setAttribute('imagesizes', sizes)
    if (fetchPriority) link.setAttribute('fetchpriority', fetchPriority)
    if (crossOrigin) link.setAttribute('crossorigin', crossOrigin)

    document.head.appendChild(link)

    return () => {
      // Clean up
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
    }
  }, [src, fetchPriority, crossOrigin, srcSet, sizes])
}
