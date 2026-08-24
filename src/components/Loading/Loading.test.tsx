import { render, screen } from '@testing-library/react'
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
})
