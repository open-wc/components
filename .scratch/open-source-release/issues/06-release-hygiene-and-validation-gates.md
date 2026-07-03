Status: ready-for-agent

## What to build

Run the final release hygiene and validation pass that proves the repo and package are ready for the `0.1.0` public prerelease.

## Acceptance criteria

- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run types` passes.
- [ ] `npm run build` passes.
- [ ] Public-facing docs, metadata, and shipped files contain no private/internal references, secrets, private URLs, or private registry assumptions.
- [ ] Package contents are reviewed and do not include `.scratch`, agent material, tests, local caches, or private planning docs.
- [ ] Any remaining legal/provenance question is explicitly documented for human resolution before publication.

## Blocked by

- 02-open-source-project-files
- 04-define-unbundled-package-contents
- 05-audit-and-document-public-exports

