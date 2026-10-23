# 04: Columns sized by the browser and frozen while scrolling

**What to build:** The header and the body rows become subgrid rows of one grid, so the browser keeps them aligned.

- Columns without a configured width get their content width from the browser, based on the header and the first rendered rows.
- Those widths then freeze, so they never change while scrolling.
- The script-based measuring of cells goes away.

05 also restructures the table body, so coordinate with it to avoid merge conflicts.

Spec: [T1, T2, T8](../spec.md#table).

**Blocked by:** 01 (Tracer bullet: a 100k-row table that never stays white), 02 (Table rows on shared CSS grid tracks).

**Status:** ready-for-agent

- [ ] Header and rows are subgrid rows of one grid. Spacers, group labels, annotations and details span all columns (T1).
- [ ] Columns without a configured width fit their content after the first render and don't change while scrolling. The existing minimum column width still applies (T2).
- [ ] Configured widths win, and drag-resize and double-click reset work as today.
- [ ] Widths are recalculated only on:
  - today's triggers: changes to data, filters, sorters, columns or overrides;
  - double-click reset;
  - `recalculateColumnWidths()`.

  Never while scrolling.

- [ ] `grow-full-width` still fills the available width.
- [ ] Window resizes and host width changes update widths without resetting the virtualizer (T8).
- [ ] Column sizing behaves the same with and without virtualization. The existing column-width tests pass, adjusted only where they asserted script-measured pixel values.
- [ ] A changeset is added, and the Release Gate passes.
