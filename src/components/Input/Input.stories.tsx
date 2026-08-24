import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { iconNotFound, iconRemove } from '../icons'
import Input, { InputProps } from './Input'

// Input is a controlled component (`value` + `onChange`), so every story
// renders through this wrapper to keep typing interactive in the Storybook
// canvas instead of a static, read-only field.
const ControlledInput = ({ value, onChange, ...rest }: InputProps) => {
  const [inputValue, setInputValue] = useState(value ?? '')

  return (
    <Input
      {...rest}
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value)
        onChange?.(e)
      }}
    />
  )
}

const meta = {
  title: 'Components/Input',
  component: Input,
  render: (args) => <ControlledInput {...args} />,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onChange: { action: 'changed' },
  },
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'you@example.com',
    ariaLabel: 'Email address',
  },
}

export const WithValue: Story = {
  args: {
    value: 'ada@example.com',
    ariaLabel: 'Email address',
  },
}

export const Invalid: Story = {
  args: {
    value: 'not-an-email',
    invalid: true,
    ariaLabel: 'Email address',
    ariaDescribedBy: 'email-error',
  },
}

export const Disabled: Story = {
  args: {
    value: 'ada@example.com',
    disabled: true,
    ariaLabel: 'Email address',
  },
}

export const WithPrefixIcon: Story = {
  args: {
    placeholder: 'Search recipes…',
    prefixIcon: iconNotFound,
    ariaLabel: 'Search',
  },
}

export const WithSuffix: Story = {
  name: 'With suffix (clear button)',
  args: {
    value: 'chocolate cake',
    ariaLabel: 'Search',
    suffix: (
      <button type="button" aria-label="Clear search">
        {iconRemove}
      </button>
    ),
  },
}

export const Password: Story = {
  args: {
    type: 'password',
    value: 'hunter2',
    ariaLabel: 'Password',
    autoComplete: 'current-password',
  },
}
