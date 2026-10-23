---
'@open-wc/components': minor
---

`owc-table` has a new `scrollTarget` property: the element that scrolls the table. It overrides the automatic detection of the scroll container, which stays on while `scrollTarget` is unset; setting it back to `undefined` or `null` turns the detection on again. Use it where the table can't find the element that scrolls it on its own, such as a scroll box inside a closed shadow root, or one that clips its content (`overflow: hidden`) and is scrolled by script.

The table docs now describe the virtualizer modes and their 300-row threshold, how the table finds its scroll container, and what `visibleData` holds.

Migration: `virtualizer`, `virtualizerHost` and `resetVirtualizer()` are removed. They handed out `@lit-labs/virtualizer` internals, which the table no longer uses.

- `virtualizer` (the `@lit-labs/virtualizer` instance) and `virtualizerHost` (the element it rendered into) have no replacement. To work with the rendered rows, await `table.updateComplete`; `visibleData` then holds the Data Rows the table renders.
- `resetVirtualizer()`: remove the call. The table keeps its row measurements up to date itself. To recalculate column widths after a content change, call `recalculateColumnWidths()`.
