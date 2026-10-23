# 01: Tracer bullet: a 100k-row table that never stays white

**What to build:** An ungrouped `owc-table` with 100k Data Rows renders through the new private virtualizer.

- Rows sit in normal flow between a top and a bottom spacer.
- The scroll container is found automatically: page scrolling, the content area of `owc-layout-sidebar`, or a consumer's scroll box.
- Once scrolling stops, rows always cover the visible part of the table, and the last row can be reached.

This is the proof the whole effort depends on. Every ticket that builds on the virtualizer waits for its go/no-go.

What this ticket leaves for later:

- Grouped tables keep `@lit-labs/virtualizer` until 05.
- Column widths keep today's calculation until 04.
- Keeping visible rows in place when heights change comes in 03.

Spec: [V1–V4, V6–V11, T4](../spec.md#requirements). V4 here covers measurement and the typical-height estimate; the open-detail estimate comes in 03.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] A private virtualizer module exists with a contributor README. It isn't exported (V11), and its range and offset math has node tests.
- [x] Ungrouped tables render through it in `auto` (from 300 Data Rows) and `always` mode. `never`, and tables below the threshold, render plainly as today (V10).
- [x] The scroll container is detected for (V2):
  - the document;
  - the content area of `owc-layout-sidebar`;
  - a consumer scroll box;
  - the existing `display: contents` slot test fixture.

  A host can also pass its container explicitly.

- [x] Browser tests cover the following in every one of those containers: after scrolling stops at the top, in the middle and at the end, and after random jumps via scroll-to-index, rows cover the visible area (V3).
- [x] With 100k Data Rows, the last row is reachable, and rendered rows stay within the visible area plus the buffer (V6).
- [x] The first render already contains rows; there is no deferred first render. Nothing touches the DOM or `window` while rendering (V9).
- [x] No stale sizing is left behind by:
  - crossing the threshold (299/300/301 rows);
  - switching data from large to small and back;
  - disconnecting and reconnecting while scrolled down (V8, V10).
- [x] A table that was hidden ends up covered once it's shown (V8).
- [x] `visibleData` holds the rendered Data Rows in display order. It is set in the same update that renders them, so a range change costs one table update (T4).
- [x] The table's existing virtualization tests remain as regression tests, adjusted only where they reached into `@lit-labs/virtualizer` internals. Tests wait for events or promises, not fixed timeouts, wherever possible.
- [x] A public 100k-row benchmark demo exists in the table docs:
  - generated data, loaded on a button click;
  - one version with page scrolling and one inside `owc-layout-sidebar`;
  - a jump-to-row control;
  - a scripted scroll run that reports long tasks and frames in which the visible area wasn't covered.
- [x] The benchmark results are recorded under `## Comments`, measured against the table targets (spec: Acceptance → Manual).
- [x] A changeset covers the consumer-visible fixes, and the Release Gate passes.
- [x] The user has reviewed the demo and given the go for the tickets that build on the virtualizer.

## Comments

### 2026-10-12: implementation (branch `virtualizer/01-tracer-bullet`)

**Built**

- `src/virtualizer/`: `VirtualizerController` (Lit controller), `ItemSizes.js` (heights, median estimate, offsets from two Fenwick trees), `range.js`, `scrollContainer.js`, and a contributor README with the API, the decisions, and the hooks for 03, 05, 06, 07 and 08. Node tests cover the math and slicing without a DOM or `window`. 26 browser tests use a minimal host in the document, a consumer scroll box, a scroll box with a `display: contents` slot, and the `owc-layout-sidebar` content area.
- `owc-table`: ungrouped lists render through the controller in `auto` (from 300 Data Rows) and `always`, and as a plain list otherwise. Rows sit in normal flow between two `.virtualizer-spacer` elements inside `#virtualize-container`. `visibleData` is set in `update()`, before the render. Grouped tables are unchanged (lit-labs until 05).
- Tests: 16 new ones in `src/table/OwcTable.virtualization.test-browser.js`, which has no ResizeObserver error suppression. Three existing virtualization tests were adjusted: the lit-labs `min-height` and host-swap assertions became observable sizing checks, and `aTimeout` became `scrollend` or `recalculateColumnWidths()`.
- Docs: a Large Tables section in `OwcTable.rocket.md` with the two 100k-row benchmarks (page scrolling, `owc-layout-sidebar`): load on click, jump to row, a scripted scroll run, and a monitor for manual scrolling.

**Deviations** (the reasons are in `src/virtualizer/README.md` → Decisions)

- Rows are keyed by their data object, for both the `repeat` keys and the measurement cache, not by `getRowId`.
- Detection reads "the first ancestor that scrolls" as an element whose `overflow-y` scrolls and whose content overflows, so wrappers that only clip horizontally are skipped. The container stays unknown until the list is in the rendered flat tree: `owc-layout-sidebar` renders its slot after the table's first update. The window's scroll events are always listened to as well.
- The scroll handler reads live geometry rather than cached geometry.
- `visibleData` leaves insert rows out, and for tables that render every row it holds all Data Rows (it used to stay empty). The `auto` threshold counts Data Rows only. That's T3 and T4 applied to ungrouped tables.
- `resetVirtualizer()` now calls `remeasure()`, and `virtualizer` returns `undefined` for ungrouped tables. 07 removes both.
- The table has no public scroll-to-row API (T5 adds none), so the demo implements its jump itself: it scrolls by the average row height, then calls `scrollIntoView` on the rendered row. The demo reads the table's shadow DOM only to measure (`.table-body`, `.row-container`, `data-index`).
- The demo has no annotation, detail or grouping toggles yet; 03 and 05 add them.
- Anchoring relies on the browser's native scroll anchoring until 03 decides.

**Unchecked:** the user's go/no-go, by design.

**Measurements.** Headless Chromium (Playwright 1.62), 1280×900 viewport, Apple Silicon Mac. These are the demo's own instruments, not DevTools recordings: painted frames are hit-tested for gaps after each paint, and long tasks come from a `PerformanceObserver`. Wheel, trackpad and keyboard input are real input events sent through Playwright. The numbers are from the production docs build (`npm run build`), page layout; the sidebar layout and the dev server gave the same picture.

| Target (spec: Acceptance → Manual)                                                                                                         | 1x CPU                                                                                | 4x CPU throttling                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| No white while scrolling: wheel (100px notches, 30/s and 60/s), trackpad (15px every 8ms, 80px fling), keyboard (PageDown, held ArrowDown, End/Home) | 0 frames with gaps, of about 2,500 per layout                                          | 0                                                         |
| At most one blank frame when dragging the scrollbar or flinging                                                                             | Jumps: 1 blank frame per jump (10 of 10), never 2 in a row. Flings at 250px per frame: 0 | Same                                                      |
| No task over 50ms while scrolling                                                                                                          | 0 in every phase                                                                      | 16 to 45 per phase, 50 to 150ms each (182ms on one jump) |
| First rows within 200ms of setting the data                                                                                                | 102 to 116ms                                                                          | 352 to 379ms                                              |
| Re-render within 100ms after a sort or filter, without the sort or filter                                                                  | 75 to 88ms (the sort itself takes 84 to 87ms, the filter 39 to 41ms)                  | 109 to 325ms                                              |

On a page holding only the table (production Lit), a range update costs about 3.5ms at 1x and 14ms at 4x, and no frame takes longer than 19ms at 1x, even at 250px per frame. At 4x, frames that create rows reach 52 to 77ms, which is the style and layout of new rows with 20 cells, including a `wa-checkbox`. That's row cost (T9), not the virtualizer. Of a sort's roughly 130ms until paint at 1x, about 48ms is the sort itself and about 6ms the controller's rebuild for 100k rows. The rest is rendering and layout, including today's script-based column measurement, which 04 replaces.

Firefox and WebKit weren't run: the cached Playwright browsers don't match the installed Playwright, and downloading new ones needs approval.

### 2026-10-12: go

The user reviewed the 100k-row benchmark demo and gave the go for the tickets that build on the virtualizer (03 to 09). They chose not to add a row-cost (T9) ticket for now.

### 2026-10-12: resolved

Merged into `feat/virtalizer` in `0b03a27`. The code review fixes for the whole spec landed afterwards in `72f3b74`.
