---
'@open-wc/components': minor
---

`owc-table` lays out its header row and body rows as CSS grids that share one column track list. This replaces flex rows sized by generated per-column `nth-child` width rules. Tables look the same.

Migration: row and cell layout changed from flex to grid, which affects `customStyles` that override it.

- `.row` is now `display: grid`, and its cells sit on the column tracks. Flex properties on `.row` and `.cell`, and `width`, `min-width` or `max-width` rules on `.cell`, no longer size columns. Set a column's width through its `width` property instead.
- `renderSizeTableColumnStyles()`, which rendered the per-column width rules, is removed.
- A custom header `label` template that allows wrapping (`white-space: normal`) no longer wraps when the header is wider than the table. Its column takes the label's single-line width.
