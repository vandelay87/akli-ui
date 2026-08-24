import { usePreloadImage } from '@hooks/usePreloadImage'
import { useState, useEffect, useRef, FC, ImgHTMLAttributes } from 'react'
import styles from './Image.module.css'

const generateBlurDataURL = (baseSrc: string) =>
  `${baseSrc}?w=10&h=10&blur=10&q=1`

export interface ImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt'
> {
  src: string
  alt: string
  priority?: boolean
  sizes?: string
  aspectRatio?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fallbackSrc?: string
  onLoad?: () => void
  onError?: () => void
  className?: string
  containerClassName?: string
  lazy?: boolean
  caption?: string
  maxWidth?: string
}

const Image: FC<ImageProps> = ({
  src,
  alt,
  priority = false,
  sizes,
  aspectRatio = 'auto',
  objectFit = 'cover',
  objectPosition = 'center',
  placeholder = 'empty',
  blurDataURL,
  fallbackSrc,
  onLoad,
  onError,
  className = '',
  containerClassName = '',
  lazy = true,
  srcSet,
  caption,
  maxWidth,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [isInView, setIsInView] = useState(!lazy || priority)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  usePreloadImage(priority ? src : undefined, {
    fetchPriority: priority ? 'high' : 'auto',
  })

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!lazy || priority || isInView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, priority, isInView])

  const handleLoad = () => {
    setIsLoaded(true)
    setIsError(false)
    onLoad?.()
  }

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setIsError(false)
    } else {
      setIsError(true)
    }
    onError?.()
  }

  const effectiveBlurDataURL =
    blurDataURL ||
    (placeholder === 'blur' ? generateBlurDataURL(src) : undefined)

  return (
    <figure
      ref={containerRef}
      className={`${styles.figure} ${containerClassName}`}
      style={{
        maxWidth: maxWidth ?? undefined,
        marginInline: maxWidth ? 'auto' : '0',
      }}
    >
      <div
        className={styles.container}
        style={{
          aspectRatio: aspectRatio !== 'auto' ? aspectRatio : undefined,
        }}
      >
      {!isLoaded && !isError && (
        <div
          className={`${styles.placeholderOverlay} ${placeholder === 'blur' ? styles.placeholderOverlayBlur : ''}`}
          aria-hidden="true"
        >
          {placeholder === 'blur' && effectiveBlurDataURL ? (
            <img
              src={effectiveBlurDataURL}
              alt=""
              className={styles.blurImage}
              aria-hidden="true"
            />
          ) : placeholder === 'blur' && !effectiveBlurDataURL ? (
            <div className={styles.pulsePlaceholder} />
          ) : (
            <div className={styles.emptyPlaceholder}>
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>
      )}

      {isError && (
        <div
          className={styles.errorOverlay}
          role="alert"
          aria-live="polite"
        >
          <div className={styles.errorContent}>
            <svg
              className={styles.errorIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className={styles.errorText}>
              Failed to load image
            </p>
          </div>
        </div>
      )}

      {isInView && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={`${styles.image} ${isLoaded ? styles.loaded : ''} ${className}`}
          style={{
            objectFit,
            objectPosition,
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          srcSet={srcSet}
          sizes={
            srcSet
              ? sizes ||
                '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
              : sizes
          }
        />
      )}

      </div>
      {caption && (
        <figcaption className={styles.caption}>{caption}</figcaption>
      )}
    </figure>
  )
}

export default Image
