import type { Decorator, Preview } from '@storybook/react-vite'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

// Runs against this package's *source*, not the published dist/ bundle —
// see README.md's "Required CSS imports" for the equivalent consumer-facing
// contract (@akli-dev/ui/fonts.css, /tokens.css, /index.css).
//
// fonts.css must load before tokens.css (order-sensitive: tokens.css's
// --font-sans references the 'Geist Fallback' face fonts.css declares —
// see README.md for the full explanation; alphabetical import/order below
// happens to preserve that). animations.css has no ordering dependency but
// is otherwise required: in the built package it's pulled in transitively
// through src/index.ts's barrel import, which nothing in Storybook's story
// graph goes through (stories import each component directly from its own
// module, not via the barrel) — components whose CSS Modules reference its
// `global(spin)`/`global(shimmer)` keyframes (e.g. Button's loading
// spinner) would otherwise silently no-op.
import '../src/styles/animations.css'
import '../src/styles/fonts.css'
import '../src/styles/tokens.css'

// Mirrors ThemeToggle.tsx / tokens.css: theme is expressed purely as
// `data-theme="light" | "dark"` on <html>, nothing else.
const withTheme: Decorator = (Story, context) => {
  document.documentElement.setAttribute('data-theme', context.globals.theme)
  return Story()
}

// Project-wide router context: Footer/Header/Link all render
// react-router-dom's Link/useLocation internally, so every story needs a
// router in scope to render at all. react-router-dom throws at runtime on a
// nested <Router> ("You cannot render a <Router> inside another <Router>"),
// so a story can't layer its own local MemoryRouter on top of this one —
// instead, a story that needs a specific "current" route (Header, whose
// aria-current="page" depends on it) sets `parameters.router.initialEntries`
// and this decorator threads it into the single MemoryRouter instance. Most
// stories (Footer, Link) don't care which route is current and just omit it.
const withRouter: Decorator = (Story, context) => {
  const initialEntries = context.parameters.router?.initialEntries as
    | string[]
    | undefined
  return createElement(
    MemoryRouter,
    initialEntries ? { initialEntries } : null,
    createElement(Story)
  )
}

const preview: Preview = {
  // Global default so every story gets a Docs page without each
  // .stories.tsx file having to repeat `tags: ['autodocs']` itself —
  // every component in this issue needs autodocs, so the global default is
  // the current-convention way to get that (Storybook 10 docs recommend a
  // project-wide `tags` export over per-story opt-in when it applies to
  // (almost) everything). An individual story can still opt out with
  // `tags: ['!autodocs']`.
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Theme (matches ThemeToggle / tokens.css [data-theme])',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [withTheme, withRouter],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // 'error' makes addon-a11y's automated axe-core checks fail the story
    // (not just flag it in the interactive UI panel). @storybook/test-runner
    // 0.24.4 reads this same parameter natively — its injected page script
    // checks `story.parameters.a11y.test === 'error'` and rejects the test
    // with the violation report when true (see
    // node_modules/@storybook/test-runner/dist/setup-page-script.js) — no
    // separate test-runner hook/config file is needed. Default is 'todo'
    // (violations only logged, never fail).
    a11y: {
      test: 'error',
    },
  },
}

export default preview
