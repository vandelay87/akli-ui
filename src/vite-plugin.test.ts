import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build, createServer, type Plugin, type Rolldown } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { themeBootstrapScript } from './theme/themeBootstrap'
import { bootstrapTheme, preloadFonts } from './vite-plugin'

const indexHtml = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="data:text/css," />
    <title>Consumer</title>
  </head>
  <body></body>
</html>`

const buildIndexHtml = async (
  root: string,
  plugins: Plugin[]
): Promise<string> => {
  const output = (await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins,
    build: { write: false, assetsInlineLimit: 0 },
  })) as Rolldown.RolldownOutput

  const html = output.output.find(
    (file): file is Rolldown.OutputAsset => file.fileName === 'index.html'
  )

  return String(html?.source)
}

const expectThemeBootstrapFirstInHead = (html: string): void => {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const scripts = [...document.head.querySelectorAll('script')].filter(
    (script) => !script.src
  )

  expect(scripts).toHaveLength(1)
  expect(document.head.firstElementChild).toBe(scripts[0])
  expect(scripts[0].textContent).toBe(themeBootstrapScript)
}

describe('bootstrapTheme()', () => {
  let root: string

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'akli-ui-bootstrap-theme-'))
    await writeFile(join(root, 'index.html'), indexHtml)
  })

  afterAll(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('injects the theme bootstrap first in <head> during vite build', async () => {
    expectThemeBootstrapFirstInHead(
      await buildIndexHtml(root, [bootstrapTheme()])
    )
  })

  it('stays first in <head> when preloadFonts() is listed after it', async () => {
    const fontRoot = await mkdtemp(join(tmpdir(), 'akli-ui-bootstrap-theme-'))

    try {
      await writeFile(join(fontRoot, 'geist-sans-latin-variable.woff2'), 'font')
      await writeFile(
        join(fontRoot, 'fonts.css'),
        "@font-face { font-family: 'Geist'; src: url('./geist-sans-latin-variable.woff2') format('woff2'); }"
      )
      await writeFile(
        join(fontRoot, 'index.html'),
        indexHtml.replace('data:text/css,', './fonts.css')
      )

      const html = await buildIndexHtml(fontRoot, [
        bootstrapTheme(),
        preloadFonts(),
      ])

      expect(html).toContain('rel="preload"')
      expectThemeBootstrapFirstInHead(html)
    } finally {
      await rm(fontRoot, { recursive: true, force: true })
    }
  })

  it('injects the theme bootstrap first in <head> during vite dev', async () => {
    const server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      server: { middlewareMode: true },
      plugins: [bootstrapTheme()],
    })

    try {
      expectThemeBootstrapFirstInHead(
        await server.transformIndexHtml('/', indexHtml)
      )
    } finally {
      await server.close()
    }
  })
})

describe('vite-plugin entry', () => {
  it('imports nothing from the component barrel or any component', async () => {
    const [output] = (await build({
      configFile: 'vite.config.ts',
      logLevel: 'silent',
      build: { write: false },
    })) as Rolldown.RolldownOutput[]

    const chunks = new Map(
      output.output
        .filter((file): file is Rolldown.OutputChunk => file.type === 'chunk')
        .map((chunk) => [chunk.fileName, chunk])
    )
    const reachable = new Set<string>()
    const visit = (fileName: string): void => {
      if (reachable.has(fileName)) return
      reachable.add(fileName)
      chunks.get(fileName)?.imports.forEach(visit)
    }
    visit('vite-plugin.js')

    expect(chunks.has('vite-plugin.js')).toBe(true)
    expect(
      [...reachable].filter(
        (name) => name === 'index.js' || name.startsWith('components/')
      )
    ).toEqual([])
  })
})
