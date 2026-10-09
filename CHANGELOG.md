# Changelog

## 0.1.9

### Patch Changes

- a2cf44a: Show readable English and German validation messages in JsonForm controls and array layouts using the existing localization system. Preserve raw validator errors and validation behavior. Custom renderers can read the optional `validationMessage` field from their renderer state.
- f3481e6: Disable row navigation, detail toggles, and rowClick events for pending table inserts while keeping their editing controls available.

## 0.1.8

### Patch Changes

- 665b6f0: Make closed autocomplete triggers reachable with Tab, including fixed triggers, while keeping disabled controls out of the tab order.
- 665b6f0: Fix JSON form required-field errors appearing on unrelated controls whose names share a prefix, such as `salutation` and `salutationType`. Errors still apply to descendants of a missing required object.
- 26c7bc2: Add a `layouts` property to JsonForm for caller-supplied layout components, registered through scoped elements and selected by `uiSchema.type`. Forward registrations through built-in layouts and register their child forms in the correct scope. Export `LayoutDefinition` and `LayoutRecord` types.

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
