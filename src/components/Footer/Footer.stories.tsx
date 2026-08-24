import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'

import Footer from './Footer'

// Footer renders Link (react-router-dom's Link internally for non-external
// hrefs), so it needs a router context to render at all.
const meta = {
  title: 'Components/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof Footer>

export default meta

type Story = StoryObj<typeof meta>

export const Public: Story = {
  args: {
    variant: 'public',
  },
}

export const Admin: Story = {
  args: {
    variant: 'admin',
    email: 'akliaissat@outlook.com',
  },
}
