---
'@open-wc/components': patch
---

Fix JSON form required-field errors appearing on unrelated controls whose names share a prefix, such as `salutation` and `salutationType`. Errors still apply to descendants of a missing required object.
