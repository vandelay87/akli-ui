import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { expectNoA11yViolations } from '../../../tests/setup'
import Loading from './Loading'

describe('Loading', () => {
  it('renders the spinner with correct role and aria attributes', () => {
    render(<Loading />)

    const spinner = screen.getByRole('status', { name: /loading/i })

    expect(spinner).toBeInTheDocument()
    expect(spinner.tagName).toBe('SPAN')
  })

  it('accepts a custom label', () => {
    render(<Loading label="Loading recipes…" />)

    expect(screen.getByRole('status', { name: /loading recipes/i })).toBeInTheDocument()
  })

  it('renders the spinner with no detectable axe violations', async () => {
    const { container } = render(<Loading />)

    await expectNoA11yViolations(container)
  })
})
