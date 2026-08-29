// Fails CI when a standalone MDX docs page (not attached to any .stories.tsx,
// e.g. .storybook/Accessibility.mdx) throws while rendering. @storybook/test-runner
// only generates tests from .stories.@(ts|tsx) exports, so these pages are
// structurally invisible to it (see ci.yml's comment, issue #28). This reads
// storybook-static/index.json for entries tagged `unattached-mdx` — Storybook's
// own marker for exactly this case — and, for each, drives a Playwright page
// through Storybook's public channel protocol (the same one test-runner and
// the Storybook UI use) to render it and observe a pass/fail event.

import process from 'node:process'
import { waitForPageReady } from '@storybook/test-runner'
import { chromium, type Page } from 'playwright'
import {
  DOCS_RENDERED,
  SET_CURRENT_STORY,
  STORY_ERRORED,
  STORY_MISSING,
  STORY_THREW_EXCEPTION,
} from 'storybook/internal/core-events'

interface StorybookIndexEntry {
  id: string
  title: string
  name: string
  type: string
  importPath: string
  tags: string[]
}

interface StorybookIndex {
  entries: Record<string, StorybookIndexEntry>
}

interface RenderResult {
  outcome:
    | 'docsRendered'
    | 'storyThrewException'
    | 'storyErrored'
    | 'storyMissing'
    | 'no-channel'
    | 'timeout'
  errorMessage?: string
}

const STORYBOOK_URL = process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6006'
const RENDER_TIMEOUT_MS = Number(
  process.env.MDX_DOCS_RENDER_TIMEOUT_MS ?? 15_000
)
const CHANNEL_POLL_TIMEOUT_MS = 5_000

const isUnattachedMdxDocsEntry = (entry: StorybookIndexEntry): boolean =>
  entry.type === 'docs' && entry.tags.includes('unattached-mdx')

const fetchIndex = async (): Promise<StorybookIndex> => {
  const url = new URL('index.json', STORYBOOK_URL).toString()
  let response: Response
  try {
    response = await fetch(url)
  } catch (error) {
    throw new Error(
      `Could not reach the Storybook build at ${url}. Is it built and served (\`pnpm build-storybook\` + a static server on STORYBOOK_URL)?`,
      { cause: error }
    )
  }
  if (!response.ok) {
    throw new Error(
      `Fetching ${url} failed: ${response.status} ${response.statusText}`
    )
  }
  return (await response.json()) as StorybookIndex
}

const renderDocsEntry = async (
  page: Page,
  storyId: string
): Promise<RenderResult> => {
  const iframeUrl = new URL('iframe.html', STORYBOOK_URL).toString()
  await page.goto(iframeUrl, { waitUntil: 'load' })
  await waitForPageReady(page)

  return page.evaluate(
    async ({
      storyId,
      timeoutMs,
      channelPollTimeoutMs,
      events,
    }) => {
      const channelReady = async () => {
        const start = Date.now()
        while (Date.now() - start < channelPollTimeoutMs) {
          // @ts-expect-error -- Storybook's injected preview runtime channel, not typed
          if (globalThis.__STORYBOOK_ADDONS_CHANNEL__) return true
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
        return false
      }

      if (!(await channelReady())) {
        return { outcome: 'no-channel' } as const
      }
      // @ts-expect-error -- Storybook's injected preview runtime channel, not typed
      const channel = globalThis.__STORYBOOK_ADDONS_CHANNEL__

      return new Promise<RenderResult>((resolve) => {
        let settled = false
        const listeners: Record<string, (...args: unknown[]) => void> = {}
        const cleanup = () => {
          Object.entries(listeners).forEach(([eventName, listener]) =>
            channel.off(eventName, listener)
          )
        }
        const settle = (result: RenderResult) => {
          if (settled) return
          settled = true
          cleanup()
          resolve(result)
        }

        listeners[events.docsRendered] = () =>
          settle({ outcome: 'docsRendered' })
        listeners[events.storyThrewException] = (error: unknown) => {
          const err = error as { name?: string; message?: string }
          settle({
            outcome: 'storyThrewException',
            errorMessage: `${err?.name ?? 'Error'}: ${err?.message ?? String(error)}`,
          })
        }
        listeners[events.storyErrored] = (data: unknown) => {
          const err = data as { title?: string; description?: string }
          settle({
            outcome: 'storyErrored',
            errorMessage:
              err?.description ?? err?.title ?? JSON.stringify(data),
          })
        }
        listeners[events.storyMissing] = (id: unknown) => {
          if (id === storyId) settle({ outcome: 'storyMissing' })
        }

        Object.entries(listeners).forEach(([eventName, listener]) =>
          channel.on(eventName, listener)
        )

        setTimeout(() => settle({ outcome: 'timeout' }), timeoutMs)

        channel.emit(events.setCurrentStory, { storyId, viewMode: 'docs' })
      })
    },
    {
      storyId,
      timeoutMs: RENDER_TIMEOUT_MS,
      channelPollTimeoutMs: CHANNEL_POLL_TIMEOUT_MS,
      events: {
        docsRendered: DOCS_RENDERED,
        storyThrewException: STORY_THREW_EXCEPTION,
        storyErrored: STORY_ERRORED,
        storyMissing: STORY_MISSING,
        setCurrentStory: SET_CURRENT_STORY,
      },
    }
  )
}

const main = async () => {
  const index = await fetchIndex()
  const entries = Object.values(index.entries).filter(isUnattachedMdxDocsEntry)

  if (entries.length === 0) {
    console.log(
      'check:mdx-docs: no standalone MDX docs entries found (nothing to check).'
    )
    return
  }

  console.log(
    `check:mdx-docs: checking ${entries.length} standalone MDX docs ${entries.length === 1 ? 'page' : 'pages'}: ${entries.map((e) => e.id).join(', ')}`
  )

  const browser = await chromium.launch()
  let outcomes: { entry: StorybookIndexEntry; result: RenderResult; consoleErrors: string[] }[]

  try {
    outcomes = await Promise.all(
      entries.map(async (entry) => {
        const page = await browser.newPage()
        const consoleErrors: string[] = []
        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text())
        })
        page.on('pageerror', (error) => consoleErrors.push(error.message))

        try {
          const result = await renderDocsEntry(page, entry.id)
          return { entry, result, consoleErrors }
        } finally {
          await page.close()
        }
      })
    )
  } finally {
    await browser.close()
  }

  for (const { entry, result, consoleErrors } of outcomes) {
    if (result.outcome === 'docsRendered') {
      console.log(`  ok   ${entry.id} (${entry.importPath})`)
    } else {
      console.error(
        `  FAIL ${entry.id} (${entry.importPath}) — ${result.outcome}`
      )
      if (result.errorMessage) console.error(`       ${result.errorMessage}`)
      if (consoleErrors.length > 0) {
        console.error(`       console errors during render:`)
        consoleErrors.forEach((line) => console.error(`         ${line}`))
      }
    }
  }

  const failures = outcomes
    .filter(({ result }) => result.outcome !== 'docsRendered')
    .map(({ entry }) => entry)

  if (failures.length > 0) {
    console.error(
      `\ncheck:mdx-docs: ${failures.length} of ${entries.length} standalone MDX docs page(s) failed to render:\n` +
        failures.map((entry) => `  - ${entry.id} (${entry.importPath})`).join('\n')
    )
    process.exit(1)
  }

  console.log(
    `check:mdx-docs: all ${entries.length} standalone MDX docs page(s) rendered cleanly.`
  )
}

main().catch((error) => {
  console.error('check:mdx-docs: unexpected failure')
  console.error(error)
  process.exit(1)
})
