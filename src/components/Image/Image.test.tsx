import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
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

  it('triggers preload and high priority for priority images', () => {
    render(<Image {...defaultProps} priority={true} />)

    const link = document.head.querySelector('link[rel="preload"]')
    expect(link).toHaveAttribute('href', defaultProps.src)

    const img = screen.getByAltText('Test Image')
    expect(img).toHaveAttribute('fetchpriority', 'high')
    expect(img).toHaveAttribute('loading', 'eager')
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
})
