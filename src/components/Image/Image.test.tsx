import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { expectNoA11yViolations } from '../../../tests/setup'
import Image from './Image'

describe('Image', () => {
  const defaultProps = {
    src: 'https://example.com/test.jpg',
    alt: 'Test Image',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    document.head.innerHTML = ''
  })

  it('renders correctly and shows placeholder initially', () => {
    render(<Image {...defaultProps} />)

    // Find the image by alt text
    const img = screen.getByAltText('Test Image')
    expect(img).toBeInTheDocument()
    // Before load, the image should not have the loaded class
    expect(img.className).not.toMatch(/loaded/)
  })

  it('removes placeholder and shows image on successful load', () => {
    render(<Image {...defaultProps} />)
    const img = screen.getByAltText('Test Image')

    fireEvent.load(img)
    // After load, the image should have the loaded class
    expect(img.className).toMatch(/loaded/)
  })

  it('handles error state and switches to fallback image', () => {
    const fallback = 'https://example.com/fallback.jpg'
    render(<Image {...defaultProps} fallbackSrc={fallback} />)

    const img = screen.getByAltText('Test Image')
    fireEvent.error(img)

    expect(img).toHaveAttribute('src', fallback)
  })

  it('resets to the new src in its loading state when src changes', () => {
    const fallback = 'https://example.com/fallback.jpg'
    const { rerender } = render(
      <Image {...defaultProps} fallbackSrc={fallback} />
    )
    fireEvent.error(screen.getByAltText('Test Image'))
    fireEvent.load(screen.getByAltText('Test Image'))

    const next = 'https://example.com/next.jpg'
    rerender(<Image {...defaultProps} src={next} fallbackSrc={fallback} />)

    const img = screen.getByAltText('Test Image')
    expect(img).toHaveAttribute('src', next)
    expect(img.className).not.toMatch(/loaded/)
  })

  it('clears the error state when src changes', () => {
    const { rerender } = render(<Image {...defaultProps} />)
    fireEvent.error(screen.getByAltText('Test Image'))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    rerender(<Image {...defaultProps} src="https://example.com/next.jpg" />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('forwards undeclared native props to the <img>', () => {
    render(
      <Image {...defaultProps} id="hero" data-testid="hero-img" width={640} />
    )

    const img = screen.getByAltText('Test Image')
    expect(img).toHaveAttribute('id', 'hero')
    expect(img).toHaveAttribute('data-testid', 'hero-img')
    expect(img).toHaveAttribute('width', '640')
  })

  it('passes the native event to onLoad and to onError on every failed attempt', () => {
    const onLoad = vi.fn()
    const onError = vi.fn()
    render(
      <Image
        {...defaultProps}
        fallbackSrc="https://example.com/fallback.jpg"
        onLoad={onLoad}
        onError={onError}
      />
    )
    const img = screen.getByAltText('Test Image')

    fireEvent.error(img)
    fireEvent.error(img)
    expect(onError).toHaveBeenCalledTimes(2)
    expect(onError.mock.calls[0][0]).toHaveProperty('type', 'error')

    fireEvent.load(img)
    expect(onLoad.mock.calls[0][0]).toHaveProperty('type', 'load')
  })

  it('builds a valid blur URL when src already has a query string', () => {
    const { container } = render(
      <Image
        {...defaultProps}
        src="https://example.com/test.jpg?v=2"
        placeholder="blur"
      />
    )

    const blur = container.querySelector('img[aria-hidden="true"]')
    expect(blur).toHaveAttribute(
      'src',
      'https://example.com/test.jpg?v=2&w=10&h=10&blur=10&q=1'
    )
  })

  it('triggers preload and high priority for priority images', () => {
    render(<Image {...defaultProps} priority={true} />)

    const link = document.head.querySelector('link[rel="preload"]')
    expect(link).toHaveAttribute('href', defaultProps.src)

    const img = screen.getByAltText('Test Image')
    expect(img).toHaveAttribute('fetchpriority', 'high')
    expect(img).toHaveAttribute('loading', 'eager')
  })

  it('forwards srcSet and sizes to the preload link for priority images', () => {
    const srcSet =
      'https://example.com/test-480.jpg 480w, https://example.com/test-800.jpg 800w'
    const sizes = '(max-width: 600px) 480px, 800px'

    render(<Image {...defaultProps} priority srcSet={srcSet} sizes={sizes} />)

    const link = document.head.querySelector('link[rel="preload"]')
    expect(link).toHaveAttribute('href', defaultProps.src)
    expect(link).toHaveAttribute('imagesrcset', srcSet)
    expect(link).toHaveAttribute('imagesizes', sizes)
  })

  it('falls back to the default responsive sizes on the preload link when srcSet is set but sizes is omitted', () => {
    const srcSet =
      'https://example.com/test-480.jpg 480w, https://example.com/test-800.jpg 800w'

    render(<Image {...defaultProps} priority srcSet={srcSet} />)

    const link = document.head.querySelector('link[rel="preload"]')
    expect(link).toHaveAttribute(
      'imagesizes',
      '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
    )
  })

  it('renders a lazy, non-priority image as a native lazy <img> on first render', () => {
    render(<Image {...defaultProps} />)

    expect(screen.getByAltText('Test Image')).toHaveAttribute('loading', 'lazy')
  })

  it('applies custom aspect ratio and object fit styles', () => {
    const { container } = render(
      <Image
        {...defaultProps}
        aspectRatio="16/9"
        objectFit="contain"
        containerClassName="custom-container"
      />
    )

    const figure = container.querySelector('figure')
    expect(figure).toHaveClass('custom-container')
    const imageContainer = figure?.querySelector('div')
    expect(imageContainer?.style.aspectRatio).toBe('16/9')

    const img = screen.getByAltText('Test Image')
    expect(img.style.objectFit).toBe('contain')
  })

  it('renders a priority image with no detectable axe violations', async () => {
    const { container } = render(
      <Image {...defaultProps} priority caption="A test image caption" />
    )

    await expectNoA11yViolations(container)
  })
})
