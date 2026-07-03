Status: resolved

## What to build

Define the published npm package contents for the first unbundled ESM release so consumers receive the runtime modules, type declarations, and public docs metadata without scratch files, agent docs, tests, or build caches.

## Acceptance criteria

- [x] Package contents are constrained with a deliberate allowlist or equivalent packaging mechanism.
- [x] Published contents include `exports/`, required source modules from `src/`, generated declarations from `dist-types/`, and public project metadata.
- [x] Published contents exclude `.scratch`, `.agents`, agent docs, tests, local caches, and private planning files.
- [x] No Rollup build is introduced.
- [x] `npm pack --dry-run` or an equivalent package-content check is documented for release validation.

## Blocked by

- 01-package-identity-and-release-metadata

## Comments

Resolved with the `package.json` `files` allowlist and release validation documentation in
`docs/release-validation.md`.

Validation:

- `npm_config_cache=/tmp/npm-cache npm pack --dry-run --json`
- Package-content assertion checked 605 packaged files and found no `.scratch/`, `.agents/`,
  `docs/agents/`, test directories, or `*.test.*` artifacts.
- No Rollup build was introduced.
