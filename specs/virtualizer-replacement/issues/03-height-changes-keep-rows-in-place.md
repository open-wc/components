# 03: Height changes keep the visible rows in place

**What to build:** In a big virtualized table, rows that change height push the rows below them correctly. That includes:

- a detail opening or closing, including detail content that arrives asynchronously;
- annotations;
- cells with multi-line content.

When rows above the visible area turn out taller or shorter than estimated, what the user is looking at doesn't move. The scrollbar may stay approximate until irregular rows have been seen.

Spec: [V4 (open-detail estimate), V5, T6](../spec.md#requirements).

**Blocked by:** 01 (Tracer bullet: a 100k-row table that never stays white).

**Status:** resolved

- [x] Opening or closing a detail repositions the rows after it, and async detail content is measured when it arrives (T6).
- [x] A row with an open detail is estimated with the typical detail height added (V4).
- [x] When rows above the visible area change height, the visible rows stay where they are on screen (V5). That covers both rows measuring differently than estimated and a detail opening or closing in a row above.
- [x] Scrolling up through rows with annotations and multi-line cells doesn't jump, and the last row stays reachable.
- [x] The anchoring approach is chosen (the browser's native scroll anchoring or manual compensation) and recorded in the virtualizer README.
- [x] `detail` mode still renders closed detail content for every rendered row, so Ctrl+F finds it. `detailDeferred` is unchanged. Open details stay open when their rows leave the rendered range and come back.
- [x] The benchmark demo gets toggles for `detail` / `detailDeferred` and for annotations. The results are re-recorded under `## Comments`.
- [x] Browser tests cover the above, a changeset is added, and the Release Gate passes.

## Comments

### 2026-10-12: implementation (branch `virtualizer/03-height-anchoring`)

**Built**

- **Anchoring (V5):** the browser's scroll anchoring, plus a correction in the controller for what it misses. Whenever the controller looks at the layout (every check, and a `ResizeObserver` callback that also watches the top spacer and runs after layout, before paint), it remembers the first visible item and its distance from the top of the list. If the scroll offset is unchanged since then but that distance changed, the browser didn't compensate, and the controller scrolls by the difference before the paint. It never undoes a scroll, and leaves changes above the list to the browser. Spacers get `overflow-anchor: none` (table, autocomplete, README host contract). The decision and the Chromium behavior behind it are in `src/virtualizer/README.md` → Decisions.
- **Open-detail estimate (V4):** the controller takes an `expanded(item, index)` predicate (option and setter) and an `estimateExpansion` fallback. `ItemSizes` estimates unmeasured expanded items at the typical size plus the typical expansion: the median measured expanded item minus the typical size, kept out of the typical-size median, with a third Fenwick tree for the unmeasured expanded items. Measurements are cached per state, so a detail closing or reopening outside the rendered range brings back the right size. The table passes `#openDetailPredicate()`, which covers rows with an open detail in `detail`, `detailDeferred` and `linkWithDetail` modes and excludes insert rows and 05's group headers, plus a 200px fallback.
- **Tests:** `src/table/OwcTable.rowHeights.test-browser.js`, 8 tests:
  - a detail opening or closing moves the rows after it;
  - async detail content is measured;
  - visible rows stay put when a rendered detail above closes, and when a far-above, unrendered row's detail opens or closes;
  - scrolling up through annotations and three-line cells moves the rows by exactly the scrolled distance, and the last row stays reachable;
  - `detail` renders closed content for every rendered row; `detailDeferred` renders it only after opening and keeps it;
  - open details survive leaving and re-entering the range;
  - the open-detail estimate.

  Controller tests (8 new): items taller than estimated while scrolling up; a new estimate after jumps, in all four containers; an item above changing height; changes above the list left to the browser; expanded estimates. 3 node tests cover the expansion math. Each anchoring test fails with both the browser's anchoring (`overflow-anchor: none` on the box) and the correction disabled. The post-jump tests also fail with only the correction disabled.
- **Demo:** a Details select (None, `detail`, `detailDeferred`) and an Annotations checkbox (about 1% of rows: a score below 1) in both benchmarks. The scripted run counts jumps (frames in which the rows moved by more or less than the scrolled distance) and has a new phase that scrolls up from the end through unmeasured rows. The toggles, including 05's grouping toggle, sit in a row of their own (see below). The docs get a Row Heights and Details section next to 07's sections, and the table README says the same.
- **Changeset:** `.changeset/table-rows-stay-in-place.md`.
- **Merge:** `#openDetailPredicate()` answers `false` for 05's `GroupHeader` items before it calls `getRowId` (05's "covers the visible area of a virtualized grouped table with an open detail" fails without it).

**Deviations**

- Anchoring is a hybrid, neither purely native nor purely manual. Native alone keeps a stale anchor after jumps: Chromium picks its anchor from the old layout, where only a spacer or the list was visible, and keeps it until the next scroll. Measured: a new estimate after a jump up moved the visible rows by 117,180px. Manual alone would need `overflow-anchor: none` on a scroll container that isn't ours (often the document), and would fight flings and smooth scrolls.
- The typical detail height is learned from measured rows rather than given; until one is measured, the table assumes 200px.
- The benchmark demo has no multi-line cells; the spec asks for annotations and details, and the browser test covers multi-line cells.
- The table tests are in a new file instead of `OwcTable.virtualization.test-browser.js`, to stay out of the way of 05 and 06, which extended that file at the same time.
- The benchmark toggles moved into a row of their own. With a loaded table, the controls row is as wide as the table and doesn't wrap, so extra controls pushed "Monitor manual scrolling" past the right edge of a 1280px window, where the docs page clips it.

**Unchecked:** none.

**Measurements.** Headless Chromium (Playwright 1.62), production docs build, 1280×900 viewport, page layout unless noted. These are the demo's own instruments, as in 01. Other implementers' tests and benchmarks ran on the same machine during most runs, so I compared builds A/B at the same time rather than against 01's numbers.

Final state (this branch merged with the tip at 78667a8, after 04), 1x CPU, on a quiet machine (the sort itself took 84 to 89ms, as in 01):

| Target (spec: Acceptance → Manual)                                         | Plain rows                                   | `detail` + annotations             |
| -------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------- |
| No white while scrolling (wheel, trackpad, keyboard)                       | 0 frames with gaps, of about 2,550           | 0, of about 2,250                  |
| Rows moving more or less than scrolled (scripted scrolls and flings)       | 0 frames, including scrolling up from the end | 0                                 |
| At most one blank frame per scrollbar jump or fling                        | 1 per jump, never 2 in a row; flings 0       | 9 of 10 jumps, never 2 in a row    |
| No task over 50ms while scrolling                                          | 0, except End/Home: 1 task of 61ms           | 0                                  |
| First rows within 200ms of setting the data                                | 103ms                                        | 130ms                              |
| Re-render within 100ms after a sort or filter, without the sort or filter  | 85 to 98ms                                   | 89 to 102ms                        |

- **No regression from the anchoring changes:** an A/B of the scripted run at 4x CPU against the tip at 78667a8, two rounds each, gave the same long tasks per phase: 16 to 17 against 17 (scroll down), 38 against 37 to 39 (fling down), 28 against 27 (fling up), and 10 to 11 against 11 to 20 (jumps). First rows took 353 to 355ms against 348 to 355ms. Long tasks at 4x remain row cost (T9), as in 01.
- **Before 04** (merged with the tip at 44c64e4), a full matrix: 1x and 4x, page and sidebar layouts, plain rows, `detail` and `detailDeferred` with annotations. Every scripted phase had 0 jumps, scrolling never showed white, and each jump showed at most one blank frame. First rows took 135 to 159ms at 1x and 427 to 555ms at 4x. Re-renders after a sort or filter took 105 to 132ms at 1x, but other benchmarks were running then: the sort itself took 109 to 111ms.
- **Discarded:** the first matrix. Its page-layout numbers were invalid because of the clipped controls (see Deviations). Playwright scrolled the docs page sideways to click "Run scripted scroll", so the gap sampler hit-tested the docs navigation. It never saw gaps, and every frame became a long task (about 170 per phase at 4x). An A/B with the demo harness reverted, plus a trace, located it.
- Firefox and WebKit weren't run, as in 01.

### 2026-10-12: resolved

Merged into `feat/virtalizer` in `7faa758`. The code review fixes for the whole spec landed afterwards in `72f3b74`.
