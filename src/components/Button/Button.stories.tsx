import type { Meta, StoryObj } from '@storybook/react-vite'

import { IconPlus } from '../icons'
import Button from './Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Solid: Story = {
  args: {
    children: 'Solid button',
    variant: 'solid',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline button',
    variant: 'outline',
  },
}

export const Danger: Story = {
  name: 'Variant: danger',
  args: {
    children: 'Delete account',
    variant: 'danger',
  },
}

export const DangerTone: Story = {
  name: 'Outline + tone="danger"',
  args: {
    children: 'Discard draft',
    variant: 'outline',
    tone: 'danger',
  },
}

export const Pill: Story = {
  name: 'Shape: pill',
  args: {
    children: 'Get started',
    shape: 'pill',
  },
}

export const Small: Story = {
  name: 'Size: sm',
  args: {
    children: 'Small button',
    size: 'sm',
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled button',
    disabled: true,
  },
}

export const FullWidth: Story = {
  args: {
    children: 'Full-width button',
    fullWidth: true,
  },
}

export const WithIconLeft: Story = {
  args: {
    children: 'Add item',
    iconLeft: <IconPlus size={16} />,
  },
}

export const WithIconRight: Story = {
  args: {
    children: 'Add item',
    iconRight: <IconPlus size={16} />,
  },
}

export const Loading: Story = {
  args: {
    children: 'Loading button',
    loading: true,
  },
}

export const IconOnly: Story = {
  name: 'Icon-only (with ariaLabel)',
  // Per the Accessibility.mdx contract for Button: an icon-only Button
  // passes the icon as `children` (not iconLeft/iconRight, which are for
  // icons alongside separate visible text) and supplies `ariaLabel`, since
  // the exported icon glyphs are themselves aria-hidden and contribute no
  // accessible name on their own.
  args: {
    children: <IconPlus size={16} />,
    ariaLabel: 'Add item',
  },
}
