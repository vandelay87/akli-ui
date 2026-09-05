// Fails CI when the per-component CSS tree-shaking this package's build is
// built around (vite.config.ts's rollupOptions.output.preserveModules +
// vite-plugin-lib-inject-css, see docs/prds/css-tree-shaking.md, issues #48/#49)
// silently regresses. Nothing else measures CSS output: check:bundle-size
// covers JS only, and the failure modes here are all green-build ones — a
// dropped preserveModules collapses every component's styles back into one
// eagerly-loaded dist/index.css, and a `composes:` reintroduced against
// src/styles/interactions.module.css duplicates 2.7 kB of shared rules into
// each of the six components that compose it. Both ship a working build.
//
// Two layers, deliberately in one script behind one `pnpm check:css-tree-shaking`
// entry: they assert the same two properties (no cross-component leakage,
// exactly one copy of shared CSS) at two different levels, and neither is
// meaningful without the other. The structural layer inspects this package's
// own dist/, which is fast but can't see how a real bundler resolves what it
// finds there; the scratch-consumer layer npm-packs dist/ into a tarball,
// installs it fresh into an ephemeral directory and builds a minimal Vite app
// against it, which is the only thing that would catch a hashed-path mismatch
// in libInjectCss's injected imports or a `files`/`exports`/`sideEffects`
// misconfiguration (issue #12's precedent). Pass --skip-consumer to run the
// fast layer alone locally; CI runs both.
//
// Ownership of a compiled selector is derived, never hardcoded: Vite compiles
// CSS Modules class names to `_<local>_<hash>_<line>`, where <hash> is stable
// per source file rather than per build, so each component's own hash is read
// back out of its own compiled CSS and cross-checked against the class names
// its source .module.css actually declares. Byte-counting can't work here —
// no component's CSS is ever empty, since animations.css and interactions.css
// are legitimately shared.

import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import pkg from '../package.json' with { type: 'json' }

const repoRoot = path.resolve(import.meta.dirname, '..')
const distDir = path.join(repoRoot, 'dist')
const srcComponentsDir = path.join(repoRoot, 'src', 'components')
const interactionsDistCss = path.join(distDir, 'styles', 'interactions.css')
const indexDistCss = path.join(distDir, 'index.css')

// The one class in interactions.module.css composed by the most components
// (Button, Header ×2, ThemeToggle, Link, and — as .fieldFocusRing — Input).
// If it ever renames, the count assertion below reports 0 rather than passing.
const SHARED_INTERACTIONS_CLASS = 'focusRing'

// Peer dependencies the scratch consumer needs installed for its own build to
// resolve the barrel's full import graph, plus the bundler it builds with —
// derived from package.json's own peerDependencies (same reasoning as
// vite.config.ts's rollupOptions.external: a hand-copied list is how a future
// peer dependency silently drifts out of sync, per CLAUDE.md's Pitfalls).
// Versions are read from this repo's own node_modules so a CI run and a local
// run install exactly the same tree.
const CONSUMER_DEPENDENCIES = Object.keys(pkg.peerDependencies)

const scopedClassPattern = /_([A-Za-z0-9-]+)_([a-z0-9]{4,8})_\d+/g

interface CssFileAnalysis {
  file: string
  source: string
  /** hash -> the distinct CSS Modules local names compiled under it */
  localsByHash: Map<string, Set<string>>
}

interface ComponentAnalysis {
  name: string
  distCssFile: string
  ownHash: string
}

const failures: string[] = []
const fail = (message: string) => {
  failures.push(message)
  console.error(`  FAIL ${message}`)
}
const pass = (message: string) => console.log(`  ok   ${message}`)

const relative = (file: string) => path.relative(repoRoot, file)

const listFilesRecursively = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))

const analyzeCssFile = (file: string): CssFileAnalysis => {
  const source = readFileSync(file, 'utf8')
  const localsByHash = new Map<string, Set<string>>()
  for (const [, local, hash] of source.matchAll(scopedClassPattern)) {
    const locals = localsByHash.get(hash) ?? new Set<string>()
    locals.add(local)
    localsByHash.set(hash, locals)
  }
  return { file, source, localsByHash }
}

