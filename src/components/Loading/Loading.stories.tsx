import type { Meta, StoryObj } from '@storybook/react-vite'

import Loading from './Loading'

const meta = {
  title: 'Components/Loading',
  component: Loading,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Loading>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CustomLabel: Story = {
  args: {
    label: 'Fetching recipes…',
  },
}
