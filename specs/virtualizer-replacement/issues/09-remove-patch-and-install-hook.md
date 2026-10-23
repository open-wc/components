# 09: Remove the patch and the install hook

**What to build:** The table and the autocomplete no longer use `@lit-labs/virtualizer`, so the repository's patch for it and the `patch-package` install hook go away. The pinboard keeps working on the unpatched dependency until its own, later migration.

Spec: [P1, P2](../spec.md#package).

**Blocked by:** 07 (Table API: `scrollTarget` added, old virtualizer accessors removed), 08 (The 50k-option autocomplete on the new virtualizer).

**Status:** ready-for-agent

- [ ] The virtualizer patch file is deleted.
- [ ] The `patch-package` script hook is removed, whatever it is called by then: `postinstall`, or `prepare` if the separate install fix landed.
- [ ] The `patch-package` devDependency is removed, and the lockfile is updated.
- [ ] The table test's import of the lit-labs ResizeObserver error suppression is removed, and no new global suppression is added. The pinboard test keeps its own.
- [ ] `@lit-labs/virtualizer` stays a runtime dependency, used only by the pinboard, and the pinboard suites pass unpatched.
- [ ] A fresh `npm ci` works.
- [ ] The packed package installs in a throwaway project without running any script hook.
- [ ] The changeset justifies the dependency change (per CONTRIBUTING), and the Release Gate passes.
