Status: ready-for-agent

## What to build

Audit every current public export and ensure each has the minimum documentation and component directory layout required for the first release while preserving the existing export surface.

## Acceptance criteria

- [ ] Every file under `exports/` is accounted for in a documentation coverage audit.
- [ ] Every public component is accounted for in a layout audit against the requirement that each component has its own matching `src/` and `exports/` directory.
- [ ] Components that do not yet satisfy the directory requirement are listed with concrete move/refactor follow-up work.
- [ ] UI exports have component or demo documentation.
- [ ] Helper/module exports have a README/API note or equivalent documentation.
- [ ] Legacy exports kept for now, including `OwcTemplateEditorOld` if applicable, are clearly identified rather than silently removed.
- [ ] Missing documentation is either added or captured as a concrete follow-up blocker before release.

## Blocked by

- 03-rebrand-public-docs-and-examples
