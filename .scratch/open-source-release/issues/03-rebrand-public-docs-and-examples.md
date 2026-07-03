Status: resolved

## What to build

Rebrand public-facing documentation, examples, page titles, logos, and import snippets from the old Finum package identity to `@open-wc/components`.

## Acceptance criteria

- [x] Public docs and examples use `@open-wc/components` imports instead of `@finum/data-table`.
- [x] Page titles and descriptions present the package as Open Web Components components, not Finum UI.
- [x] Finum-specific logos, names, and examples are removed or replaced in public docs.
- [x] Legal/provenance metadata is not changed unless explicitly covered by the license issue.
- [x] Docs still build through `npm run build`.

## Blocked by

- 01-package-identity-and-release-metadata

## Comments

Resolved in commit `d14cf10 chore(docs): rebrand public docs for issue 03`.

Validation:

- `npm run build` passed.
- `npm run types` passed.
- `npm run test` passed.
- Targeted Prettier and `git diff --check` passed.
- `npm run lint` was run; ESLint passed, but the repository-wide Prettier check failed on pre-existing files under `.agents/skills/**`.
