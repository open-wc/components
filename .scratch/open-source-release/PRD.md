# Open Source Release Cleanup

## Goal

Prepare this component library for a first public npm release as `@open-wc/components` version `0.1.0`.

## Decisions

- Publish as `@open-wc/components`.
- Target initial version `0.1.0`.
- Use MIT as the license target.
- Keep all current `exports/` entry points public for the first release.
- Keep `owc-` custom element tags and `Owc*` class/type/file names.
- Publish unbundled ESM; do not introduce Rollup for the first release.
- Keep current runtime libraries as dependencies so exported components work out of the box.
- Remove Finum public branding from docs, examples, package description, and product positioning.
- Handle legal ownership/copyright metadata separately from public branding.
- Require every public export to have documentation before release.
- Require every public component to live in its own matching `src/` and `exports/` directory.
- Document the repo-wide commit message guideline in the public contribution docs.
- Gate release on `npm run lint`, `npm run test`, `npm run types`, `npm run build`, package-content review, and public hygiene scan.

## Issue Plan

1. Update package identity and release metadata.
2. Add license, README, changelog, and contribution baseline.
3. Rebrand public documentation and examples.
4. Define published package contents for unbundled ESM.
5. Audit public exports, component directory layout, and documentation coverage.
6. Run release hygiene and validation gates.
