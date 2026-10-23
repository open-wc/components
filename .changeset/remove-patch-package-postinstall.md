---
'@open-wc/components': patch
---

Installing `@open-wc/components` no longer runs an install script. Earlier versions had a `postinstall` script that ran `patch-package`, which the package doesn't depend on, so `npm install` failed with `patch-package: command not found` unless your project had `patch-package` itself. Where it did run, it had nothing to apply, because the patch it was written for was never part of the published package.

Dependencies:

- `patch-package` is no longer a dev dependency, and the repository's patch for `@lit-labs/virtualizer` is deleted. `owc-table` and `owc-autocomplete` render through the package's in-house virtualizer now, so no component needs the patched behavior.
- `@lit-labs/virtualizer` stays a runtime dependency, unpatched, because `owc-pinboard` still virtualizes its columns with it. It is removed once the pinboard moves to the in-house virtualizer.

Migration: workarounds for the failing install, such as `--ignore-scripts` or a `patch-package` dependency added only for this package, can be removed.
