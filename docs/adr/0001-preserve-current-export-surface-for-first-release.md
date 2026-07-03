# Allow breaking public-surface cleanup before first release

Before the first open source release, the package may break current `exports/` entry points when doing so produces a clearer public surface and source layout. Breaking changes must be documented with migration notes so downstream internal applications can update their imports deliberately, rather than discovering removed or renamed entry points by failure.
