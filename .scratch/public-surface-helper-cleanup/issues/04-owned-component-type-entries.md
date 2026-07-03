Status: completed

# Split aggregate component type exports into owned component/type entries

## What to build

Replace the vague aggregate type Public Surface with owned component and helper-family type entries. Consumers should import types from the component or helper family that owns them, rather than from a single unrelated aggregate type entry. Remove the aggregate type entry instead of leaving a compatibility stub.

## Acceptance criteria

- [x] The old aggregate type public entry is removed from the package entry files and package content assumptions.
- [x] Public component-specific types are available from owned component or helper-family public package paths.
- [x] Type imports match the component or helper family they describe.
- [x] Existing type-test patterns or TypeScript build coverage verify the new public type entry points.
- [x] The change does not rename `Owc*` component symbols, custom element tags, or top-level UI component imports.

## Blocked by

None - can start immediately
