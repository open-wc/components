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
The package exports and documented entry points that consumers are allowed to import and rely on after release.
_Avoid_: Internal file tree, implementation modules

**Legacy Export**:
A public export kept for the first release even though it may be cleaned up or removed in a later deliberate change; `OwcTemplateEditorOld` is the current known example.
_Avoid_: Accidental private API, immediate release blocker

**Documentation Bar**:
The minimum documentation required before an export is acceptable in the open source release: UI exports need component or demo documentation, and helper exports need a README or API note.
_Avoid_: Best-effort docs, post-release cleanup

**Release Gate**:
The validation commands that must pass from a clean checkout before publication: `npm run lint`, `npm run test`, `npm run types`, and `npm run build`.
_Avoid_: Manual spot checks as release validation

**Release Hygiene**:
The repository and published package must be free of private/internal references, secrets, private URLs, private registry assumptions, and accidental agent or scratch material in public-facing docs, metadata, or shipped files.
_Avoid_: Treating internal cleanup as post-release work

**Package Format**:
The package publishes unbundled ESM entry points from `exports/` and required source modules from `src/`, with generated declaration files in `dist-types/`.
_Avoid_: Rollup bundle for the first release

**Component Directory**:
Each public component should have its own matching directory under `src/` and `exports/`, so component source, export entry points, docs, and related types are grouped by component rather than scattered across shared top-level files.
_Avoid_: Adding new public components as loose top-level files

**Dependency Policy**:
Runtime libraries used by current public exports remain package dependencies for the first release so installed components work out of the box.
_Avoid_: Moving runtime dependencies to peer or optional dependencies before the first release

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
