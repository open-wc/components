# Preserve current export surface for first release

For the first open source release, every current file under `exports/` remains part of the package public surface. This favors compatibility and a lower-risk initial publication over aggressively trimming uncertain modules before release; later deprecations or removals should be handled deliberately rather than by accidental cleanup.
