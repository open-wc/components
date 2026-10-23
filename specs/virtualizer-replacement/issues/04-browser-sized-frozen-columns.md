# 04: Columns sized by the browser and frozen while scrolling

**What to build:** The header and the body rows become subgrid rows of one grid, so the browser keeps them aligned.

- Columns without a configured width get their content width from the browser, based on the header and the first rendered rows.
- Those widths then freeze, so they never change while scrolling.
- The script-based measuring of cells goes away.

05 also restructures the table body, so coordinate with it to avoid merge conflicts.

Spec: [T1, T2, T8](../spec.md#table).

**Blocked by:** 01 (Tracer bullet: a 100k-row table that never stays white), 02 (Table rows on shared CSS grid tracks).

**Status:** resolved

- [x] Header and rows are subgrid rows of one grid. Spacers, group labels, annotations and details span all columns (T1).
- [x] Columns without a configured width fit their content after the first render and don't change while scrolling. The existing minimum column width still applies (T2).
- [x] Configured widths win, and drag-resize and double-click reset work as today.
- [x] Widths are recalculated only on:
  - today's triggers: changes to data, filters, sorters, columns or overrides;
  - double-click reset;
  - `recalculateColumnWidths()`.

  Never while scrolling.

- [x] `grow-full-width` still fills the available width.
- [x] Window resizes and host width changes update widths without resetting the virtualizer (T8).
- [x] Column sizing behaves the same with and without virtualization. The existing column-width tests pass, adjusted only where they asserted script-measured pixel values.
- [x] A changeset is added, and the Release Gate passes.

## Comments

### 2026-10-12: implementation (branch `virtualizer/04-frozen-columns`)

**Built**

- **One grid (T1):** `#data-table` is the grid, on `--owc-table-columns`. `.table-header`, `.table-body`, `#virtualize-container`, `.row-container` and `.row` are subgrids across all columns, so the header row and every body row share its tracks. The sticky header is the grid's first row, with today's offsets. Spacers, group headers, annotations, details and the empty message span all columns (`grid-column: 1 / -1`), and `contain: inline-size` keeps their content from sizing the columns. The test fails without either. The loading overlay moved from `.table-body` to the grid itself, on the body's row (`grid-row: 2 / 3`). Inside `.table-body` it would only cover the columns' width and center its spinner off-screen in wide tables; on the grid it covers the host's width over the body, as before.
- **Sizing (T2):** `#contentWidths()` lays the grid out once with `min-content` tracks for the columns without a `width` (configured widths stay px), reads the used track sizes from `getComputedStyle(#data-table).gridTemplateColumns`, and rounds them up. `#applyColumnWidths()` is unchanged (the 50px minimum, `fitColumnWidths()` for `grow-full-width`) and freezes them in px. The scripted measuring of every cell is gone. Columns that aren't sized yet render as `min-content` tracks, so the first frame already looks like the frozen one.
- **`min-content` rather than `auto` or `max-content`** (the question 02 left open): `auto` tracks squeeze or stretch in a grid as wide as the host, and collapse to 0px under a min-content constraint in Chromium. `max-content` would size content that can wrap (a formatter with `white-space: normal`, wrapping tags) to its single line, where the script measured its widest word. `min-content` reproduces the script: cell text, which doesn't wrap, at its whole width, and wrapping content at its widest unbreakable part. Header labels keep 02's single-line width: while sizing, `#data-table[sizing-columns] .table-header .cell` gets `min-width: max-content`.
- **Triggers:** today's, unchanged: data, filters, sorters, columns, `overrides`, `growFullWidth`, connecting, a double-click reset, the end of a drag in `grow-full-width` tables, and `recalculateColumnWidths()`. Nothing sizes on scroll. Two triggers changed:
  - The window resize handler only sizes again when `innerWidth` changed. Mobile browsers fire height-only resizes while scrolling (the toolbar hides), and those re-measured from the rows rendered at that moment. A test dispatches a resize without a width change while scrolled to a wider row: the old handler widened the column from 135px to 356px.
  - The host's ResizeObserver, which only existed for `grow-full-width`, always observes now. It sizes again when the host's width changes, for `grow-full-width` tables and for tables that weren't laid out when they were last sized.
- **Hidden tables (T8):** inside `display: none`, `getComputedStyle` returns the specified tracks (`min-content`), so the sizing leaves the columns content-sized and sizes them once the host has a width. Before, such a table froze every column at 50px; the new test failed that way first.
- **No virtualizer reset (T8):** whenever the frozen tracks change (a sizing, or the end of a drag), the table calls `remeasure()`. 07's window-resize path still remeasures after sizing. Tests: a `grow-full-width` table made narrower while scrolled down keeps the same row elements at the same positions; rows that wrap at the narrower width are measured again, so the list is as tall as 1,000 wrapped rows (65,000px; 47,198px without the `remeasure()`).

**Tests:** `OwcTable.columnWidths.test-browser.js` (11 tests): spanning elements; the exact fit (widest rendered content plus padding and border, the header label plus sort button and handle, the 50px minimum, a wider row far below left out); header labels on one line and wrapping cell content at its widest word; the same widths with and without virtualization; widths kept while scrolling to a wider row; a height-only window resize; a hidden table sized once shown and frozen afterwards; a `grow-full-width` resize while scrolled down; rows measured again after a width change; drag-resize and double-click reset to the configured or the fitting width; sizing again after sorting, filtering and new data, but not while scrolling. The hidden-table and header-label tests were red first. The tests for the span, the containment, the hidden table's trigger, `remeasure()` and the window-width check fail when that code is broken. The others pin behavior that already held.

**Adjusted existing tests** (both in `OwcTable.test-browser.js`):

- 02's "lays out the header and every body row on one shared column track list" is now "… as subgrid rows of one grid": `#data-table` holds `160px <age>px`, and every row computes to `subgrid`. A subgrid row's `gridTemplateColumns` is `subgrid [] [] []`, so the old per-row assertion can't hold.
- "finishes recalculation with data updated during measurement": 116 → 118px and 336 → 338px. The grid counts the cell's left and right border (the table's only column is the first and the last), and the script didn't, so it cut such content off by 2px.

