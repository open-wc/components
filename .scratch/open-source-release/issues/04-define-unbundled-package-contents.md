Status: ready-for-agent

## What to build

Define the published npm package contents for the first unbundled ESM release so consumers receive the runtime modules, type declarations, and public docs metadata without scratch files, agent docs, tests, or build caches.

## Acceptance criteria

- [ ] Package contents are constrained with a deliberate allowlist or equivalent packaging mechanism.
- [ ] Published contents include `exports/`, required source modules from `src/`, generated declarations from `dist-types/`, and public project metadata.
- [ ] Published contents exclude `.scratch`, `.agents`, agent docs, tests, local caches, and private planning files.
- [ ] No Rollup build is introduced.
- [ ] `npm pack --dry-run` or an equivalent package-content check is documented for release validation.

## Blocked by

- 01-package-identity-and-release-metadata

