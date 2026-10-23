# 07: Table API: `scrollTarget` added, old virtualizer accessors removed

**What to build:** Consumers can name the table's scroll container explicitly through a documented `scrollTarget` property. The accessors that handed out `@lit-labs/virtualizer` internals are removed: `virtualizer`, `virtualizerHost` and `resetVirtualizer()`.

Spec: [T5](../spec.md#table).

**Blocked by:** 05 (Grouped tables virtualize as one list).

**Status:** resolved

- [x] `scrollTarget` (an element) overrides the automatic detection; leaving it unset keeps detection on. It is typed and documented in the table's API docs.
- [x] Browser tests cover an explicit scroll target, including one inside a shadow root.
- [x] `virtualizer`, `virtualizerHost` and `resetVirtualizer()` are gone from runtime, types and docs, and the table no longer imports `@lit-labs/virtualizer`.
- [x] The table README and docs page describe virtualization as it now works:
  - the modes and the threshold;
  - scroll-container detection and `scrollTarget`;
  - `visibleData`.
- [x] The changeset has migration notes for the removed accessors, and the Release Gate passes.

## Comments

### 2026-10-12: implementation (branch `virtualizer/07-scroll-target`)

**Built**

- `owc-table` has a `scrollTarget` property (`attribute: false`, typed `Element | null | undefined`, also in `OwcTableOptions`). `update()` passes it to the controller's `scrollContainer` setter whenever it changes, with `null` as `undefined`. A target bound in the first render is stored before the controller first attaches, and a later one re-attaches at once. Unset, `undefined` or `null` means detection.
- `virtualizer`, `virtualizerHost` and `resetVirtualizer()` are removed, with the `virtualizerRef` import, so `OwcTable.js` no longer imports `@lit-labs/virtualizer`. The window-resize path (`#scheduleColumnWidths(true)`) calls the controller's `remeasure()` directly; its flag is now `#remeasureRowsAfterSizing`.
- Tests: three browser tests in `OwcTable.virtualization.test-browser.js` (`owc-table scrollTarget`). They scroll from a task of their own and check coverage right after the scroll event's update, before any frame, so the IntersectionObserver safety net can't hide a missing scroll listener.
  - A scroll box inside a closed shadow root, with `.scrollTarget` bound before the first render. Detection can't see it, because `assignedSlot` is `null` for a closed root.
  - A light-DOM box that clips (`overflow: hidden`) and is scrolled by script, with `scrollTarget` set after the first render. Detection skips it.
  - Clearing `scrollTarget`, with `undefined` and with `null`, turns detection back on.

  Both target tests fail when the property isn't passed on, and the clearing test fails when only truthy values are passed on.
- Type test: `src/public-surface.test.type.ts` assigns `querySelector()`'s `Element | null` and `undefined` to `scrollTarget`, and expects type errors for the three removed members.
- `OwcTable.test-browser.js`: the test that shrinks below the threshold measures `.table-body` instead of `virtualizerHost`.
- Docs:
  - `OwcTable.rocket.md`: Large Tables has Virtualizer Modes, Scroll Container and Visible Data subsections. A new Large Tables API table holds `virtualizer-mode`, moved out of the Styling API, and `scrollTarget`. The Data API describes `visibleData`.
  - `src/table/README.md`: a Large tables section.
  - `src/virtualizer/README.md`: the explicit-container note and the table host entry.
- Changeset `table-scroll-target.md`, with migration notes for the removed accessors. The bullets about `table.virtualizer` and `resetVirtualizer()` in 01's and 05's changesets are gone, since this release removes both. So is 01's stale "Grouped tables keep the previous virtualizer for now.", which contradicted 05's changeset.

**Deviations**

- `scrollTarget` also accepts `null`, which is what `querySelector` returns, and treats it like `undefined`. The spec only says "an Element".
- No live docs demo for `scrollTarget`: the cases that need it (a closed shadow root, a script-scrolled `overflow: hidden` box) would be contrived on the docs page, so the section has a snippet.
- The table's test file still imports the lit-labs ResizeObserver error suppression, because removing it is a box of 09. Without it, `OwcTable.test-browser.js` passed 3 of 3 runs.
- The window-resize path keeps its remeasure after column sizing, only renamed. 04 rewrites that path.

**Unchecked:** none.

**Release Gate:** lint, types and build pass. Browser tests: 32 files, 436 passed. Node tests: 432 passed, 1 skipped.

### 2026-10-12: resolved

Merged into `feat/virtalizer` in `d4bbf5b`. The code review fixes for the whole spec landed afterwards in `72f3b74`.
