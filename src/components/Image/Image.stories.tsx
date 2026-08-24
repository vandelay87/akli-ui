import type { Meta, StoryObj } from '@storybook/react-vite'

import Image from './Image'

const meta = {
  title: 'Components/Image',
  component: Image,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    onLoad: { action: 'load' },
    onError: { action: 'error' },
  },
} satisfies Meta<typeof Image>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    src: 'https://picsum.photos/seed/akli-ui-default/800/500',
    alt: 'Overhead shot of a sheet-pan dinner with roasted vegetables',
    aspectRatio: '16 / 10',
    maxWidth: '32rem',
  },
}

export const Priority: Story = {
  args: {
    ...Default.args,
    src: 'https://picsum.photos/seed/akli-ui-priority/800/500',
    alt: 'Hero photo of a plated braised short rib',
    priority: true,
  },
}

export const WithCaption: Story = {
  args: {
    ...Default.args,
    src: 'https://picsum.photos/seed/akli-ui-caption/800/500',
    alt: 'Charred broccolini with chili crunch on a ceramic plate',
    caption: 'Charred broccolini with chili crunch, plated for four.',
  },
}

export const BlurPlaceholder: Story = {
  args: {
    ...Default.args,
    src: 'https://picsum.photos/seed/akli-ui-blur/800/500',
    alt: 'Miso brown butter cookies cooling on a wire rack',
    placeholder: 'blur',
  },
}

export const BrokenImage: Story = {
  args: {
    ...Default.args,
    src: 'https://example.invalid/does-not-exist.jpg',
    alt: 'An image that fails to load',
  },
}
