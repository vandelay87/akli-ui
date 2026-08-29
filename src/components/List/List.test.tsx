import { render, screen } from '@testing-library/react'
import type { CSSProperties } from 'react'
import { describe, it, expect } from 'vitest'
import { expectNoA11yViolations } from '../../../tests/setup'
import List, { ListItem } from './List'

describe('List', () => {
  it('renders its children inside an element with role list', () => {
    render(
      <List>
        <ListItem>Item one</ListItem>
      </List>
    )

    const list = screen.getByRole('list')

    expect(list).toBeInTheDocument()
    expect(screen.getByText('Item one')).toBeInTheDocument()
  })

  it('passes className through to the list element', () => {
    render(<List className="custom-list">Content</List>)

    expect(screen.getByRole('list')).toHaveClass('custom-list')
  })

  it('passes other props such as style and arbitrary attributes through to the list element', () => {
    render(
      <List
        style={{ '--grid-min-width': '200px' } as CSSProperties}
        data-testid="grid-list"
      >
        Content
      </List>
    )

    const list = screen.getByRole('list')

    expect(list).toHaveStyle('--grid-min-width: 200px')
    expect(list).toHaveAttribute('data-testid', 'grid-list')
  })

  it('keeps role="list" even if a caller passes a conflicting role prop', () => {
    render(<List role="presentation">Content</List>)

    expect(screen.getByRole('list')).toBeInTheDocument()
  })

  it('renders a list with items and no detectable axe violations', async () => {
    const { container } = render(
      <List>
        <ListItem>First item</ListItem>
        <ListItem>Second item</ListItem>
      </List>
    )

    await expectNoA11yViolations(container)
  })
})

describe('ListItem', () => {
  it('renders its children inside an element with role listitem', () => {
    render(
      <List>
        <ListItem>Item content</ListItem>
      </List>
    )

    const item = screen.getByRole('listitem')

    expect(item).toBeInTheDocument()
    expect(item).toHaveTextContent('Item content')
  })

  it('passes className through to the list item element', () => {
    render(
      <List>
        <ListItem className="custom-item">Content</ListItem>
      </List>
    )

    expect(screen.getByRole('listitem')).toHaveClass('custom-item')
  })

  it('passes other props such as arbitrary attributes through to the list item element', () => {
    render(
      <List>
        <ListItem data-testid="grid-item">Content</ListItem>
      </List>
    )

    expect(screen.getByRole('listitem')).toHaveAttribute('data-testid', 'grid-item')
  })
})
