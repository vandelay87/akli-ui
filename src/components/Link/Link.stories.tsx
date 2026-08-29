import type { Meta, StoryObj } from '@storybook/react-vite'

import { iconArrowLeft, iconArrowRight, iconViewPublic } from '../icons'
import Link from './Link'

// Link renders a react-router-dom <RouterLink> for internal `to` values, so
// every story needs a router context, provided by the project-wide
// MemoryRouter decorator in .storybook/preview.ts (mirrors Link.test.tsx's
// own rendering setup).
const meta = {
  title: 'Components/Link',
  component: Link,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Link>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    to: '/pricing',
    children: 'View pricing',
  },
}

export const Underline: Story = {
  args: {
    to: '/docs',
    children: 'Read the documentation',
    underline: true,
  },
}

export const MutedTone: Story = {
  args: {
    to: '/settings',
    children: 'Account settings',
    tone: 'muted',
  },
}

export const AccentTone: Story = {
  args: {
    to: '/upgrade',
    children: 'Upgrade your plan',
    tone: 'accent',
  },
}

export const External: Story = {
  args: {
    to: 'https://github.com',
    children: 'View source on GitHub',
  },
}

export const WithIcon: Story = {
  args: {
    to: '/changelog',
    children: 'See what changed',
    icon: iconViewPublic,
    nudge: 'up-right',
  },
}

export const IconLeft: Story = {
  args: {
    to: '/archive',
    children: 'Back to archive',
    icon: iconArrowLeft,
    iconSide: 'left',
    nudge: 'left',
  },
}

export const GhostButton: Story = {
  name: 'Variant: ghost',
  args: {
    to: '/apps',
    children: 'Browse apps',
    variant: 'ghost',
  },
}

export const SolidButton: Story = {
  name: 'Variant: solid',
  args: {
    to: '/get-started',
    children: 'Get started',
    variant: 'solid',
    icon: iconArrowRight,
  },
}
