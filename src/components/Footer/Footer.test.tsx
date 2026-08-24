import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Footer, { type FooterProps } from './Footer'

const renderFooter = (props: FooterProps = {}) =>
  render(
    <MemoryRouter>
      <Footer {...props} />
    </MemoryRouter>
  )

describe('Footer', () => {
  describe('public variant (default)', () => {
    it('renders a nav landmark accessibly named "Find me elsewhere"', () => {
      renderFooter()

      expect(screen.getByRole('navigation', { name: 'Find me elsewhere' })).toBeInTheDocument()
    })

    it('renders a list of 3 links with correct hrefs inside the nav', () => {
      renderFooter()

      const nav = screen.getByRole('navigation', { name: 'Find me elsewhere' })
      const list = within(nav).getByRole('list')
      const items = within(list).getAllByRole('listitem')

      expect(items).toHaveLength(3)
      expect(within(nav).getByRole('link', { name: 'GitHub' })).toHaveAttribute(
        'href',
        'https://github.com/vandelay87'
      )
      expect(within(nav).getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
        'href',
        'https://www.linkedin.com/in/akli-aissat-b08119115/'
      )
      expect(within(nav).getByRole('link', { name: 'Email' })).toHaveAttribute(
        'href',
        'mailto:akliaissat@outlook.com'
      )
    })

    it('renders the "akli.dev" brand text', () => {
      renderFooter()

      expect(screen.getByText('akli.dev')).toBeInTheDocument()
    })

    it('does not render admin-only text', () => {
      renderFooter()

      expect(screen.queryByText('akli.dev admin')).not.toBeInTheDocument()
      expect(screen.queryByText(/signed in as/i)).not.toBeInTheDocument()
    })
  })

  describe('admin variant', () => {
    it('renders "akli.dev admin" text', () => {
      renderFooter({ variant: 'admin' })

      expect(screen.getByText('akli.dev admin')).toBeInTheDocument()
    })

    it('renders "Signed in as {email}" when an email is passed', () => {
      renderFooter({ variant: 'admin', email: 'akliaissat@outlook.com' })

      expect(screen.getByText('Signed in as akliaissat@outlook.com')).toBeInTheDocument()
    })

    it('does not render the "Signed in as" line when no email is passed', () => {
      renderFooter({ variant: 'admin' })

      expect(screen.queryByText(/signed in as/i)).not.toBeInTheDocument()
    })

    it('does not render the public nav or its links', () => {
      renderFooter({ variant: 'admin' })

      expect(screen.queryByRole('navigation', { name: 'Find me elsewhere' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })
  })
})
