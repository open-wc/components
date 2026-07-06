Status: ready-for-agent

# Public UI Documentation Bar Completion

## Problem Statement

The package is preparing for an Open Source Release as `@open-wc/components`, but several public UI exports still rely on the central public export audit as their only Documentation Bar evidence. Consumers need full public documentation in the owning modules, not a note in an audit table that says documentation should be added later.

This weakens the Public Surface because the documented entry points, examples, public properties, slots, events, and usage constraints are not discoverable from the module that owns the UI behavior. It also makes the audit carry documentation responsibility instead of acting as an index of documentation coverage.

## Solution

Add full colocated Rocket documentation for the public UI exports that currently rely on the public export audit as documentation evidence. The docs should follow the existing docs pattern in the repository and document the existing public surface as-is.

The new pages should cover public imports, custom-element registration, realistic usage, public properties and option shapes, slots, events, methods where applicable, and consumer-visible behavior or constraints. After those pages exist, update the public export audit so it points at the owning-module docs and no longer treats the audit itself as documentation for these UI entries.

This PRD does not redesign confusing component interfaces. Confusing public surface should be documented as current behavior and captured as follow-up notes, not silently changed.

## User Stories

1. As a package consumer, I want a documentation page for each public UI export, so that I can learn the component without reading source code.
2. As a package consumer, I want docs to use package public import paths, so that examples match how I will consume the package.
3. As a package consumer, I want each custom element to show its `define` entry, so that I can register the element correctly.
4. As a package consumer, I want a basic working example for every documented UI export, so that I can copy the smallest useful setup.
5. As a package consumer, I want realistic examples for more complex UI exports, so that I can understand expected usage beyond a smoke test.
6. As a package consumer, I want public properties documented, so that I know which values I can set.
7. As a package consumer, I want option objects documented, so that nested configuration shapes are clear.
8. As a package consumer, I want slots documented, so that I know where projected content belongs.
9. As a package consumer, I want events documented, so that I know how to react to component behavior.
10. As a package consumer, I want public methods documented where they exist, so that imperative interactions are discoverable.
11. As a package consumer, I want chart documentation to explain the existing chart data and options, so that I can render chart and pie chart examples correctly.
12. As a package consumer, I want layout sidebar documentation to explain menu item structure and content placement, so that navigation layouts are predictable.
13. As a package consumer, I want loading screen documentation to explain the public loading behavior, so that I can use it in application states.
14. As a package consumer, I want separator documentation to explain the public visual behavior, so that I can use it without guessing.
15. As a package consumer, I want table mass edit documentation to explain the public interaction model, so that bulk editing behavior is understandable.
16. As a package consumer, I want current behavior documented honestly, so that odd option names or constraints are visible rather than hidden.
17. As a docs reader, I want the component index to link to every new page, so that the docs are reachable from normal site navigation.
18. As a docs reader, I want docs pages to follow the existing Rocket style, so that the documentation feels consistent across modules.
19. As a package maintainer, I want Documentation Bar evidence to live in owning modules, so that documentation has locality.
20. As a package maintainer, I want the public export audit to point to owning-module docs, so that the audit is an index rather than the source of documentation.
21. As a package maintainer, I want no public interface redesign in this documentation pass, so that docs work does not become a component refactor.
22. As a package maintainer, I want confusing public surfaces captured as follow-up notes, so that future cleanup can be planned deliberately.
23. As a package maintainer, I want no changelog entry for documentation coverage alone, so that the changelog remains focused on Consumer-Visible Changes.
24. As a package maintainer, I want validation to prove docs build with public imports, so that broken examples do not land.
25. As a package maintainer, I want implementation tests only when behavior changes, so that docs-only work does not add irrelevant test churn.
26. As a release agent, I want the public export audit to stop listing "This audit" as documentation for these UI exports, so that release readiness is clearer.
27. As a release agent, I want Release Hygiene preserved, so that public docs do not introduce private source imports, private references, or stale branding.
28. As a future contributor, I want the owning module to contain source, types where present, and docs, so that the Component Directory rule is easy to follow.
29. As a future contributor, I want examples to use only the Public Surface, so that docs do not teach private file-tree imports.
30. As a future issue author, I want helper documentation left for a second pass, so that this PRD stays focused on public UI docs.

## Implementation Decisions

- Target the public UI exports that currently rely on the public export audit as their documentation evidence.
- The target UI exports are the chart element, pie chart element, layout sidebar, loading screen, separator, and table mass edit modules.
- Add or complete colocated Rocket docs in each owning module.
- Follow the repository's existing Rocket documentation pattern rather than inventing a new docs format.
- Write full documentation, not minimal smoke-test pages.
- Full documentation includes public import paths, `define` entries, basic and realistic demos, public properties, option shapes, slots, events, public methods where applicable, and relevant consumer-visible constraints.
- Document the existing public surface as-is.
- Do not rename, reshape, or redesign component interfaces as part of this documentation PRD.
- Capture confusing current behavior as follow-up notes when needed.
- Public docs and examples must use package export paths and `define` entries, not private source-file imports.
- Ensure each new page is reachable from the docs site's component index or equivalent existing navigation mechanism.
- Update the public export audit so each target UI export points to its owning-module docs.
- The public export audit should act as an index of documentation coverage, not as the documentation source.
- Do not add a changelog entry for this PRD by default.
- Add a changelog entry only if implementation later changes public imports, public behavior, or another Consumer-Visible Change.
- Do not add an ADR for this work because it applies existing Documentation Bar and Component Directory decisions.
- Keep helper export documentation out of this PRD; it belongs to a second pass.
- Leave unrelated generated artifacts alone and do not hand-edit generated output.

## Testing Decisions

- Highest seam: the docs site should build with the new public documentation pages and public imports.
- Documentation reachability seam: each documented UI export should be reachable through the existing docs-site navigation or component index.
- Public Surface seam: examples should import from package public paths and `define` entries.
- Good validation checks external documentation behavior: pages build, examples resolve, and navigation exposes the pages.
- Do not test private file layout or implementation details to prove documentation coverage.
- Run `npm run lint` for formatting and static validation.
- Run `npm run build` to prove the Rocket docs site builds with the new pages.
- Run `npm run test` only if implementation code changes.
- If implementation behavior changes unexpectedly during documentation work, add or update focused tests at the public component seam before relying on full validation.
- Existing Rocket docs throughout the repository are prior art for docs structure and demos.
- Existing public import guidance in the contributor docs is prior art for example import style.

## Out of Scope

- Replacing wildcard package exports.
- Creating a Public Surface manifest or new release gate.
- Redesigning component interfaces.
- Renaming public properties, options, classes, files, or custom element tags.
- Changing chart locale defaults, chart option names, or data shapes.
- Changing layout sidebar menu item behavior.
- Changing loading screen, separator, or table mass edit behavior.
- Adding helper README/API notes for public helper exports.
- Splitting this PRD into implementation issues.
- Adding a changelog entry for docs-only coverage.
- Adding an ADR.
- Performing screenshot or visual-regression verification as a required PRD acceptance step.
- Editing generated artifacts by hand.

## Further Notes

- This PRD came from the architecture review candidate "Move Documentation Bar into owning modules."
- The user explicitly rejected the broader "Deepen the Public Surface gate" proposal.
- The agreed second-pass helper documentation handoff is stored at `/tmp/documentation-bar-second-pass-handoff-20260703-180058.md`.
- The architecture report that led to this PRD is stored at `/tmp/architecture-review-20260703-174807.html`.
- After this PRD, the domain glossary should clarify that Documentation Bar evidence belongs in owning modules and that the public export audit is an index.
