import type { Meta, StoryObj } from '@storybook/react-vite'

import Typography from '../Typography/Typography'
import Card from './Card'

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <>
        <Typography variant="heading4">Storage usage</Typography>
        <Typography variant="body">You&rsquo;ve used 12.4 GB of your 20 GB plan.</Typography>
      </>
    ),
  },
}

export const Fill: Story = {
  args: {
    fill: true,
    children: (
      <>
        <Typography variant="heading4">Team members</Typography>
        <Typography variant="body">8 people have access to this workspace.</Typography>
      </>
    ),
  },
}

export const Hover: Story = {
  args: {
    hover: true,
    children: (
      <>
        <Typography variant="heading4">Recent activity</Typography>
        <Typography variant="body">Hover to see the subtle surface wash used for hoverable, non-clickable cards.</Typography>
      </>
    ),
  },
}

export const AsButton: Story = {
  name: 'Clickable (renders as button)',
  args: {
    hover: true,
    // Card only renders as a semantic <button> when onClick is set — see
    // Card.tsx's `Component = as ?? (onClick ? 'button' : 'div')`.
    onClick: () => {},
    children: (
      <>
        <Typography variant="heading4">Upgrade to Pro</Typography>
        <Typography variant="body">Unlock unlimited projects and priority support.</Typography>
      </>
    ),
  },
}

export const CustomPadding: Story = {
  args: {
    padding: 'var(--space-3)',
    radius: 'var(--radius-md)',
    children: <Typography variant="caption">Compact card with custom padding and radius.</Typography>,
  },
}
