// The one naming rule a compiled CSS Modules file's dist filename follows,
// shared by vite.config.ts (which applies it to name each build output) and
// check-css-tree-shaking.ts (which needs to predict a component's expected
// output path to verify against). Kept in one place because a hand-copied
// second implementation is how a future change to this rule silently drifts
// one side out of sync with the other — see CLAUDE.md's Pitfalls section for
// this exact failure mode elsewhere in this build (peerDependencies,
// standaloneCssEntryNames).
//
// Drops the `.module` infix (`Button.module.css` -> `Button.css`) — not
// cosmetic. A consumer's own Vite keys CSS Modules handling off that exact
// suffix, and for one it sets `moduleSideEffects: false` on the module it
// generates (vite/dist/node/chunks/node.js, the
// `modulesCode || inlined ? false : 'no-treeshake'` line in vite:css-post's
// transform). vite-plugin-lib-inject-css's injected import binds no names,
// so under that flag a consumer's build tree-shakes the whole module away
// and ships none of its CSS — silently, with a green build and unstyled
// components. Reproduced end-to-end in a packed-tarball scratch consumer
// before this rename, and fixed by it. Also keeps the shipped selectors'
// already-compiled hashes (`_button_88dh1_6`) intact: re-entering a
// consumer's own CSS Modules pipeline would re-hash them and break the
// pairing with `Button.module.js`.
export const stripModuleCssInfix = (name: string): string =>
  name.replace(/\.module\.css$/, '.css')
