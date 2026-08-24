import type { StorybookConfig } from '@storybook/react-vite'

// Story files live co-located with their component, matching this repo's
// existing Component.tsx / Component.test.tsx / Component.module.css
// convention: src/components/<Name>/<Name>.stories.tsx.
//
// Accessibility.mdx is a standalone (not component-attached) docs page —
// it isn't about one component, so it doesn't belong co-located under
// src/components/. It lives in .storybook/ instead, alongside this file,
// to make clear it's Storybook-only documentation rather than package
// source (unlike src/, .storybook/ is never part of the published
// dist/ — see package.json's "files" and vite.config.ts's explicit
// build.lib entry map, neither of which glob .storybook/ or pick up
// .mdx files). The first glob below only matches *.stories.@(ts|tsx),
// so it wouldn't pick this file up on its own — hence the second entry.
const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.@(ts|tsx)', '../.storybook/*.mdx'],
  addons: [
    // Controls, actions, viewport, backgrounds, and the interactions
    // debugger all now ship in Storybook 10's `storybook` core package
    // itself (see node_modules/storybook/README.md) — there is no
    // separate `@storybook/addon-essentials` for this version. Only docs
    // and a11y remain opt-in addons.
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // No manual alias config here (@components/@hooks) and no `viteFinal`
  // importing vite.config.ts: @storybook/builder-vite already auto-loads
  // and merges this package's own root vite.config.ts (via Vite's
  // `loadConfigFromFile`, called internally by builder-vite's
  // `commonConfig()` — see node_modules/@storybook/builder-vite/dist/
  // index.js) before applying this file's config on top. That merge
  // brings in vite.config.ts's `resolve.alias` for free — verified by
  // reading builder-vite's source, and confirmed live: `Header`/`Footer`/
  // `Image`/`Grid` (which import via `@components`/`@hooks`) render fine
  // in the a11y/Docs panels without any alias config in this file.
  //
  // The same auto-merge also pulls in vite.config.ts's `dts()` plugin
  // (unplugin-dts) — appropriate for `vite build`'s dist/ output, useless
  // for Storybook's own build (it was emitting a stray declaration-file
  // tree into storybook-static/ until this `viteFinal` filtered it back
  // out below).
  viteFinal: async (config) => {
    config.plugins = config.plugins?.filter((plugin) => {
      if (!plugin || !('name' in plugin)) return true
      return !plugin.name.toLowerCase().includes('dts')
    })
    return config
  },
}

export default config
