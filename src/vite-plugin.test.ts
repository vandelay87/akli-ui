import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build, createServer, type Rolldown } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { themeBootstrapScript } from './theme/themeBootstrap'
import { bootstrapTheme } from './vite-plugin'

const indexHtml = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="data:text/css," />
    <title>Consumer</title>
  </head>
  <body></body>
</html>`

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
    const output = (await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [bootstrapTheme()],
      build: { write: false },
    })) as Rolldown.RolldownOutput

    const html = output.output.find(
      (file): file is Rolldown.OutputAsset => file.fileName === 'index.html'
    )

    expectThemeBootstrapFirstInHead(String(html?.source))
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
