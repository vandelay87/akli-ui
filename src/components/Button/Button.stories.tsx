import type { Meta, StoryObj } from '@storybook/react-vite'

import Button from './Button'

// Throwaway/reference story: exists to prove the Storybook pipeline (build,
// autodocs, addon-a11y, theme toggle) works end-to-end before the full
// story-writing pass covers every component. Not the final Button coverage.
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

export const DangerTone: Story = {
  args: {
    children: 'Delete',
    variant: 'outline',
    tone: 'danger',
  },
}

export const Loading: Story = {
  args: {
    children: 'Loading button',
    loading: true,
  },
}
