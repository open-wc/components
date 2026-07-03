Status: completed

# Move table helpers and table types into table-owned public entries

## What to build

Move the table-owned helper Public Surface into table-owned package entry points while preserving helper behavior. CSV export, Excel export, sub-list rendering, table date-state parsing, and table configuration types should be discoverable from the table domain instead of loose top-level helper paths. Remove the old loose table helper entries rather than leaving compatibility stubs.

## Acceptance criteria

- [x] Package consumers can import CSV export, Excel export, sub-list rendering, table date-state parsing, and table types from table-owned public package paths.
- [x] The old loose table helper public paths are removed from the package entry files and package content assumptions.
- [x] Existing table helper behavior remains covered by focused tests, including CSV export, Excel export, and sub-list string rendering behavior.
- [x] Type generation covers the new table-owned type entry points without hand-editing generated artifacts.
- [x] Top-level UI component imports for table components remain stable.

## Blocked by

None - can start immediately
