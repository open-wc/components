Status: completed

# Update migration notes, public export audit, examples, changelog, and release validation

## What to build

Document the breaking Public Surface cleanup end to end after the helper and type entry migrations land. Migration Handling should include exact before/after import mappings for every removed path, public docs and examples should use only the new public paths, the public export audit should match the package files, and the Release Gate should remain the final validation target for the Open Source Release.

## Acceptance criteria

- [x] Migration notes or changelog entries list every removed helper/type import path and its exact replacement path.
- [x] Public docs and examples no longer import removed loose helper/type paths.
- [x] `docs/public-exports.md` reflects the cleaned Public Surface and no longer describes the removed loose helper/type entries as preserved release paths.
- [x] Package content review confirms obsolete compatibility stubs and removed entries are not shipped.
- [x] Release Gate validation is run or explicitly documented as the remaining required final validation: lint, test, types, build, package-content review, and public hygiene scan.

## Blocked by

- .scratch/public-surface-helper-cleanup/issues/01-table-owned-helper-and-type-entries.md
- .scratch/public-surface-helper-cleanup/issues/02-filter-owned-json-filter-entries.md
- .scratch/public-surface-helper-cleanup/issues/03-text-and-lit-helper-namespaces.md
- .scratch/public-surface-helper-cleanup/issues/04-owned-component-type-entries.md
