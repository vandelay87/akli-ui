// vitest-axe@0.1.0 ships its matcher types augmenting a legacy `Vi` namespace
// (`declare global { namespace Vi { interface Assertion ... } }`), which
// predates Vitest 4's typing convention of augmenting `declare module
// 'vitest'` directly (see how @testing-library/jest-dom does this in
// node_modules/@testing-library/jest-dom/types/vitest.d.ts). Without this
// bridge, `vitest-axe/extend-expect`'s augmentation is inert under Vitest 4
// and `toHaveNoViolations` doesn't type-check even though it works at
// runtime (registered via `expect.extend` in tests/setup.ts).
import type { AxeMatchers } from 'vitest-axe/matchers'

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
  interface Assertion<T = unknown> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
