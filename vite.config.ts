import { defineConfig } from 'vitest/config'

// Minimal placeholder library build so `pnpm build` succeeds today. This is
// intentionally not the real package architecture (exports map, CSS
// Modules, vite-plugin-dts, build.target tuning) — that's settled by the
// milestone-1 spike in issue #3, which is blocked on this scaffold landing
// first.
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
  },
  test: {
    environment: 'jsdom',
  },
})
