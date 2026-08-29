import { describe, expect, it } from 'vitest'

describe('index', () => {
  it('loads the package entry point without throwing', async () => {
    await expect(import('./index')).resolves.toBeDefined()
  })
})
