# Release Validation

Run these checks before publishing a new version of `@open-wc/components`:

```sh
npm run lint
npm run test
npm run types
npm run build
npm pack --dry-run
```

Also run a public hygiene scan before publication:

```sh
rg "(from|import\\() ['\\\"]@open-wc/components/(csv|excel|subListHelpers|filter|highlightSearchTerms|lit-helpers|types)\\.js" README.md docs src exports
find exports -maxdepth 3 -type f | sort
```

If the environment cannot write to the default npm cache, use a local cache for the package-content
check:

```sh
npm_config_cache=/tmp/npm-cache npm pack --dry-run
```

The package uses the `files` allowlist in `package.json`. The dry-run package contents must include
`exports/`, required runtime `src/` modules, generated declarations in `dist-types/`, public docs,
the Open Web Components logo asset, and root package metadata. It must not include `.scratch/`,
`.agents/`, `docs/agents/`, tests, local caches, private planning files, or removed loose helper
entries such as `exports/csv.js`, `exports/filter.js`, and `exports/types.ts`.

Legal/provenance note: the package metadata and license target MIT. Human maintainers still need to
confirm the final copyright holder before publication.

## Automated Releases

CI uses Node.js 24. Pull requests run lint, Node and browser tests, type generation, the documentation
build, and a package dry run. The release workflow runs the same validation on `main` before
Changesets creates a release PR or publishes.

Use `npm run changeset` for consumer-visible changes. The release PR runs `npm run version:release`
to update `package.json`, `package-lock.json`, and `CHANGELOG.md`. Review and merge that PR to publish.
Existing releases through `0.1.5` stay unchanged; CI setup alone does not need a release changeset.
The package ships unbundled ESM, and `prepack` generates its TypeScript declarations.

### One-time Maintainer Setup

- In GitHub repository settings, allow GitHub Actions to create pull requests.
- In the npm settings for `@open-wc/components`, configure a GitHub Actions trusted publisher:
  owner `open-wc`, repository `components`, workflow filename `release.yml`. Allow publishing.
  The workflow runs on `main` and does not declare a GitHub environment.
- Use a GitHub-hosted runner, Node.js 24 and npm 11.5.1 or newer. The workflow grants
  `id-token: write`; no npm publishing token is needed. Trusted publishing generates provenance
  automatically for public repositories and packages.
- After the first automated release, verify the version and provenance on npm.

See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and the
[Changesets action](https://github.com/changesets/action/tree/maintenance/v1) for setup details.

## Documentation Deployment

`.github/workflows/deploy.yml` builds and deploys `main` to Netlify, independently of npm releases.
It can also be run manually on `main` using GitHub Actions. `netlify.toml` publishes Rocket's `dist/`
output. The canonical site origin and package homepage are `https://components.open-wc.org/`.

The workflow targets Netlify site `4d7abdca-81ca-498d-be1a-96b444086ff1`. Add the GitHub repository
secret `NETLIFY_AUTH_TOKEN` using a Netlify token authorized to deploy that site. Do not commit tokens.
In Netlify, assign `components.open-wc.org` as the site's primary custom domain, configure the DNS
record Netlify provides, and verify HTTPS. Disable duplicate Netlify Git-based production builds
if GitHub Actions owns deployment.

For an authorized manual production deployment, set `NETLIFY_SITE_ID` and `NETLIFY_AUTH_TOKEN` in
your environment, then run `npm run deploy`. See the
[Netlify CLI documentation](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/).
