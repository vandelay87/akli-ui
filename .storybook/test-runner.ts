import type { TestRunnerConfig } from '@storybook/test-runner'

// Forces a theme global before each story's a11y check, driven by
// STORYBOOK_A11Y_THEME so CI can gate multiple themes off one build (see
// ci.yml). A `--url ?globals=...` flag doesn't work — test-runner rebuilds
// each story's URL from scratch, dropping any query-string globals — so the
// theme is applied by emitting Storybook's own 'updateGlobals' channel event
// (the same event the toolbar switcher uses). Re-emitting before every story
// raced with test-runner's per-story navigation, so it's applied once per
// page via an in-page flag.
const preVisit: TestRunnerConfig['preVisit'] = async (page) => {
  const theme = process.env.STORYBOOK_A11Y_THEME
  if (!theme) return

  await page.evaluate((theme) => {
    // @ts-expect-error -- ad hoc guard on the page's global scope, not typed
    if (globalThis.__a11yThemeSet) return
    // @ts-expect-error -- ad hoc guard on the page's global scope, not typed
    globalThis.__a11yThemeSet = true
    // @ts-expect-error -- Storybook's injected preview runtime channel, not typed
    globalThis.__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', { globals: { theme } })
  }, theme)
}

const config: TestRunnerConfig = { preVisit }

export default config
