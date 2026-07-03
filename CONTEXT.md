# Components

Reusable web components and helper modules prepared for public consumption as an npm package.

## Language

**Open Source Release**:
Publishing this repository as a reusable web-component library package, with a deliberate public surface, documentation, examples, license, changelog, and contribution guidance.
_Avoid_: Making the repository public without package readiness

**Initial Release Version**:
The first open source package publication targets version `0.1.0`.
_Avoid_: Stable `1.0.0` for the first public publication

**Public Surface**:
The package exports, type exports, `package.json` export-map entries, and documented entry points that consumers and other public components are allowed to import and rely on after release; public docs and examples should use only these paths.
_Avoid_: Internal file tree, implementation modules

**JSON Filter**:
A structured filter expression used to select table rows; table UI edits JSON Filters, and adapters turn them into Filter Functions or SQL Filters.
_Avoid_: Filter query, filter tree, nested filters

**Filter Function**:
An in-memory adapter derived from a JSON Filter that decides whether a row should be included.
_Avoid_: Predicate, callback, compiled filter

**SQL Filter**:
A data-adapter representation derived from a JSON Filter, consisting of a SQL clause and parameters.
_Avoid_: SQL query, where string, SQL predicate

**Consumer-Visible Change**:
A change that affects package users through public exports, documented behavior, migration requirements, or notable fixes.
_Avoid_: Internal refactor, private implementation cleanup

**Migration Handling**:
The documentation, changelog, export-map updates, and migration notes required when a public-surface change could break consumers, even before `1.0.0`.
_Avoid_: Treating pre-1.0 versioning as permission for silent breaks

**Legacy Export**:
A public export kept for the first release even though it may be cleaned up or removed in a later deliberate change; `OwcTemplateEditorOld` is the current known example.
_Avoid_: Accidental private API, immediate release blocker

**Documentation Bar**:
The minimum documentation required before an export is acceptable in the open source release: UI exports need colocated component or demo documentation in the same change, and helper exports need a README or API note in the same change.
_Avoid_: Best-effort docs, post-release cleanup

**Release Gate**:
The validation commands that must pass from a clean checkout before publication after formatting has been applied: `npm run lint`, `npm run test`, `npm run types`, and `npm run build`.
_Avoid_: Manual spot checks as release validation

**Release Hygiene**:
The repository and published package must be free of private/internal references, secrets, private URLs, private registry assumptions, and accidental agent or scratch material in public-facing docs, metadata, or shipped files.
_Avoid_: Treating internal cleanup as post-release work

**Package Format**:
The package publishes unbundled ESM entry points from `exports/` and required source modules from `src/`, with generated declaration files in `dist-types/`.
_Avoid_: Rollup bundle for the first release

**Generated Artifact**:
A file or directory produced by the build, type, or docs pipeline, such as `dist-types/`, generated docs data, or `generated.*` files.
_Avoid_: Hand-editing generated output

**Component Directory**:
New public UI components should have their own component directory, so component source, component-specific helpers, export entry points, docs, demos, and related types are grouped by component rather than scattered across shared top-level files.
_Avoid_: Adding new public components as loose top-level files

**Colocated Test**:
A test file that lives next to the source file it verifies, using the repo's `*.test.js` or `*.test.type.ts` naming pattern.
_Avoid_: Central test directories for component-specific or helper-specific behavior

**Dependency Policy**:
Runtime libraries used by public exports should be package dependencies so installed components work out of the box; peer dependencies are exceptional and require a compatibility reason such as a shared singleton or host-controlled version.
_Avoid_: Moving runtime dependencies to peer or optional dependencies by default

**Package Name**:
The package will be published as `@open-wc/components`.
_Avoid_: `@finum/data-table`, `open-wc/components`

**Public Branding**:
The docs, examples, package description, logos, and product positioning should present the package as `@open-wc/components`, not as a Finum product.
_Avoid_: Finum-branded public docs, Finum-specific examples

**Element Prefix**:
The stable custom element tag prefix for public components is `owc-`.
_Avoid_: Renaming existing public custom elements for the first release

**Owc Symbol**:
The existing `Owc*` class, type, and file naming convention remains stable for the first release and aligns with the `owc-` custom element prefix.
_Avoid_: Renaming classes or files as part of package identity cleanup
