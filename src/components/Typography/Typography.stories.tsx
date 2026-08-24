import type { Meta, StoryObj } from '@storybook/react-vite'

import Typography from './Typography'

const meta = {
  title: 'Components/Typography',
  component: Typography,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Typography>

export default meta

type Story = StoryObj<typeof meta>

export const Heading1: Story = {
  args: {
    variant: 'heading1',
    children: 'Build interfaces that scale',
  },
}

export const Heading2: Story = {
  args: {
    variant: 'heading2',
    children: 'A design system for product teams',
  },
}

export const Heading3: Story = {
  args: {
    variant: 'heading3',
    children: 'Components, tokens, and patterns',
  },
}

export const Heading4: Story = {
  args: {
    variant: 'heading4',
    children: 'Getting started',
  },
}

export const Body: Story = {
  args: {
    variant: 'body',
    children:
      'This component renders as a <p> by default and inherits the base text color and line height from the design tokens.',
  },
}

export const BodyLarge: Story = {
  args: {
    variant: 'bodyLarge',
    children:
      'Use bodyLarge for lead paragraphs or intro copy that needs more visual weight than standard body text.',
  },
}

export const Label: Story = {
  args: {
    variant: 'label',
    children: 'Email address',
  },
}

export const Caption: Story = {
  args: {
    variant: 'caption',
    children: 'Last updated 3 days ago',
  },
}

export const CustomElement: Story = {
  name: 'Custom element (as prop)',
  args: {
    variant: 'heading2',
    as: 'div',
    children: 'Styled like heading2, rendered as a <div>',
  },
}
