# 02: Table rows on shared CSS grid tracks

**What to build:** The table's header row and body rows lay out as CSS grids that share one column track list. That replaces flex rows sized by generated per-column width rules.

Column widths still come from today's calculation, so tables look and behave exactly as before. This is a preparatory refactor for 04, where the browser takes over column sizing. It also works with today's virtualizer, because each row is its own grid on the shared tracks.

Spec: [T1](../spec.md#table) (layout part only; subgrid and browser sizing come in 04).

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Header and body rows use one shared column track list, and the generated per-column width rules are gone.
- [x] The existing class names stay (T1).
- [x] The existing table suites pass unchanged, including every column-width, column-resize, `grow-full-width`, insert and detail test.
- [x] The docs demos look the same as before:
  - sticky header;
  - annotations and details;
  - group labels;
  - the row click area;
  - the empty message;
  - horizontal scrolling of wide tables.
- [x] The changeset carries a migration note: row and cell layout changed from flex to grid, which affects `customStyles` that override it.
- [x] The Release Gate passes.

## Comments

### 2026-10-12: implementation

**Built:**

- Every `.row`, the header row and each body row, is `display: grid` with `grid-template-columns: var(--owc-table-columns)`.
- `#data-table` renders that one track list through `styleMap`. Each visible column gets `width ?? _calculatedWidth` in px, or `auto` while it is unmeasured.
- The generated `nth-child` width rules and `renderSizeTableColumnStyles()` are gone. The width calculation is untouched: `#measureColumnWidths`, `#applyColumnWidths` and `fitColumnWidths`.
- Each row is still its own grid on the shared tracks, so the `@lit-labs/virtualizer` path works unchanged.
- Two declarations keep the measurement identical to the old flex rows:
  - `justify-content: start` on `.row`, so `auto` tracks of unmeasured columns don't stretch (flex items didn't grow either).
  - `flex-shrink: 0` on `.table-header .row`. With `auto` tracks and `min-width: 0` cells, the header grid's min-content collapses to about 0. During measurement the header row then shrank to the host width, and the measured header widths dropped (docs `formatTable`: "First Name" 140px → 93px). The existing suites didn't catch it; the new header-label test does.
- Tests:
  - "lays out the header and every body row on one shared column track list", for `virtualizer-mode` `never` and `always`;
  - "sizes columns to their header labels when the header is wider than the table", red without the `flex-shrink` fix.
- The README notes the grid rows; the changeset carries the migration note.

**Docs demos compared:** headless Playwright against the Rocket dev server, before and after the change. `Math.random` and `crypto.randomUUID` were seeded so the generated demo data is identical.

- 61 screenshots: all 37 table demos at 1400×900, plus these states:
  - the sticky header scrolled (`simpleTable` with the info block, `stickyHeaderTable`);
  - groups collapsed, expanded and scrolled;
  - annotations;
  - details opened through the row click area and through the chevron;
  - a row hovered over its click area;
  - selection;
  - an inserted row;
  - the empty message.
- A 390×844 pass scrolls wide tables horizontally inside their scroll boxes, which also covers the sticky `left` of `#header` and `#info-wrapper`.
- Result: all 61 match within the anti-aliasing noise that two baseline runs show against each other (at most 4 per colour channel, at most 6 pixels per image).
- The layout geometry of 60 table states is identical to the pixel: column widths, `--owc-table-width`, the rects of header, rows, cells, click areas, annotations, details, group labels and the empty message, and hit tests of the row click area.

**Deviation:** one edge case can't be reproduced with grid tracks. Take a custom header `label` template that allows wrapping (`white-space: normal`), in a header wider than the table.

- The old flex header shrank proportionally and wrapped such a label.
- The grid header keeps the label on one line: 246px instead of 165px in a 150px host.

Wrapping body content (text, flex-wrap tags), nowrap labels and `grow-full-width` measure exactly as before; this was checked against the old implementation. The changeset mentions the edge case.

### 2026-10-12: resolved

Merged into `feat/virtalizer` in `b8e8083`. The code review fixes for the whole spec landed afterwards in `72f3b74`.
