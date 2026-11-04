import { render } from '@testing-library/react'
import { Fragment, isValidElement, type FC, type ReactElement } from 'react'
import { describe, it, expect } from 'vitest'
import { expectNoA11yViolations } from '../../../tests/setup'
import * as pkg from '../../index'
import * as icons from '.'
import { IconAlertCircle, type SizedIconProps } from '.'

const entries = Object.entries(icons)
const glyphs = entries.filter((entry): entry is [string, ReactElement] =>
  isValidElement(entry[1])
)
const sizedIcons = entries.filter(
  (entry): entry is [string, FC<SizedIconProps>] =>
    typeof entry[1] === 'function'
)

describe('Glyphs', () => {
  it.each(glyphs)(
    '%s renders a decorative currentColor svg on a 24-unit viewBox',
    (_, glyph) => {
      const { container } = render(glyph)
      const svg = container.querySelector('svg')

      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
      expect(svg).toHaveAttribute('stroke', 'currentColor')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    }
  )
})

describe('Sized icons', () => {
  it.each(sizedIcons)('%s sets width and height from size', (_, Icon) => {
    const { container } = render(<Icon size={20} />)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('width', '20')
    expect(svg).toHaveAttribute('height', '20')
  })

  it('IconAlertCircle adds aria-hidden when ariaHidden is set', () => {
    const { container } = render(<IconAlertCircle size={16} ariaHidden />)

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })

  it('IconAlertCircle leaves aria-hidden off when ariaHidden is omitted', () => {
    const { container } = render(<IconAlertCircle size={16} />)

    expect(container.querySelector('svg')).not.toHaveAttribute('aria-hidden')
  })
})

describe('icons barrel', () => {
  it('exports only Glyphs and Sized icons, so every icon is covered above', () => {
    expect(glyphs.length + sizedIcons.length).toBe(entries.length)
  })

  it.each(entries.map(([name]) => name))(
    '%s is exported from the package root',
    (name) => {
      expect(pkg[name as keyof typeof pkg]).toBe(
        icons[name as keyof typeof icons]
      )
    }
  )

  it('has no accessibility violations across every icon', async () => {
    const { container } = render(
      <>
        {glyphs.map(([name, glyph]) => (
          <Fragment key={name}>{glyph}</Fragment>
        ))}
        {sizedIcons.map(([name, Icon]) => (
          <Icon key={name} size={16} />
        ))}
      </>
    )

    await expectNoA11yViolations(container)
  })
})
