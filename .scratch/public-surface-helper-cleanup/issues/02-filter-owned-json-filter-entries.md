Status: completed

# Move JSON Filter adapters and JSON Filter types into filter-owned public entries

## What to build

Move the JSON Filter Public Surface into filter-owned package entry points while preserving the current JSON Filter shape and adapter behavior. `jsonToFilter`, `jsonToSqlFilter`, `globalSearchField`, and JSON Filter types should remain public through filter-owned paths. Remove the old loose filter entry instead of keeping a compatibility stub.

## Acceptance criteria

- [x] Package consumers can import the Filter Function adapter, SQL Filter adapter, `globalSearchField`, and JSON Filter types from filter-owned public package paths.
- [x] The public JSON Filter data shape remains unchanged; this is an import-path migration only.
- [x] `dateParserForJsonDecode` is not exposed as a general JSON Filter serialization contract through the filter namespace.
- [x] Existing JSON Filter and SQL Filter adapter tests continue to verify behavior.
- [x] Type generation covers the new filter-owned type entry points without hand-editing generated artifacts.

## Blocked by

None - can start immediately
