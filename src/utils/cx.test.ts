import { describe, expect, it } from 'vitest'

import { cx } from './cx'

describe('cx', () => {
  it('joins multiple truthy string arguments with a single space', () => {
    expect(cx('base', 'modifier', 'extra')).toBe('base modifier extra')
  })

  it('drops false values, as produced by the `condition && \'class\'` pattern', () => {
    expect(cx('base', false)).toBe('base')
  })

  it('drops undefined values, as produced by an optional className prop', () => {
    expect(cx('base', undefined)).toBe('base')
  })

  it('drops null values', () => {
    expect(cx('base', null)).toBe('base')
  })

  it('drops empty-string arguments, as used by Image.tsx\'s className props that default to \'\'', () => {
    expect(cx('base', '')).toBe('base')
  })

  it('returns an empty string when called with no arguments', () => {
    expect(cx()).toBe('')
  })

  it('returns an empty string when every argument is falsy', () => {
    expect(cx(false, null, undefined, '')).toBe('')
  })

  it('joins only the truthy classes in a realistic conditional call, preserving order', () => {
    const condition = true
    expect(cx('base', condition && 'modifier', undefined)).toBe('base modifier')
  })
})
