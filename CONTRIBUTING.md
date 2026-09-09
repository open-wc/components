# Contributing

## Local Setup

Install dependencies:

```sh
npm install
```

Start the documentation site while working on demos or reference pages:

```sh
npm start
```

Run the demo server when working directly with component examples:

```sh
npm run start:demo
```

## Validation

Run focused tests while changing behavior:

```sh
node --test path/to/test.js
```

Apply formatting fixes before running validation:

```sh
npm run format
```

Run the main validation commands before submitting changes:

```sh
npm run lint
npm run test
npm run types
npm run build
```

## Repo Structure

Add new public UI components as component directories under `src/`.
Keep component source, component-specific helpers, related types, docs, demos, and export entry points grouped around that component instead of adding loose top-level source files.

Existing first-release exports may keep their current top-level entry files, but new public UI components should follow the component-directory layout.
Add new root-level files under `src/` only for genuinely package-wide shared modules.
Do not add new UI components or component-specific helpers as root-level `src/` files.

Shared helpers may remain shared modules when they are genuinely cross-component or non-UI APIs.
Public helpers must have deliberate export entry points and documentation; component-specific helpers should stay inside the owning component directory.

Place tests next to the file they verify, using the existing `*.test.js` or `*.test.type.ts` naming pattern.
Component tests belong in the component directory, and helper tests belong next to the helper module.

Do not edit generated artifacts by hand.
Regenerate outputs such as `dist-types/`, generated docs data, and `generated.*` files through the build, type, or docs pipeline.

Document public UI components in the owning component directory using the existing `*.rocket.md` pattern.
Broader package documentation belongs in the root README, package docs, or docs site rather than inside a component directory.
Public docs and examples must import from package export paths, including `define/*` entry points, rather than internal `src/` files.
This keeps Rocket docs aligned with consumer usage and avoids relying on private source paths.
When one public component imports another public component, use the imported component's public export path.
Use source-level imports only for private implementation modules, component-specific helpers, or genuinely shared internal helpers.

Add documentation in the same change as any new public export.
New public UI component exports need colocated Rocket docs or demos; new public helper exports need a README or API note.

Export public types deliberately through package entry points.
Keep component-specific types with the owning component, use shared public type exports only for deliberate shared APIs, and do not document internal-only types as importable.

Update the `package.json` `exports` map in the same change whenever a public entry point is added, renamed, or removed.
Internal file movement should not change the exports map unless the public surface intentionally changes.

Update `CHANGELOG.md` for consumer-visible public API changes, including added, removed, or renamed exports, behavior changes, and migration-relevant fixes.
Internal refactors that do not affect consumers do not need a changelog entry.
Breaking public-surface changes need explicit migration handling even before `1.0.0`.
When removing or renaming an export, update docs, `package.json` exports, `CHANGELOG.md`, and include a migration note for affected consumers.

Justify dependency changes in the change description.
Use runtime dependencies for libraries required by public exports to work out of the box, and use dev dependencies for build, test, docs, or formatting tools.
Avoid peer dependencies unless consumers must provide a shared singleton or host-controlled version for compatibility.
Adding a peer dependency for a public export should normally include a short ADR explaining why it is not a runtime dependency.

Run a release-hygiene check when changing public docs, examples, package metadata, exports, or package contents.
Those changes must not introduce private/internal references, secrets, private URLs, private registry assumptions, stale package branding, or accidental scratch/agent material in shipped files.

## Commit Messages

Commit messages must start with `feat:`, `fix:`, or `chore:`.

When a commit targets a specific feature or area, include an optional scope before the colon:

```text
feat(table): add column pinning
fix(json-form): preserve empty array values
chore(docs): update release checklist
```

When a commit targets a specific issue, reference that issue in the commit message.
