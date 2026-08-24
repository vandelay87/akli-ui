import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import Typography from './Typography'

describe('Typography', () => {
  describe('default HTML elements', () => {
    it('renders an h1 for heading1 variant', () => {
      render(<Typography variant="heading1">Page Title</Typography>)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Page Title'
      )
    })

    it('renders an h2 for heading2 variant', () => {
      render(<Typography variant="heading2">Section Title</Typography>)

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Section Title'
      )
    })

    it('renders an h3 for heading3 variant', () => {
      render(<Typography variant="heading3">Subsection</Typography>)

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        'Subsection'
      )
    })

    it('renders an h4 for heading4 variant', () => {
      render(<Typography variant="heading4">Minor Heading</Typography>)

      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent(
        'Minor Heading'
      )
    })

    it('renders a p element for body variant', () => {
      const { container } = render(
        <Typography variant="body">Body text</Typography>
      )

      expect(container.querySelector('p')).toHaveTextContent('Body text')
    })

    it('renders a p element for bodyLarge variant', () => {
      const { container } = render(
        <Typography variant="bodyLarge">Large body text</Typography>
      )

      expect(container.querySelector('p')).toHaveTextContent('Large body text')
    })

    it('renders a span element for label variant', () => {
      const { container } = render(
        <Typography variant="label">Label text</Typography>
      )

      expect(container.querySelector('span')).toHaveTextContent('Label text')
    })

    it('renders a span element for caption variant', () => {
      const { container } = render(
        <Typography variant="caption">Caption text</Typography>
      )

      expect(container.querySelector('span')).toHaveTextContent('Caption text')
    })
  })

  describe('as prop', () => {
    it('overrides the default element with the as prop', () => {
      render(
        <Typography variant="heading2" as="h3">
          Visually h2, semantically h3
        </Typography>
      )

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        'Visually h2, semantically h3'
      )
    })

    it('renders a heading1 as a span when as="span"', () => {
      const { container } = render(
        <Typography variant="heading1" as="span">
          Styled as h1
        </Typography>
      )

      expect(container.querySelector('span')).toHaveTextContent('Styled as h1')
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('renders a body variant as a div when as="div"', () => {
      const { container } = render(
        <Typography variant="body" as="div">
          Body in a div
        </Typography>
      )

      const element = screen.getByText('Body in a div')
      expect(element.tagName).toBe('DIV')
      expect(container.querySelector('p')).not.toBeInTheDocument()
    })
  })

  describe('CSS module classes', () => {
    it('applies the heading1 class for heading1 variant', () => {
      render(<Typography variant="heading1">Title</Typography>)

      const el = screen.getByRole('heading', { level: 1 })
      expect(el.className).toContain('heading1')
    })

    it('applies the heading2 class for heading2 variant', () => {
      render(<Typography variant="heading2">Title</Typography>)

      const el = screen.getByRole('heading', { level: 2 })
      expect(el.className).toContain('heading2')
    })

    it('applies the heading3 class for heading3 variant', () => {
      render(<Typography variant="heading3">Title</Typography>)

      const el = screen.getByRole('heading', { level: 3 })
      expect(el.className).toContain('heading3')
    })

    it('applies the heading4 class for heading4 variant', () => {
      render(<Typography variant="heading4">Title</Typography>)

      const el = screen.getByRole('heading', { level: 4 })
      expect(el.className).toContain('heading4')
    })

    it('applies the body class for body variant', () => {
      render(<Typography variant="body">Text</Typography>)

      const el = screen.getByText('Text')
      expect(el.className).toContain('body')
    })

    it('applies the bodyLarge class for bodyLarge variant', () => {
      render(<Typography variant="bodyLarge">Text</Typography>)

      const el = screen.getByText('Text')
      expect(el.className).toContain('bodyLarge')
    })

    it('applies the label class for label variant', () => {
      render(<Typography variant="label">Text</Typography>)

      const el = screen.getByText('Text')
      expect(el.className).toContain('label')
    })

    it('applies the caption class for caption variant', () => {
      render(<Typography variant="caption">Text</Typography>)

      const el = screen.getByText('Text')
      expect(el.className).toContain('caption')
    })
  })

  describe('className merging', () => {
    it('merges custom className with the variant class', () => {
      render(
        <Typography variant="heading1" className="custom-class">
          Title
        </Typography>
      )

      const el = screen.getByRole('heading', { level: 1 })
      expect(el.className).toContain('heading1')
      expect(el.className).toContain('custom-class')
    })

    it('merges custom className for non-heading variants', () => {
      render(
        <Typography variant="body" className="extra">
          Text
        </Typography>
      )

      const el = screen.getByText('Text')
      expect(el.className).toContain('body')
      expect(el.className).toContain('extra')
    })
  })

  describe('children rendering', () => {
    it('renders text children', () => {
      render(<Typography variant="body">Hello world</Typography>)

      expect(screen.getByText('Hello world')).toBeInTheDocument()
    })

    it('renders nested elements as children', () => {
      render(
        <Typography variant="body">
          Text with <strong>bold</strong> content
        </Typography>
      )

      expect(screen.getByText(/Text with/)).toBeInTheDocument()
      expect(screen.getByText('bold')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('heading1 is accessible as a level 1 heading', () => {
      render(<Typography variant="heading1">Accessible H1</Typography>)

      expect(
        screen.getByRole('heading', { level: 1, name: 'Accessible H1' })
      ).toBeInTheDocument()
    })

    it('heading2 is accessible as a level 2 heading', () => {
      render(<Typography variant="heading2">Accessible H2</Typography>)

      expect(
        screen.getByRole('heading', { level: 2, name: 'Accessible H2' })
      ).toBeInTheDocument()
    })

    it('heading3 is accessible as a level 3 heading', () => {
      render(<Typography variant="heading3">Accessible H3</Typography>)

      expect(
        screen.getByRole('heading', { level: 3, name: 'Accessible H3' })
      ).toBeInTheDocument()
    })

    it('heading4 is accessible as a level 4 heading', () => {
      render(<Typography variant="heading4">Accessible H4</Typography>)

      expect(
        screen.getByRole('heading', { level: 4, name: 'Accessible H4' })
      ).toBeInTheDocument()
    })

    it('heading with as prop has the correct heading level', () => {
      render(
        <Typography variant="heading1" as="h3">
          Overridden heading
        </Typography>
      )

      expect(
        screen.getByRole('heading', { level: 3, name: 'Overridden heading' })
      ).toBeInTheDocument()
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    })

    it('body variant does not appear as a heading', () => {
      render(<Typography variant="body">Not a heading</Typography>)

      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('renders a heading1 with no detectable axe violations', async () => {
      const { container } = render(
        <Typography variant="heading1">Accessible page title</Typography>
      )

      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
