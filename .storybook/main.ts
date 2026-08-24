import type { StorybookConfig } from '@storybook/react-vite'

// Story files live co-located with their component, matching this repo's
// existing Component.tsx / Component.test.tsx / Component.module.css
// convention: src/components/<Name>/<Name>.stories.tsx.
const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.@(ts|tsx)'],
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
