---
'@open-wc/components': patch
---

Dependencies:

- `@awesome.me/webawesome` now requires `^3.14.0` (was `^3.11.0`).
- `@cfworker/json-schema` now requires `^4.1.6` (was `^4.1.1`).

Fixes:

- Elements built on the `waves` reactive base no longer throw `issueWarning is not a function` when they hit a development warning, for example a reactive property declared without a getter. The warning is now logged once per kind with `console.warn`.
