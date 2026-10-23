# 02: Table rows on shared CSS grid tracks

**What to build:** The table's header row and body rows lay out as CSS grids that share one column track list. That replaces flex rows sized by generated per-column width rules.

Column widths still come from today's calculation, so tables look and behave exactly as before. This is a preparatory refactor for 04, where the browser takes over column sizing. It also works with today's virtualizer, because each row is its own grid on the shared tracks.

Spec: [T1](../spec.md#table) (layout part only; subgrid and browser sizing come in 04).

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Header and body rows use one shared column track list, and the generated per-column width rules are gone.
- [ ] The existing class names stay (T1).
- [ ] The existing table suites pass unchanged, including every column-width, column-resize, `grow-full-width`, insert and detail test.
- [ ] The docs demos look the same as before:
  - sticky header;
  - annotations and details;
  - group labels;
  - the row click area;
  - the empty message;
  - horizontal scrolling of wide tables.
- [ ] The changeset carries a migration note: row and cell layout changed from flex to grid, which affects `customStyles` that override it.
- [ ] The Release Gate passes.
