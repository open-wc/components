# Changelog

## 0.1.7

### Patch Changes

- 4f869bd: Fix `grow-full-width` tables retaining automatic column widths after resizing or preventing grid containers from shrinking. Automatically sized columns now grow and shrink with their container, including below their natural content widths, while preserving configured and manually resized widths and the 50px column minimum. Automatic sizes are no longer persisted as user preferences.

  Restore full-width sizing when a table is shown again after its data changed while hidden. Keep effective columns local to each table so shared definitions cannot leak widths between instances. Read measured and manually resized widths from `table.visibleColumns`; the input `table.columns` definitions are no longer modified by runtime sizing.

  Restore natural column widths when full-width sizing is disabled, and refit remaining automatic columns after a manual resize finishes. Coordinate concurrent sizing requests and keep natural measurements separate from fitted widths. Awaiting `recalculateColumnWidths()` now includes rendering the resulting widths and processing sizing requests received during measurement.

## 0.1.6

### Patch Changes

- 5d2601d: Keep the autocomplete popover width stable while searching by measuring the full option list.

All notable changes to this project will be documented in this file.

## 0.1.5

- Use inherited Web Awesome spacing, border, radius, and badge font-size tokens in detail cards while preserving explicit `--owc-detail-card-*` overrides.

- Make the detail-card accent rail optional and preserve the bottom border of open cards without body content. To retain the previous default rail, set `accent-color="var(--wa-color-brand-fill-loud)"`.

## 0.1.4

- Render synchronous table row details immediately while retaining the loading state for asynchronous details.
- Measure formatted table cells after virtualized rows become available instead of retaining header-only column widths.
- Restore table header alignment and support the `--owc-table-header-align` compatibility token.

## 0.1.3

Table operator type improvements

## 0.1.2

Json Form Type Fixes

## 0.1.1

Fixing type exports

## 0.1.0

Initial release
