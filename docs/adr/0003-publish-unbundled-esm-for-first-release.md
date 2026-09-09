# Publish unbundled ESM for first release

The first open source release will publish unbundled ESM modules rather than introducing a Rollup build. This matches the current `exports/` and `src/` structure, leaves dependency optimization to consuming applications, and avoids adding a new packaging architecture immediately before publication.
