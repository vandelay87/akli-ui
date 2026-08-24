import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Callout from './Callout'

describe('Callout', () => {
  it('renders tip variant with content text', () => {
    render(<Callout type="tip">Use caching for better performance.</Callout>)

    expect(screen.getByText('Use caching for better performance.')).toBeInTheDocument()
  })

  it('renders warning variant with content text', () => {
    render(<Callout type="warning">This action is irreversible.</Callout>)

    expect(screen.getByText('This action is irreversible.')).toBeInTheDocument()
  })

  it('renders info variant with content text', () => {
    render(<Callout type="info">Available since version 2.0.</Callout>)

    expect(screen.getByText('Available since version 2.0.')).toBeInTheDocument()
  })

  it('each variant has a distinct visual indicator', () => {
    const { rerender } = render(
      <Callout type="tip">Tip content</Callout>
    )
    const tipElement = screen.getByRole('note')
    const tipHTML = tipElement.innerHTML

    rerender(<Callout type="warning">Warning content</Callout>)
    const warningElement = screen.getByRole('note')
    const warningHTML = warningElement.innerHTML

    rerender(<Callout type="info">Info content</Callout>)
    const infoElement = screen.getByRole('note')
    const infoHTML = infoElement.innerHTML

    // Each variant should produce different visual indicators (icons or labels)
    // We extract the non-text portion to verify they differ
    const tipIndicator = tipHTML.replace('Tip content', '')
    const warningIndicator = warningHTML.replace('Warning content', '')
    const infoIndicator = infoHTML.replace('Info content', '')

    expect(tipIndicator).not.toBe(warningIndicator)
    expect(warningIndicator).not.toBe(infoIndicator)
    expect(tipIndicator).not.toBe(infoIndicator)
  })

  it('has appropriate aria role', () => {
    render(<Callout type="tip">Accessible callout.</Callout>)

    expect(screen.getByRole('note')).toBeInTheDocument()
  })
})
