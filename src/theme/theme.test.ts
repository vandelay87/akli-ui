import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMatchMedia } from '../../tests/setup'
import { getInitialTheme, saveTheme, themeBootstrapScript } from './theme'

type Scenario = {
  name: string
  attribute?: string
  savedTheme?: string
  systemDark?: boolean
  storageThrows?: boolean
  expected: 'light' | 'dark'
}

const scenarios: Scenario[] = [
  {
    name: 'keeps a data-theme already on <html> over a conflicting saved theme',
    attribute: 'light',
    savedTheme: 'dark',
    systemDark: true,
    expected: 'light',
  },
  {
    name: 'uses the saved theme over the system theme',
    savedTheme: 'dark',
    systemDark: false,
    expected: 'dark',
  },
  {
    name: 'ignores a saved value that is not a theme and falls through to the system theme',
    savedTheme: 'sepia',
    systemDark: true,
    expected: 'dark',
  },
  {
    name: 'uses a dark system theme when nothing is saved',
    systemDark: true,
    expected: 'dark',
  },
  {
    name: 'uses a light system theme when nothing is saved',
    systemDark: false,
    expected: 'light',
  },
  {
    name: 'falls back to light when storage throws',
    systemDark: true,
    storageThrows: true,
    expected: 'light',
  },
]

const arrange = (scenario: Scenario) => {
  if (scenario.attribute) {
    document.documentElement.setAttribute('data-theme', scenario.attribute)
  }
  if (scenario.savedTheme) {
    localStorage.setItem('theme', scenario.savedTheme)
  }
  mockMatchMedia(scenario.systemDark ?? false)
  if (scenario.storageThrows) {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
  }
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getInitialTheme', () => {
  it.each(scenarios)('$name', (scenario) => {
    arrange(scenario)

    expect(getInitialTheme()).toBe(scenario.expected)
  })
})

describe('themeBootstrapScript', () => {
  it.each(scenarios)('$name', (scenario) => {
    arrange(scenario)

    new Function(themeBootstrapScript)()

    expect(document.documentElement.getAttribute('data-theme')).toBe(
      scenario.expected
    )
  })
})

describe('saveTheme', () => {
  it('applies the theme to <html> and saves it under the "theme" key', () => {
    saveTheme('dark')

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('still applies the theme when storage throws, without throwing itself', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })

    expect(() => saveTheme('dark')).not.toThrow()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
