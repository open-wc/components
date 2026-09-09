# Contributing

## Getting Started

> Please note that this project is released with a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

First, create a fork of the [open-wc/components](https://github.com/open-wc/components) repository using the `Fork` button on GitHub.

Clone the upstream repository onto your computer.

```shell
git clone git@github.com:open-wc/components.git
```

Once cloning is complete, change directory to the repository.

```shell
cd components
```

Now add your fork as a remote (replacing YOUR_USERNAME with your GitHub username).

```shell
git remote add fork git@github.com:<YOUR_USERNAME>/components.git
```

Create a new local branch.

```shell
git checkout -b my-awesome-fix
```

## Preparing Your Local Environment for Development

Components development requires [Node.js](https://nodejs.org/) 24. After cloning the repository, install the locked dependencies.

```shell
npm ci
npx playwright install chromium
```

To run the documentation site locally:

```shell
npm start
```

## Making Your Changes

Make your changes in a focused branch. For code changes, keep tests close to the source file they cover.

### Type Checking

Run the TypeScript build before opening a pull request:

```shell
npm run types
```

### Running Tests

Run the Node and browser test suites from the repository root:

```shell
npm test
```

### Linting and Formatting

Check linting and formatting before opening a pull request:

```shell
npm run lint
```

To apply automatic fixes:

```shell
npm run format
```

## Creating a Changeset

If you made changes for which you want to trigger a release, you need to create a changeset.
This documents your intent to release, and allows you to specify a message that will be put into the changelog.

[More information on changesets](https://github.com/changesets/changesets)

Run

```shell
npm run changeset
```

Select `@open-wc/components` and the release type. Changesets updates the version and changelog in a release pull request; do not rewrite existing release entries. For the release type, we follow [Semantic Versioning](https://semver.org/), so please take a look if you're unfamiliar.

In short:

- A documentation change or similar chore usually does not require a release
- A bugfix requires a patch
- A new feature (feat) requires a minor
- A breaking change requires a major

Exceptions:

- For alpha (<1.0.0), bugfixes and feats are both patches, and breaking changes are allowed as minors.
- For release-candidate and other special cases, other rules may follow.

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

Add a changeset for consumer-visible public API changes, including added, removed, or renamed exports, behavior changes, and migration-relevant fixes.
Internal refactors that do not affect consumers do not need a changelog entry.
Breaking public-surface changes need explicit migration handling even before `1.0.0`.
When removing or renaming an export, update docs, `package.json` exports, the changeset, and include a migration note for affected consumers.

Justify dependency changes in the change description.
Use runtime dependencies for libraries required by public exports to work out of the box, and use dev dependencies for build, test, docs, or formatting tools.
Avoid peer dependencies unless consumers must provide a shared singleton or host-controlled version for compatibility.
Adding a peer dependency for a public export should normally include a short ADR explaining why it is not a runtime dependency.

Run a release-hygiene check when changing public docs, examples, package metadata, exports, or package contents.
Those changes must not introduce private/internal references, secrets, private URLs, private registry assumptions, stale package branding, or accidental scratch/agent material in shipped files.

## Dependency and Lockfile Policy

Use `npm` and keep `package-lock.json` committed. When `package.json` changes, update the lockfile in
the same pull request. Do not switch package managers or add a second lockfile.

Dependency changes should be intentional and explained in the pull request. Prefer existing
dependencies and platform APIs before adding new runtime dependencies. Pull requests that change
dependencies are expected to pass dependency review in GitHub Actions.

## Release Process

See [Release Validation](./docs/release-validation.md) for CI checks and the one-time npm trusted publisher setup.

## Security Reports

Please report suspected vulnerabilities through the process in [SECURITY.md](./SECURITY.md). Do not
open a public issue for an active vulnerability.

## Committing Your Changes

Commit messages must follow the [conventional commit format](https://www.conventionalcommits.org/en/v1.0.0/)
starting with `feat:`, `fix:`, or `chore:`. Add a lowercase scope when useful and reference the issue when applicable. For example:

```shell
fix(table): preserve column alignment
```

## Create a Pull Request

Now it's time to push your branch that contains your committed changes to your fork.

```shell
git push -u fork my-awesome-fix
```

After a successful push, if you visit your fork on GitHub, you should see a button that will allow you to create a Pull Request from your forked branch, to our main branch.
