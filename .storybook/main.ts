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
  // Storybook's own favicon/manifest icon set — deliberately *not* the
  // root-level public/ directory that vite.config.ts's default `publicDir`
  // already copies into dist/ on `pnpm build` (see dist/assets/*-OFL.txt):
  // putting Storybook-only assets there would ship them inside the
  // published @akli-dev/ui npm package too. .storybook/public/ is a
  // second, Storybook-specific static directory that only this build
  // knows about. Resolved relative to configDir (.storybook/ itself, same
  // base the `stories` globs above resolve against) — confirmed by reading
  // the installed Storybook source (mapStaticDir/getDirectoryFromWorkingDir
  // in storybook/dist/_node-chunks/chunk-QEFGZ2NZ.js and chunk-OKMX43Z2.js),
  // not assumed from docs. A bare `'./public'` entry (no explicit `:to`
  // target) maps the directory's contents to the site root in both dev and
  // `build-storybook`'s storybook-static/ output (parseStaticDir defaults
  // `to` to `/` for a directory arg) — so .storybook/public/favicon/*.png
  // lands at storybook-static/favicon/*.png and
  // .storybook/public/site.webmanifest lands at storybook-static/
  // site.webmanifest, matching the paths manager-head.html links to below
  // and the paths already hardcoded inside site.webmanifest's own icons
  // array.
  staticDirs: ['./public'],
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
  // out below). Exact match, not a substring/case-insensitive check:
  // unplugin-dts registers exactly one Vite plugin under the stable,
  // hardcoded literal name 'unplugin-dts' (verified in
  // node_modules/unplugin-dts/dist/shared/unplugin-dts.*.mjs) — a looser
  // match would also silently swallow any unrelated future plugin whose
  // name happens to contain "dts".
  viteFinal: async (config) => {
    config.plugins = config.plugins?.filter((plugin) => {
      if (!plugin || !('name' in plugin)) return true
      return plugin.name !== 'unplugin-dts'
    })
    return config
  },
}

export default config
