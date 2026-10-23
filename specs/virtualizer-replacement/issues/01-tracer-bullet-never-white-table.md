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

**Status:** ready-for-agent

- [ ] A private virtualizer module exists with a contributor README. It isn't exported (V11), and its range and offset math has node tests.
- [ ] Ungrouped tables render through it in `auto` (from 300 Data Rows) and `always` mode. `never`, and tables below the threshold, render plainly as today (V10).
- [ ] The scroll container is detected for (V2):
  - the document;
  - the content area of `owc-layout-sidebar`;
  - a consumer scroll box;
  - the existing `display: contents` slot test fixture.

  A host can also pass its container explicitly.

- [ ] Browser tests cover the following in every one of those containers: after scrolling stops at the top, in the middle and at the end, and after random jumps via scroll-to-index, rows cover the visible area (V3).
- [ ] With 100k Data Rows, the last row is reachable, and rendered rows stay within the visible area plus the buffer (V6).
- [ ] The first render already contains rows; there is no deferred first render. Nothing touches the DOM or `window` while rendering (V9).
- [ ] No stale sizing is left behind by:
  - crossing the threshold (299/300/301 rows);
  - switching data from large to small and back;
  - disconnecting and reconnecting while scrolled down (V8, V10).
- [ ] A table that was hidden ends up covered once it's shown (V8).
- [ ] `visibleData` holds the rendered Data Rows in display order. It is set in the same update that renders them, so a range change costs one table update (T4).
- [ ] The table's existing virtualization tests remain as regression tests, adjusted only where they reached into `@lit-labs/virtualizer` internals. Tests wait for events or promises, not fixed timeouts, wherever possible.
- [ ] A public 100k-row benchmark demo exists in the table docs:
  - generated data, loaded on a button click;
  - one version with page scrolling and one inside `owc-layout-sidebar`;
  - a jump-to-row control;
  - a scripted scroll run that reports long tasks and frames in which the visible area wasn't covered.
- [ ] The benchmark results are recorded under `## Comments`, measured against the table targets (spec: Acceptance → Manual).
- [ ] A changeset covers the consumer-visible fixes, and the Release Gate passes.
- [ ] The user has reviewed the demo and given the go for the tickets that build on the virtualizer.
