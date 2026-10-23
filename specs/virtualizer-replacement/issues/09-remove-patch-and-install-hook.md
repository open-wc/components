# 09: Remove the patch and the install hook

**What to build:** The table and the autocomplete no longer use `@lit-labs/virtualizer`, so the repository's patch for it and the `patch-package` install hook go away. The pinboard keeps working on the unpatched dependency until its own, later migration.

Spec: [P1, P2](../spec.md#package).

**Blocked by:** 07 (Table API: `scrollTarget` added, old virtualizer accessors removed), 08 (The 50k-option autocomplete on the new virtualizer).

**Status:** resolved

- [x] The virtualizer patch file is deleted.
- [x] The `patch-package` script hook is removed, whatever it is called by then: `postinstall`, or `prepare` if the separate install fix landed.
- [x] The `patch-package` devDependency is removed, and the lockfile is updated.
- [x] The table test's import of the lit-labs ResizeObserver error suppression is removed, and no new global suppression is added. The pinboard test keeps its own.
- [x] `@lit-labs/virtualizer` stays a runtime dependency, used only by the pinboard, and the pinboard suites pass unpatched.
- [x] A fresh `npm ci` works.
- [x] The packed package installs in a throwaway project without running any script hook.
- [x] The changeset justifies the dependency change (per CONTRIBUTING), and the Release Gate passes.

## Comments

**2026-10-12, implementation (branch `virtualizer/09-remove-patch`):**

- Built: `patches/@lit-labs+virtualizer+2.1.1.patch` is deleted (the `patches/` directory goes with it). The hook was still `postinstall: patch-package`, because the separate install fix had not landed, and it is removed. `npm uninstall patch-package` removed the devDependency and pruned 12 lockfile entries that only `patch-package` needed (`patch-package`, `@yarnpkg/lockfile`, `ci-info`, `find-yarn-workspace-root`, `fs-extra`, `json-stable-stringify`, `jsonfile`, `jsonify`, `klaw-sync`, `universalify`, and its nested `open` and `slash`). No other lockfile entry changed. `OwcTable.test-browser.js` no longer imports or calls `setupIgnoreWindowResizeObserverLoopErrors`. The pinboard test keeps its own, and nothing replaces it. Its unrelated `console.error(null)` filter stays. Changeset: `.changeset/remove-patch-package-postinstall.md`.
- Unpatched dependency: after the change, a fresh `npm ci` (1,747 packages, 12 fewer) runs no root script. `node_modules/@lit-labs/virtualizer/Virtualizer.js` is upstream's `getClippingAncestors`, without `no-clipping` or the `display: contents` skip. `@lit-labs/virtualizer` is still a runtime dependency (`^2.1.1`), imported only by `src/pinboard/OwcPinboard.js` and its test. `OwcPinboard.test-browser.js` passes on it.
- Pinboard docs smoke check (not a gate, because the deployed docs site loses the patch too): on the unpatched dependency, all 8 demos on `/data/pinboard/` render all their cards. A 3 × 1,000-card pinboard placed next to the first demo, so it has the same ancestors, covers the visible part of each column at 0, 25, 50, 90 and 100% of its height, with no blank stretch beyond the 10px card gap. There were no console errors or warnings.
- Table without the suppression: `OwcTable.test-browser.js` passed 5 of 5 runs (35 tests each), and no run logged any ResizeObserver message.
- Packed install (throwaway projects in the scratchpad, npm 11.17, which runs unreviewed dependency install scripts by default): the integration tip's tarball fails `npm install` with `sh: patch-package: command not found` (exit 127). With `--strict-allow-scripts`, it fails with `@open-wc/components@0.1.9 (postinstall: patch-package)` as the only offender. This branch's tarball has no `preinstall`, `install`, `postinstall` or `prepare` script and no `binding.gyp`. It installs with exit 0 (44 packages), with `--foreground-scripts` printing no lifecycle banner and with `--strict-allow-scripts` passing, so no package in the installed tree runs an install script.
- Release Gate: green (`npm run lint && npm run test && npm run types && npm run build`). Browser suite: 32 files, 436 tests, the same as the patched baseline in this worktree before the change. Node: 432 passed, 0 failed, 1 skipped (a pre-existing skip).
- Deviations: none.

### 2026-10-12: resolved

Merged into `feat/virtalizer` in `44c64e4`. The code review fixes for the whole spec landed afterwards in `72f3b74`.
