import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { expectNoA11yViolations } from '../../../tests/setup'
import Grid from './Grid'

describe('Grid', () => {
  it('renders as a semantic list', () => {
    render(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    )

    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
  })

  it('applies the correct column class (4 columns)', () => {
    render(
      <Grid columns={4}>
        <div>Item</div>
      </Grid>
    )

    const list = screen.getByRole('list')
    expect(list.className).toContain('cols4')
  })

  it('renders correctly with a single child', () => {
    render(
      <Grid>
        <div>Only Child</div>
      </Grid>
    )

    const item = screen.getByRole('listitem')
    expect(item).toHaveTextContent('Only Child')
  })

  it('applies the auto-fit class and no fixed column class when minWidth is set', () => {
    render(
      <Grid minWidth="md">
        <div>Item</div>
      </Grid>
    )

    const list = screen.getByRole('list')
    expect(list.className).toContain('autoFit')
    expect(list.className).not.toContain('cols1')
    expect(list.className).not.toContain('cols2')
    expect(list.className).not.toContain('cols3')
    expect(list.className).not.toContain('cols4')
  })

  it('sets the --grid-min-width custom property from minWidth', () => {
    render(
      <Grid minWidth="md">
        <div>Item</div>
      </Grid>
    )

    const list = screen.getByRole('list')
    expect(list.style.getPropertyValue('--grid-min-width')).toBe(
      'var(--grid-min-md)'
    )
  })

  it('maps minWidth="sm" to the sm CSS custom property', () => {
    render(
      <Grid minWidth="sm">
        <div>Item</div>
      </Grid>
    )

    const list = screen.getByRole('list')
    expect(list.style.getPropertyValue('--grid-min-width')).toBe(
      'var(--grid-min-sm)'
    )
  })

  it('lets minWidth override an explicit columns prop entirely', () => {
    render(
      <Grid minWidth="md" columns={4}>
        <div>Item</div>
      </Grid>
    )

    const list = screen.getByRole('list')
    expect(list.className).toContain('autoFit')
    expect(list.className).not.toContain('cols4')
  })

  it('does not apply the auto-fit class when minWidth is omitted (regression guard)', () => {
    render(
      <Grid>
        <div>Item</div>
      </Grid>
    )

    const list = screen.getByRole('list')
    expect(list.className).not.toContain('autoFit')
    expect(list.className).toContain('cols3')
  })

  it('merges a passed className onto the list alongside its own classes', () => {
    render(
      <Grid className="custom-spacing">
        <div>Item</div>
      </Grid>
    )

    const list = screen.getByRole('list')
    expect(list.className).toContain('custom-spacing')
    expect(list.className).toContain('grid')
    expect(list.className).toContain('cols3')
  })

  it('renders a multi-item grid with no detectable axe violations', async () => {
    const { container } = render(
      <Grid columns={3}>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </Grid>
    )

    await expectNoA11yViolations(container)
  })
})
