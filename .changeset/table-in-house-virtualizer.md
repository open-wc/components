---
'@open-wc/components': patch
---

`owc-table` renders large ungrouped tables through a new in-house virtualizer instead of `@lit-labs/virtualizer`. It applies from 300 Data Rows in `virtualizer-mode="auto"` and always in `virtualizer-mode="always"`. Rows stay in normal flow between two spacer elements (`.virtualizer-spacer`), so they're no longer absolutely positioned.

- Fix tables that stayed white after scrolling stopped. Rows always cover the visible area once scrolling stops, and when the browser reports an empty part of the table, the table renders the missing rows.
- Fix the total height of large tables: row heights are measured and unmeasured rows are estimated at the typical measured height, so the last of 100,000 rows can be reached.
- Find the scrolling element without configuration: the page, the content area of `owc-layout-sidebar`, a scroll box of your own, or a scroll box with a `display: contents` slot. Wrappers that only scroll horizontally don't count.
- Render the first rows in the first update, without waiting for a frame.
- `visibleData` holds the rendered Data Rows in display order, and is set in the same update that renders them, so scrolling to new rows costs a single update. Tables that render every row now report all Data Rows in `visibleData`; before, it stayed empty. Rows being inserted are not part of `visibleData`, and they no longer count toward the 300-row threshold.

The table docs have a new Large Tables section with 100,000-row benchmarks, one with page scrolling and one inside `owc-layout-sidebar`.