**Docs comparison** (02's harness, scratchpad `04-cols/`): the tip `d4bbf5b`, served from an export, against this branch before the docs edits. 56 of 61 screenshots are identical, 2 more differ only by anti-aliasing noise, and every column's width is identical in all 60 table states. The remaining differences:

- `.table-header`'s box is as wide as the columns instead of the host (41 geometry entries). It has no background, so nothing changes visibly.
- Grouped tables are 1px narrower to scroll (586px instead of 587px). A group header's click area was `--owc-table-width` wide but placed inside the header's 1px left border, so it overflowed by 1px. The two narrow screenshots scrolled to the far right shift by that pixel.
- 11px of anti-aliasing at one group badge.

A first comparison against a baseline from before 07 also showed 1px shifts in the localization demos. They came from 07's new docs text above them, not from this change. After the docs edits, the geometry of all 60 states is unchanged.

**Measurements** (not asked for; recorded because nested subgrids could have made scrolling slower). Production builds of the tip and this branch (before the header-label commit, which only adds a style during sizing), headless Chromium 1280×900, 05's `measure.mjs`, alternating runs:

| Benchmark demo                                                     | Tip                                                        | Branch                             |
| ------------------------------------------------------------------ | ---------------------------------------------------------- | ---------------------------------- |
| First rows painted (4x, page, two runs)                            | 433, 423ms                                                 | 393, 396ms                         |
| Frames with gaps (all runs)                                        | none while scrolling; jumps 10 of 50, never 2 in a row     | the same                           |
| Tasks over 50ms in the nine scroll phases (4x, page)               | 227, 227                                                   | 225, 222                           |
| Sizing the columns after a sort or filter, on top of the paint (4x) | 77 to 200ms                                               | 62 to 142ms                        |
| Same at 1x, sidebar / page grouped                                 | 47 to 54ms / 43 to 48ms                                    | 32 to 33ms / 27 to 29ms            |
| First rows at 1x, sidebar / page grouped                           | 132ms / 133ms (grouping on: 34ms)                          | 137ms / 122ms (grouping on: 48ms)  |

A trial application of 03's branch (`3f31d3c`) on this branch passed 03's row-height tests and the table and controller suites (129 tests).

**Deviations and decisions**

- `grow-full-width` keeps `fitColumnWidths()` in script instead of `minmax(<w>px, <w>fr)` tracks (the design notes' "can"). That keeps today's integer widths, the treatment of configured, dragged and non-resizable columns, and the existing tests.
- Window resizes only size the columns again when the window's width changes, see Triggers.
- A table that wasn't laid out sizes its columns once it has a width: a new trigger, for T8's hidden case.

**Unchecked:** none.

### 2026-10-12: resolved

Merged into `feat/virtalizer` in `78667a8`. The code review fixes for the whole spec landed afterwards in `72f3b74`.
