import type { Meta, StoryObj } from '@storybook/react-vite'

import Image from './Image'
import placeholder from './placeholder.png'

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
    src: placeholder,
    alt: 'Overhead shot of a sheet-pan dinner with roasted vegetables',
    aspectRatio: '16 / 10',
    maxWidth: '32rem',
  },
}

export const Priority: Story = {
  args: {
    ...Default.args,
    src: placeholder,
    alt: 'Hero photo of a plated braised short rib',
    priority: true,
  },
}

export const WithCaption: Story = {
  args: {
    ...Default.args,
    src: placeholder,
    alt: 'Charred broccolini with chili crunch on a ceramic plate',
    caption: 'Charred broccolini with chili crunch, plated for four.',
  },
}

export const BlurPlaceholder: Story = {
  args: {
    ...Default.args,
    src: placeholder,
    alt: 'Miso brown butter cookies cooling on a wire rack',
    placeholder: 'blur',
  },
}

export const BrokenImage: Story = {
  args: {
    ...Default.args,
    // Same-origin path that genuinely doesn't exist — fails fast and
    // locally (no DNS round trip against a domain required to not
    // resolve), while still exercising Image's real error-state UI.
    src: '/this-file-does-not-exist.jpg',
    alt: 'An image that fails to load',
  },
}
