Status: resolved

## What to build

Add or update the core public project files expected for an open source package release, aligned with `@open-wc/components` and the `0.1.0` release target.

## Acceptance criteria

- [x] A root README explains what `@open-wc/components` is and shows at least one package import and one `define/*` import.
- [x] A changelog exists and includes an initial `0.1.0` entry or placeholder.
- [x] A contributing guide exists with local setup, validation commands, and commit message rules.
- [x] Commit message rules require `feat:`, `fix:`, or `chore:` prefixes, with optional feature scope before the colon, such as `feat(table):`, `fix(json-form):`, or `chore(docs):`.
- [x] Commit message rules require referencing a specific issue in the commit message when the commit targets one.
- [x] An MIT license file exists or is prepared, with legal ownership/copyright details handled according to maintainer direction.
- [x] Public project files avoid Finum product positioning.

## Blocked by

- 01-package-identity-and-release-metadata

## Comments

Completed root open source project files:

- Added `README.md` with package overview, package entry-point imports, and `define/*` import usage.
- Added `CHANGELOG.md` with an initial `0.1.0` release target entry.
- Added `CONTRIBUTING.md` with setup, validation commands, and repo commit message rules.
- Added `LICENSE` using the MIT license text and current package author ownership.

Validation:

- `npx prettier README.md CHANGELOG.md CONTRIBUTING.md --check`
- `npm run types`
- `npm run test`

Known existing blockers outside this issue:

- `npm run lint` fails on pre-existing Prettier issues in `.scratch/open-source-release/issues/03-rebrand-public-docs-and-examples.md`, `.scratch/open-source-release/issues/04-define-unbundled-package-contents.md`, `.scratch/open-source-release/issues/06-release-hygiene-and-validation-gates.md`, and several `src/` files.
- `npm run build` fails because current Rocket docs still import `@finum/data-table`; that rebrand work is tracked by issue 03.
