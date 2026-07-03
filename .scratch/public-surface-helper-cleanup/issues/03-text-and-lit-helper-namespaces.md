Status: completed

# Move generic text and Lit helpers into owned helper namespaces

## What to build

Move non-table helper exports into owned public namespaces. Generic search highlighting should be exposed through a text-owned package path, and Lit template stringification should be exposed through a Lit-owned package path. Remove the old loose helper entries rather than leaving compatibility stubs.

## Acceptance criteria

- [x] Package consumers can import search highlighting from a text-owned public package path.
- [x] Package consumers can import Lit template stringification from a Lit-owned public package path.
- [x] The old loose search-highlight and Lit helper public paths are removed from the package entry files and package content assumptions.
- [x] Existing search highlight and Lit helper behavior tests continue to pass.
- [x] No new catch-all helper namespace is introduced.

## Blocked by

None - can start immediately
