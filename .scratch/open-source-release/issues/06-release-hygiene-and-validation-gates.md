Status: resolved

## What to build

Run the final release hygiene and validation pass that proves the repo and package are ready for the `0.1.0` public prerelease.

## Acceptance criteria

- [x] `npm run lint` passes.
- [x] `npm run test` passes.
- [x] `npm run types` passes.
- [x] `npm run build` passes.
- [x] Public-facing docs, metadata, and shipped files contain no private/internal references, secrets, private URLs, or private registry assumptions.
- [x] Package contents are reviewed and do not include `.scratch`, agent material, tests, local caches, or private planning docs.
- [x] Any remaining legal/provenance question is explicitly documented for human resolution before publication.

## Blocked by

- 02-open-source-project-files
- 04-define-unbundled-package-contents
- 05-audit-and-document-public-exports

## Comments

Resolved after the package-content allowlist, public export audit, and docs hygiene pass.

Validation:

- `npm run lint`
- `npm run test`
- `npm run types`
- `npm run build`
- `npm_config_cache=/tmp/npm-cache npm pack --dry-run --json`
- Package-content assertion checked 605 packaged files and found no `.scratch/`, `.agents/`,
  `docs/agents/`, test directories, or `*.test.*` artifacts.
- Public hygiene scan over shipped docs/source found no Finum package imports, private registry
  assumptions, secrets, tokens, localhost URLs, or loopback URLs.

Legal/provenance note:

- `docs/release-validation.md` records that maintainers still need to confirm the final copyright
  holder before publication.
