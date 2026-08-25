import type { Meta, StoryObj } from '@storybook/react-vite'

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
// story needs a router context to render at all — provided by the
// project-wide MemoryRouter decorator in .storybook/preview.ts. Unlike
// Footer/Link, Header sets aria-current="page" off the active route, so its
// stories need a specific initialEntries rather than the decorator's
// no-particular-route default — passed via `parameters.router` (see
// .storybook/preview.ts's withRouter decorator), not a second local
// MemoryRouter (react-router-dom throws on nested <Router>s).
const meta = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/recipes'],
    },
  },
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
