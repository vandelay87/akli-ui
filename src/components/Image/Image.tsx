import { usePreloadImage } from '@hooks/usePreloadImage'
import {
  useState,
  useEffect,
  useRef,
  FC,
  ImgHTMLAttributes,
  ReactEventHandler,
} from 'react'
import { cx } from '../../utils/cx'
import { iconImage, iconWarning } from '../Icons'
import styles from './Image.module.css'

const generateBlurDataURL = (baseSrc: string) =>
  `${baseSrc}${baseSrc.includes('?') ? '&' : '?'}w=10&h=10&blur=10&q=1`

const DEFAULT_RESPONSIVE_SIZES =
  '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'

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
  onLoad?: ReactEventHandler<HTMLImageElement>
  /**
   * Fires on every failed attempt: once for `src`, and again for
   * `fallbackSrc` if that fails too.
   */
  onError?: ReactEventHandler<HTMLImageElement>
  className?: string
  containerClassName?: string
  /** Sets the native `loading` attribute; ignored when `priority` is set. */
  lazy?: boolean
  caption?: string
  maxWidth?: string
}

type LoadStatus = {
  source: 'src' | 'fallback'
  phase: 'loading' | 'loaded' | 'error'
}

type ImageFrameProps = Omit<
  ImageProps,
  'aspectRatio' | 'containerClassName' | 'caption' | 'maxWidth'
>

const ImageFrame: FC<ImageFrameProps> = ({
  src,
  alt,
  priority = false,
  sizes,
  objectFit = 'cover',
  objectPosition = 'center',
  placeholder = 'empty',
  blurDataURL,
  fallbackSrc,
  onLoad,
  onError,
  className = '',
  lazy = true,
  srcSet,
  style,
  ...imgProps
}) => {
  const [status, setStatus] = useState<LoadStatus>({
    source: 'src',
    phase: 'loading',
  })
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setStatus((current) => ({ ...current, phase: 'loaded' }))
    }
  }, [])

  const handleLoad: ReactEventHandler<HTMLImageElement> = (event) => {
    setStatus((current) => ({ ...current, phase: 'loaded' }))
    onLoad?.(event)
  }

  const handleError: ReactEventHandler<HTMLImageElement> = (event) => {
    if (status.source === 'src' && fallbackSrc && fallbackSrc !== src) {
      setStatus({ source: 'fallback', phase: 'loading' })
    } else {
      setStatus((current) => ({ ...current, phase: 'error' }))
    }
    onError?.(event)
  }

  const currentSrc = status.source === 'fallback' ? fallbackSrc : src
  const effectiveBlurDataURL =
    blurDataURL ||
    (placeholder === 'blur' ? generateBlurDataURL(src) : undefined)

  return (
    <>
      {status.phase === 'loading' && (
        <div
          className={cx(
            styles.placeholderOverlay,
            placeholder === 'blur' && styles.placeholderOverlayBlur
          )}
          aria-hidden="true"
        >
          {placeholder === 'blur' && effectiveBlurDataURL ? (
            <img
              src={effectiveBlurDataURL}
              alt=""
              className={styles.blurImage}
              aria-hidden="true"
            />
          ) : placeholder === 'blur' ? (
            <div className={styles.pulsePlaceholder} />
          ) : (
            <div className={styles.emptyPlaceholder}>{iconImage}</div>
          )}
        </div>
      )}

      {status.phase === 'error' && (
        <div className={styles.errorOverlay} role="alert" aria-live="polite">
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>{iconWarning}</div>
            <p className={styles.errorText}>Failed to load image</p>
          </div>
        </div>
      )}

      <img
        {...imgProps}
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cx(
          styles.image,
          status.phase === 'loaded' && styles.loaded,
          className
        )}
        style={{ ...style, objectFit, objectPosition }}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority || !lazy ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        srcSet={srcSet}
        sizes={sizes}
      />
    </>
  )
}

const Image: FC<ImageProps> = ({
  priority = false,
  aspectRatio = 'auto',
  containerClassName = '',
  caption,
  maxWidth,
  ...frameProps
}) => {
  const { src, srcSet, sizes } = frameProps
  const effectiveSizes = srcSet ? sizes || DEFAULT_RESPONSIVE_SIZES : sizes

  usePreloadImage(priority ? src : undefined, {
    fetchPriority: priority ? 'high' : 'auto',
    srcSet,
    sizes: effectiveSizes,
  })

  return (
    <figure
      className={cx(styles.figure, containerClassName)}
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
        <ImageFrame
          key={src}
          {...frameProps}
          priority={priority}
          sizes={effectiveSizes}
        />
      </div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  )
}

export default Image
