import type { Meta, StoryObj } from '@storybook/react-vite'

import Callout from './Callout'

const meta = {
  title: 'Components/Callout',
  component: Callout,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Callout>

export default meta

type Story = StoryObj<typeof meta>

export const Tip: Story = {
  args: {
    type: 'tip',
    children: 'Use the `as` prop to render Typography as a semantic element that differs from its default.',
  },
}

export const Warning: Story = {
  args: {
    type: 'warning',
    children: 'Deleting this workspace removes all projects and cannot be undone.',
  },
}

export const Info: Story = {
  args: {
    type: 'info',
    children: 'Dark mode support was added in version 2.0 and requires the tokens.css stylesheet.',
  },
}
