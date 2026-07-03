# Release Validation

Run these checks before publishing `@open-wc/components@0.1.0`:

```sh
npm run lint
npm run test
npm run types
npm run build
npm pack --dry-run
```

If the environment cannot write to the default npm cache, use a local cache for the package-content
check:

```sh
npm_config_cache=/tmp/npm-cache npm pack --dry-run
```

The package uses the `files` allowlist in `package.json`. The dry-run package contents must include
`exports/`, required runtime `src/` modules, generated declarations in `dist-types/`, public docs,
the Open Web Components logo asset, and root package metadata. It must not include `.scratch/`,
`.agents/`, `docs/agents/`, tests, local caches, or private planning files.

Legal/provenance note: the package metadata and license target MIT. Human maintainers still need to
confirm the final copyright holder before publication.
