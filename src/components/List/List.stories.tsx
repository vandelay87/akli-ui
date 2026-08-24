import type { Meta, StoryObj } from '@storybook/react-vite'

import List, { ListItem } from './List'

const meta = {
  title: 'Components/List',
  component: List,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof List>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <List {...args}>
      <ListItem>Braised short rib ragu</ListItem>
      <ListItem>Charred broccolini with chili crunch</ListItem>
      <ListItem>Miso brown butter cookies</ListItem>
    </List>
  ),
}
