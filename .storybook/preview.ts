import type { Decorator, Preview } from '@storybook/react-vite'

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
  decorators: [withTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
