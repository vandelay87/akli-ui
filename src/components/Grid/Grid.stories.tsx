import type { Meta, StoryObj } from '@storybook/react-vite'

import Card from '../Card/Card'
import Typography from '../Typography/Typography'
import Grid from './Grid'

const sampleCards = [
  { title: 'Recipes', body: '128 published' },
  { title: 'Collections', body: '12 folders' },
  { title: 'Drafts', body: '4 in progress' },
  { title: 'Archived', body: '31 items' },
]

// Grid only applies its `display: grid` column layout per-item when it
// receives an actual array of children (see Grid.tsx's `Array.isArray`
// branch) — a single wrapping element (e.g. a fragment-returning
// component) would collapse to one ListItem instead of one per card.
const gridItems = (count: number) =>
  sampleCards.slice(0, count).map((item) => (
    <Card key={item.title} fill>
      <Typography variant="heading4">{item.title}</Typography>
      <Typography variant="body">{item.body}</Typography>
    </Card>
  ))

const meta = {
  title: 'Components/Grid',
  component: Grid,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Grid>

export default meta

type Story = StoryObj<typeof meta>

export const OneColumn: Story = {
  args: {
    columns: 1,
    children: gridItems(3),
  },
}

export const TwoColumns: Story = {
  args: {
    columns: 2,
    children: gridItems(4),
  },
}

export const ThreeColumns: Story = {
  name: 'Three columns (default)',
  args: {
    columns: 3,
    children: gridItems(4),
  },
}

export const FourColumns: Story = {
  args: {
    columns: 4,
    children: gridItems(4),
  },
}

export const AutoFitMinWidth: Story = {
  name: 'Auto-fit (minWidth)',
  args: {
    minWidth: 'md',
    children: gridItems(4),
  },
}

export const SingleChild: Story = {
  args: {
    columns: 3,
    children: <Card fill>Only one item — Grid falls back to a single ListItem.</Card>,
  },
}
