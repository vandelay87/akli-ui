import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Input from './Input'

describe('Input', () => {
  it('renders a textbox with the given value and placeholder', () => {
    render(<Input value="hello" placeholder="Type here" onChange={vi.fn()} />)

    const input = screen.getByPlaceholderText('Type here')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('hello')
  })

  it('fires onChange when the user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Input value="" placeholder="Type here" onChange={onChange} />)

    await user.type(screen.getByPlaceholderText('Type here'), 'a')

    expect(onChange).toHaveBeenCalled()
  })

  it('sets aria-invalid="true" when invalid is true', () => {
    render(<Input value="" ariaLabel="Email" invalid onChange={vi.fn()} />)

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'aria-invalid',
      'true'
    )
  })

  it('does not set aria-invalid when invalid is false or omitted', () => {
    render(<Input value="" ariaLabel="Email" onChange={vi.fn()} />)

    expect(screen.getByRole('textbox', { name: 'Email' })).not.toHaveAttribute('aria-invalid')
  })

  it('disables the input when disabled is passed', () => {
    render(<Input value="" ariaLabel="Email" disabled onChange={vi.fn()} />)

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled()
  })

  it('renders a prefixIcon when passed', () => {
    render(
      <Input value="" ariaLabel="Search" prefixIcon={<span>search-icon</span>} onChange={vi.fn()} />
    )

    expect(screen.getByText('search-icon')).toBeInTheDocument()
  })

  it('renders a suffix when passed', () => {
    render(<Input value="" ariaLabel="Search" suffix={<button>Clear</button>} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  })

  it('produces the expected accessible name via ariaLabel', () => {
    render(<Input value="" ariaLabel="Email address" onChange={vi.fn()} />)

    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
  })

  it('produces the expected accessible description via ariaDescribedBy', () => {
    render(
      <>
        <Input value="" ariaLabel="Email" ariaDescribedBy="email-hint" onChange={vi.fn()} />
        <span id="email-hint">We will never share your email</span>
      </>
    )

    expect(
      screen.getByRole('textbox', { description: 'We will never share your email' })
    ).toBeInTheDocument()
  })

  it('associates a label via id when a <label htmlFor> is used', () => {
    render(
      <>
        <label htmlFor="username">Username</label>
        <Input id="username" value="" onChange={vi.fn()} />
      </>
    )

    expect(screen.getByLabelText('Username')).toBeInTheDocument()
  })
})
