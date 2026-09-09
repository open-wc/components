# Security Policy

## Supported Versions

Security fixes for `@open-wc/components` target the latest published `0.1.x` release and the
`main` branch unless a release note says otherwise.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately through
[GitHub Security Advisories](https://github.com/open-wc/components/security/advisories/new).

If GitHub advisories are unavailable, contact the maintainers through the Modern Web Discord and
request a private security contact. Do not open a public issue for an active vulnerability.

## Release Security

The release workflow is designed to publish `@open-wc/components` from GitHub Actions using npm
trusted publishing and provenance. Maintainers must configure the package's trusted publisher
before the workflow can publish; see [Release Validation](./docs/release-validation.md).

Keep the public `repository.url` aligned with `open-wc/components`. Review dependency changes and
package contents before release, and require two-factor authentication for maintainer accounts.