const declaredClassNames = (cssSource: string): Set<string> =>
  new Set(
    [...cssSource.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map(([, name]) => name)
  )

/**
 * The hash a CSS file's own source module compiled to, as opposed to one it
 * inlined from a file it `composes:` from. A component's own hash can only
 * carry class names its own source .module.css declares, so of the hashes
 * present, this takes the widest one satisfying that — width alone isn't
 * enough, since an inlined 277-line interactions.module.css outnumbers the
 * component's own classes.
 */
const resolveOwnHash = (
  analysis: CssFileAnalysis,
  sourceCssFile: string
): string | undefined => {
  const declared = declaredClassNames(readFileSync(sourceCssFile, 'utf8'))
  const ownHash = [...analysis.localsByHash.entries()]
    .sort(([, a], [, b]) => b.size - a.size)
    .find(([, locals]) =>
      [...locals].every((local) => declared.has(local))
    )?.[0]

  if (!ownHash) {
    fail(
      `no hash in ${relative(analysis.file)} compiles the class names ${relative(sourceCssFile)} declares (found ${[...analysis.localsByHash.keys()].join(', ') || 'no compiled class names at all'}) — that file's own rules are not where they should be`
    )
  }
  return ownHash
}

const checkStructure = (
  cssAnalyses: CssFileAnalysis[],
  components: ComponentAnalysis[]
) => {
  const filesByHash = new Map<string, string[]>()
  for (const { file, localsByHash } of cssAnalyses) {
    for (const hash of localsByHash.keys()) {
      filesByHash.set(hash, [...(filesByHash.get(hash) ?? []), file])
    }
  }

  for (const { name, distCssFile, ownHash } of components) {
    const elsewhere = (filesByHash.get(ownHash) ?? []).filter(
      (file) => file !== distCssFile
    )
    if (elsewhere.length > 0) {
      fail(
        `${name}'s own rules (hash ${ownHash}) leaked into ${elsewhere.map(relative).join(', ')} — they belong only in ${relative(distCssFile)}`
      )
    } else {
      pass(
        `${name} — own rules confined to ${relative(distCssFile)} (hash ${ownHash})`
      )
    }
  }

  // Any hash present in two dist CSS files is duplicated shared CSS — the
  // interactions.module.css failure mode in its general form, which also
  // covers formField.module.css should it ever gain a second consumer.
  for (const [hash, files] of filesByHash) {
    if (files.length > 1) {
      fail(
        `compiled rules for hash ${hash} are duplicated across ${files.length} dist CSS files (${files.map(relative).join(', ')}) — shared CSS must be emitted once and imported, not inlined per consumer`
      )
    }
  }
}

const checkInteractionsDedup = (analysesByFile: Map<string, CssFileAnalysis>) => {
  const interactions = analysesByFile.get(interactionsDistCss)
  if (!interactions) {
    fail(
      `${relative(interactionsDistCss)} does not exist — shared interaction styles are no longer emitted as their own file, so every composing component is carrying its own copy`
    )
    return
  }

  const sharedHash = [...interactions.localsByHash.entries()].find(
    ([, locals]) => locals.has(SHARED_INTERACTIONS_CLASS)
  )?.[0]
  if (!sharedHash) {
    fail(
      `${relative(interactionsDistCss)} does not define .${SHARED_INTERACTIONS_CLASS} — if that class was renamed, update SHARED_INTERACTIONS_CLASS in this script`
    )
    return
  }

  const token = new RegExp(
    `_${SHARED_INTERACTIONS_CLASS}_${sharedHash}_\\d+`,
    'g'
  )
  const occurrences = [...analysesByFile.values()].flatMap(
    ({ file, source }) => {
      const count = [...source.matchAll(token)].length
      return count > 0 ? [{ file, count }] : []
    }
  )
  const total = occurrences.reduce((sum, { count }) => sum + count, 0)

  if (total !== 1) {
    fail(
      `.${SHARED_INTERACTIONS_CLASS} (shared by six components via src/styles/interactions.module.css) is defined ${total} times across dist/, expected exactly 1: ${occurrences.map(({ file, count }) => `${relative(file)} ×${count}`).join(', ') || '(nowhere)'}`
    )
  } else {
    pass(
      `shared interaction styles deduped — .${SHARED_INTERACTIONS_CLASS} defined once, in ${relative(occurrences[0].file)}`
    )
  }
}

const checkGlobalEntryCss = (analysesByFile: Map<string, CssFileAnalysis>) => {
  const index = analysesByFile.get(indexDistCss)
  if (!index) {
    fail(
      `${relative(indexDistCss)} does not exist — package.json exports ./index.css, so a v1 consumer that kept the import would 404`
    )
    return
  }
  if (index.localsByHash.size > 0) {
    fail(
      `${relative(indexDistCss)} contains per-component CSS Modules rules (hashes ${[...index.localsByHash.keys()].join(', ')}) — it must hold only animations.css's global keyframes, or every consumer is back to loading the whole library's styles`
    )
    return
  }
  if (!index.source.includes('@keyframes')) {
    fail(
      `${relative(indexDistCss)} contains no @keyframes — animations.css's shared keyframes are missing from the entry stylesheet`
    )
    return
  }
  pass(`${relative(indexDistCss)} holds global keyframes only`)
}

const checkInjectedCssImports = (components: ComponentAnalysis[]) => {
  for (const { name, distCssFile } of components) {
    const moduleJs = path.join(path.dirname(distCssFile), `${name}.module.js`)
    if (!existsSync(moduleJs)) {
      fail(`${relative(moduleJs)} does not exist`)
      continue
    }
    const expected = `./${path.basename(distCssFile)}`
    if (!readFileSync(moduleJs, 'utf8').includes(`'${expected}'`)) {
      fail(
        `${relative(moduleJs)} has no injected \`import '${expected}'\` — vite-plugin-lib-inject-css emitted nothing for it, so a consumer importing ${name} gets no styles`
      )
      continue
    }
    pass(`${relative(moduleJs)} imports its own ${expected}`)
  }
}

const installedVersion = (dependency: string): string =>
  JSON.parse(
    readFileSync(
      path.join(repoRoot, 'node_modules', dependency, 'package.json'),
      'utf8'
    )
  ).version

const writeConsumerEntry = (appDir: string, imports: string[]) =>
  writeFileSync(
    path.join(appDir, 'src', 'main.js'),
    [
      `import { createElement } from 'react'`,
      `import { createRoot } from 'react-dom/client'`,
      `import { ${imports.join(', ')} } from '@akli-dev/ui'`,
      ``,
      `createRoot(document.getElementById('root')).render(`,
      `  createElement('div', null, ${imports.map((name) => `createElement(${name}, null)`).join(', ')})`,
      `)`,
      ``,
    ].join('\n')
  )

const buildConsumer = (appDir: string, outDir: string): CssFileAnalysis[] => {
  execFileSync(
    process.execPath,
    [
      path.join(appDir, 'node_modules', 'vite', 'bin', 'vite.js'),
      'build',
      '--outDir',
      outDir,
      '--logLevel',
      'warn',
    ],
    { cwd: appDir, stdio: 'inherit' }
  )
  const assetsDir = path.join(appDir, outDir, 'assets')
  return listFilesRecursively(assetsDir)
    .filter((file) => file.endsWith('.css'))
    .map(analyzeCssFile)
}

const checkScratchConsumer = (components: ComponentAnalysis[]) => {
  const scratchRoot = mkdtempSync(path.join(tmpdir(), 'akli-ui-css-gate-'))
  try {
    execFileSync(
      'npm',
      ['pack', '--pack-destination', scratchRoot, '--loglevel', 'error'],
      { cwd: repoRoot, stdio: ['ignore', 'ignore', 'inherit'] }
    )
    const tarball = readdirSync(scratchRoot).find((file) =>
      file.endsWith('.tgz')
    )
    if (!tarball) {
      fail('npm pack produced no tarball')
      return
    }

    const appDir = path.join(scratchRoot, 'consumer')
    mkdirSync(path.join(appDir, 'src'), { recursive: true })
    writeFileSync(
      path.join(appDir, 'package.json'),
      `${JSON.stringify({ name: 'akli-ui-css-tree-shaking-consumer', private: true, type: 'module', version: '0.0.0' }, null, 2)}\n`
    )
    writeFileSync(
      path.join(appDir, 'index.html'),
      '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.js"></script></body></html>\n'
    )
    // Unminified so the assertions below read the same compiled class names
    // the structural layer does, rather than whatever a minifier renames.
    writeFileSync(
      path.join(appDir, 'vite.config.js'),
      'export default { build: { minify: false } }\n'
    )
    writeConsumerEntry(appDir, ['Button'])

    console.log(
      `  ...  installing ${tarball} into a scratch consumer (${appDir})`
    )
    execFileSync(
      'npm',
      [
        'install',
        '--no-audit',
        '--no-fund',
        '--loglevel',
        'error',
        path.join(scratchRoot, tarball),
        ...CONSUMER_DEPENDENCIES.map(
          (name) => `${name}@${installedVersion(name)}`
        ),
      ],
      { cwd: appDir, stdio: ['ignore', 'ignore', 'inherit'] }
    )

    const buttonHash = components.find(
      (component) => component.name === 'Button'
    )?.ownHash
    if (!buttonHash) {
      fail('no compiled hash resolved for Button — cannot check the consumer')
      return
    }

    const singleCss = buildConsumer(appDir, 'dist-button')
    const singleHashes = new Set(
      singleCss.flatMap((analysis) => [...analysis.localsByHash.keys()])
    )
    if (!singleHashes.has(buttonHash)) {
      fail(
        `a consumer importing only { Button } shipped none of Button's own rules (hash ${buttonHash}) — its CSS was tree-shaken away entirely`
      )
    } else {
      pass(`consumer importing { Button } ships Button's own rules`)
    }

    const leaked = components.filter(
      (component) =>
        component.name !== 'Button' && singleHashes.has(component.ownHash)
    )
    if (leaked.length > 0) {
      fail(
        `a consumer importing only { Button } also shipped CSS for ${leaked.map((component) => `${component.name} (hash ${component.ownHash})`).join(', ')}`
      )
    } else {
      pass(
        `consumer importing { Button } ships zero rules from the other ${components.length - 1} components`
      )
    }

    const countSharedRule = (cssFiles: CssFileAnalysis[]) =>
      cssFiles.reduce(
        (sum, { source }) =>
          sum +
          [
            ...source.matchAll(
              new RegExp(
                `_${SHARED_INTERACTIONS_CLASS}_[a-z0-9]{4,8}_\\d+`,
                'g'
              )
            ),
          ].length,
        0
      )
    const assertSharedRuleDeduped = (
      imports: string[],
      cssFiles: CssFileAnalysis[]
    ) => {
      const count = countSharedRule(cssFiles)
      if (count !== 1) {
        fail(
          `a consumer importing { ${imports.join(', ')} } shipped ${count} copies of interactions.module.css's .${SHARED_INTERACTIONS_CLASS} rule, expected exactly 1`
        )
        return
      }
      pass(
        `consumer importing { ${imports.join(', ')} } ships exactly one copy of .${SHARED_INTERACTIONS_CLASS}`
      )
    }

    assertSharedRuleDeduped(['Button'], singleCss)

    // Three independent composers of interactions.module.css at once — the
    // case that would ship three copies if the shared file stopped being its
    // own chunk.
    const sharedImports = ['Button', 'Header', 'Link']
    writeConsumerEntry(appDir, sharedImports)
    assertSharedRuleDeduped(sharedImports, buildConsumer(appDir, 'dist-shared'))
  } finally {
    rmSync(scratchRoot, { recursive: true, force: true })
  }
}

const main = () => {
  if (!existsSync(distDir)) {
    console.error(
      'check:css-tree-shaking: dist/ does not exist — run `pnpm build` first.'
    )
    process.exit(1)
  }

  const cssAnalyses = listFilesRecursively(distDir)
    .filter((file) => file.endsWith('.css'))
    .map(analyzeCssFile)
  const analysesByFile = new Map(
    cssAnalyses.map((analysis) => [analysis.file, analysis])
  )

  const components = readdirSync(srcComponentsDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(
          path.join(srcComponentsDir, entry.name, `${entry.name}.module.css`)
        )
    )
    .flatMap<ComponentAnalysis>(({ name }) => {
      const distCssFile = path.join(distDir, 'components', name, `${name}.css`)
      const analysis = analysesByFile.get(distCssFile)
      if (!analysis) {
        fail(
          `${relative(distCssFile)} does not exist — ${name}'s styles were folded into another output file instead of shipping alongside its own module`
        )
        return []
      }
      const ownHash = resolveOwnHash(
        analysis,
        path.join(srcComponentsDir, name, `${name}.module.css`)
      )
      return ownHash ? [{ name, distCssFile, ownHash }] : []
    })

  console.log(
    `check:css-tree-shaking: inspecting ${cssAnalyses.length} dist CSS files across ${components.length} components`
  )
  checkInjectedCssImports(components)
  checkStructure(cssAnalyses, components)
  checkInteractionsDedup(analysesByFile)
  checkGlobalEntryCss(analysesByFile)

  // With no component's own CSS resolved there is nothing for the consumer
  // layer to assert against, and it would spend a full npm install saying so.
  if (components.length > 0 && !process.argv.includes('--skip-consumer')) {
    console.log(
      'check:css-tree-shaking: verifying the same properties from a real consumer build'
    )
    checkScratchConsumer(components)
  }

  if (failures.length > 0) {
    console.error(
      `\ncheck:css-tree-shaking: ${failures.length} CSS tree-shaking assertion(s) failed:\n` +
        failures.map((message) => `  - ${message}`).join('\n')
    )
    process.exit(1)
  }

  console.log('check:css-tree-shaking: all assertions passed.')
}

try {
  main()
} catch (error) {
  console.error('check:css-tree-shaking: unexpected failure')
  console.error(error)
  process.exit(1)
}
