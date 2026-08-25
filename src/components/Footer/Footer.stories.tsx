import type { Meta, StoryObj } from '@storybook/react-vite'

import Footer from './Footer'

// Footer renders Link (react-router-dom's Link internally for non-external
// hrefs), so it needs a router context to render at all — provided by the
// project-wide MemoryRouter decorator in .storybook/preview.ts.
const meta = {
  title: 'Components/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
  },
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
