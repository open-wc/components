# Changesets

Run `npm run changeset` for consumer-visible changes to `@open-wc/components`.
Choose the release type and describe the change for package users, including any migration steps.

CI creates a release pull request with version, lockfile, and changelog updates. Merging it publishes
the new version after validation. Keep the existing `0.1.0`–`0.1.5` changelog entries intact.

Changes limited to CI or documentation do not require a version bump. Use
`npm run changeset -- --empty` when a changeset status check needs an explicit no-release marker.

See [Contributing](../CONTRIBUTING.md) and [Release Validation](../docs/release-validation.md).
