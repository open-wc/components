Status: resolved

## What to build

Update the package metadata so the project is positioned for its first public release as `@open-wc/components` version `0.1.0`, without renaming `owc-` elements or `Owc*` symbols.

## Acceptance criteria

- [x] Package metadata uses `@open-wc/components` as the package name.
- [x] Package version targets `0.1.0`.
- [x] Package description no longer presents the project as Finum-specific.
- [x] License metadata targets MIT.
- [x] Existing `exports/` entry points remain available.
- [x] No `Owc*` class/type/file names or `owc-` custom element tags are renamed.

## Blocked by

None - can start immediately

## Comments

Completed in commit `e3a0b83` (`Prepare package metadata for open source release`).

Validation:

- `node --test src/csv.test.js src/excel.test.js`
- `npm run types`
- `npm run test`
- Metadata assertion for package name, version, description, license, and root lockfile metadata.
- Source scan confirmed executable `exports/` and `src/` package self-imports no longer reference `@finum/data-table`, excluding documentation/examples covered by later rebrand issues.
