# Remeasure dynamic table rows without lifecycle resets

Status: completed

Completion: Flat virtual rows continue to use their complete virtual-item wrapper as the
measurement boundary, including annotations and details. The table schedules supported controller
remeasurement only after the column-width render has reached the next frame; TanStack's element
observation covers later content-driven height changes. No virtualizer lifecycle internals are
called. Browser coverage exercises annotations, actual detail expansion/collapse, asynchronous
detail resizing, row interaction, and repeated column resizing.

Validation: focused ESLint and Prettier checks pass. The focused browser suite is blocked in this
environment because Chromium cannot launch without the system library `libasound.so.2`.

## What to build

Extend the migrated flat-table path so every row is measured as the complete vertical unit occupied
by its normal cells, annotations, and details. Column resizing and asynchronously changing content
must use supported observation or remeasurement behavior rather than disconnecting and reconnecting
engine internals. Preserve scroll stability and all row interactions while measurements settle.

User stories covered: 20-23, 30, 48, and 54.

## Acceptance criteria

- [ ] The measured row boundary includes annotations, expanded details, and other content that contributes to the row's vertical footprint.
- [ ] Repeated column-width changes remeasure affected rows without calling private connected or disconnected lifecycle methods.
- [ ] Wrapped cells and custom variable-height content remain aligned, readable, and non-overlapping after column resizing.
- [ ] Expanding and collapsing detail rows repositions following rows correctly and preserves their interaction behavior.
- [ ] Asynchronously arriving or resizing detail content triggers a correct layout update without a manual scroll reset.
- [ ] Measurements use stable row keys and keep scroll position stable when possible while avoiding blank ranges, overlaps, and uncaught errors.
- [ ] Public-component browser tests exercise resize, annotation, detail expansion and collapse, asynchronous height changes, and disconnect/reconnect behavior at the table seam.
- [ ] The obsolete Lit Labs virtualizer getters, host accessors, and lifecycle-reset helper are removed from the migrated table behavior unless they are documented Public Surface, in which case Migration Handling is recorded.

## Blocked by

- [02 - Preserve flat-table virtualization and explicit scroll ownership](./02-preserve-flat-table-virtualization.md)
