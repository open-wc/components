---
'@open-wc/components': patch
---

Fix `grow-full-width` tables retaining automatic column widths after resizing or preventing grid containers from shrinking. Automatically sized columns now grow and shrink with their container, including below their natural content widths, while preserving configured and manually resized widths and the 50px column minimum. Automatic sizes are no longer persisted as user preferences.

Restore full-width sizing when a table is shown again after its data changed while hidden. Keep effective columns local to each table so shared definitions cannot leak widths between instances. Read measured and manually resized widths from `table.visibleColumns`; the input `table.columns` definitions are no longer modified by runtime sizing.
