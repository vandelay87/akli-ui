import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router-dom'

import Header from './Header'

const PUBLIC_LINKS = [
  { label: 'Recipes', to: '/recipes' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

const ADMIN_LINKS = [
  { label: 'Recipes', to: '/admin/recipes' },
  { label: 'Users', to: '/admin/users' },
]

// Header renders react-router-dom's Link/useLocation internally, so every
// story needs a router context to render at all — matches the
// renderWithRouter helper in Header.test.tsx.
const meta = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/recipes']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof Header>

export default meta

type Story = StoryObj<typeof meta>

export const Public: Story = {
  args: {
    variant: 'public',
    brand: 'akli.dev',
    links: PUBLIC_LINKS,
  },
}

export const Admin: Story = {
  args: {
    variant: 'admin',
    brand: 'akli.dev',
    links: ADMIN_LINKS,
    email: 'akliaissat@outlook.com',
    onLogout: () => {},
  },
}

export const LoggedOut: Story = {
  args: {
    variant: 'logged-out',
    brand: 'akli.dev',
  },
}
