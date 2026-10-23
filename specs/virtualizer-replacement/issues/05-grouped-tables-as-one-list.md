# 05: Grouped tables virtualize as one list

**What to build:** A grouped table renders as one virtualized list in which group headers are rows.

- Collapsing or expanding a group removes or adds its rows.
- Clicks and selection find the right row by id.
- No table list renders through `@lit-labs/virtualizer` anymore.

This supersedes the separate minimal fix for grouped rows resolving the wrong row, if that fix has landed. 04 also restructures the table body, so coordinate with it to avoid merge conflicts.

Spec: [T3, T4](../spec.md#table).

**Blocked by:** 01 (Tracer bullet: a 100k-row table that never stays white).

**Status:** resolved

- [x] Group headers render as rows inside the single list and look as they do today: colors, count badge, chevron. Group order and the "others" group work as today.
- [x] Collapsing or expanding a group removes or adds its rows, also while scrolled down.
- [x] Row clicks and selection resolve the right row in every group. The test uses groups whose rows are interleaved in the data.
- [x] The `auto` threshold counts Data Rows across all groups; group headers and insert rows don't count (T3).
- [x] `visibleData` holds the rendered Data Rows in display order for grouped tables too (T4).
- [x] Grouped tables pass the same "covered once scrolling stops" checks as 01.
- [x] No table list renders through `@lit-labs/virtualizer` anymore. Its accessors are removed in 07.
- [x] The benchmark demo gets a grouping toggle. A changeset is added, and the Release Gate passes.

## Comments

### 2026-10-12: implementation (branch `virtualizer/05-groups-one-list`)

**Built**

- `src/table/groupedList.js` (private): lays a grouped table out as one list. Each group's header is an item, followed by the group's rows while the group is expanded. Groups keep today's priority order, and rows that match no group form the **Others** group at the end. It also returns each row's position within its group. Headers are `GroupHeader` objects; the table keeps one per group definition (and one for Others), so a header keeps its element and its measured height across renders.
- `owc-table` renders grouped and ungrouped tables through the same list and the in-house controller. The grouped list is rebuilt only when the rows, the selector, `groupList`, a group's key, priority or `active` flag, or `othersGroupActive` change. Removed: the lit-labs `virtualize()` call, `#renderList`, `#renderGroups`, the deferred first render of grouped tables (`#virtualizerReady`), and the `.group-rows-container` wrappers. No table list renders through `@lit-labs/virtualizer` anymore.
- Rows resolve by identity. Each `.row` has a click handler with its own row object, so `rowClick` and the selection checkbox use the clicked row. The delegated, index-based `#handleTableClick` is gone. The checkbox's state comes from the row too, and rows being inserted can't be selected.
- `data-index` is the item's index in the rendered list for every table, so it counts group headers, as `scrollToIndex()` does, and headers carry one too; the benchmark's Jump relies on that. The row number that `rownum` and `custom.index` show stays group-relative, as today.
- `groupList`, `groupSelector` and `othersGroupActive` are reactive properties now. The benchmark's toggle needs that.
- `visibleData` holds the rendered Data Rows in display order, without headers and insert rows. A grouped table that renders all rows works them out only when needed, so a virtualized grouped table skips that pass over 100k rows after a sort.
- Insert flow (merged from 06): grouped tables now take the controller path, with the new row's index in the grouped list. A collapsed group expands first. The 100ms-timeout flow and `scrollIntoViewIfNeeded()` are gone, and so is the "without grouping" caveat in the Adding Rows docs and in 06's changeset.
- Tests: 17 in `OwcTable.virtualization.test-browser.js`, and one in `OwcTable.test-browser.js` for selecting insert rows. 01's coverage test runs for grouped tables too, in all four containers. Other tests cover: the 100k end, the threshold in all modes, header look, order and Others, collapse and expand while scrolled down, clicks and selection with interleaved groups, visibleData (all rows, and virtualized in one update), data changes while scrolled down, setting the groups after the first render, rownum within groups, grouped inserts, and a grouped table with an open detail. Against the previous table code, 17 of the new or changed tests fail, either with lit-labs ResizeObserver loop errors or with wrong rows. Only the characterization tests (header look, order and Others; `rownum` within groups) and the cases below the threshold pass on both.
- Docs: a Large Grouped Tables section, a corrected Others Group text (the group always shows; `othersGroupActive` only expands it), a Grouping section in the table README, and the virtualizer README's grouped-list notes. The controller's API didn't change.
- Benchmark demo: a **Group by department** toggle (five groups plus Others, all expanded) that reports paint time. The demo's gap check now counts group headers, and its end check no longer assumes the last row's `data-index`. Its `scrollParent()` treats `body` as the page: with fractional header heights, the docs `body` (computed `overflow-y: auto`) overflows by 1px, and the demo had picked it as the scroller.

**Deviations and decisions**

- Identity resolution uses a per-row click handler rather than a lookup by `data-index`.
- A row inserted into a collapsed group expands that group. Otherwise the new row isn't part of the list and can't get focus.
- Expanding a group doesn't recalculate column widths, as today. A table whose groups all start collapsed renders no body rows at first, so its widths come from the header alone, as today.
- A consumer group with the key `others` no longer shares its rows with the Others group.
- `table.virtualizer` still imports `virtualizerRef` and now always returns `undefined`. 07 removes it.
- Expanding or collapsing a group programmatically while its header is above the visible area isn't anchored, so the content shifts. A click always hits a visible header, and the rows change below it; a test checks that the header stays in place.
- The separate minimal fix for grouped row clicks never landed, so there was nothing to supersede.

**Unchecked:** none.

**Docs check** (scratchpad harness from 02, with a new group-state capture): headers, order, colors, badges, chevrons, `last-row` rounding and column widths are identical in 9 group states (18 screenshots). In the 61-shot docs pass, the only geometry change is the removed `.group-rows-container`. 3 to 4 px of icon anti-aliasing also differ between two baseline sessions of the old code.

**Measurements** (not asked for by the ticket; recorded for the grouping toggle). Production docs build, headless Chromium 1280×900, using the demo's own instruments as in 01. Other agents were running tests on the same machine, so long-task counts at 4x varied by about ±50% between identical runs. Grouped means 100,000 rows in five department groups plus Others, all expanded. Each comparison ran ungrouped and grouped back to back.

| Target (spec: Acceptance → Manual)                         | Ungrouped                                                    | Grouped                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------- |
| No white: wheel, trackpad, keyboard (1x, page and sidebar) | 0 frames with gaps                                           | 0 frames with gaps                                                   |
| At most one blank frame per scrollbar jump or fling (1x)   | Page 9 of 50 jump frames, sidebar 10 of 50, never 2 in a row | Page 0 of 50, sidebar 10 of 50, never 2 in a row                     |
| No task over 50ms while scrolling (1x)                     | Page: 1 (57ms, jumps); sidebar: 3 (≤58ms, jumps)             | Page: 1 (56ms, jumps); sidebar: 2 (≤74ms, jumps)                     |
| Same at 4x CPU (two runs each)                             | 19–44 per scroll phase, longest 99–232ms                     | 18–39 per scroll phase, longest 92–303ms                             |
| First rows after setting the data (1x)                     | 133–147ms                                                    | 128–148ms; turning grouping on repaints in 30–34ms (120–144ms at 4x) |
| Re-render after a sort or filter, without it (1x)          | Page 90–99ms, sidebar 65–72ms                                | Page 103–110ms, sidebar 58–80ms                                      |

- The last row is reachable at the end in every run.
- Grouping costs one pass over the rows when they or the groups change (`groupedList()`, about 8 to 10ms for 100k rows in the dev build), and nothing per scroll update.
- A profiled filter (`age < 40`, same state, alternating order) painted in 625ms grouped and 627ms ungrouped at 4x, and in 134 and 135ms at 1x.
- The script's 4x sort and filter steps vary with the state they start from (394 to 570ms grouped, 116 to 479ms ungrouped), so they don't compare variants.

### 2026-10-12: resolved

Merged into `feat/virtalizer` in `4f9b5cb`. The code review fixes for the whole spec landed afterwards in `72f3b74`.
