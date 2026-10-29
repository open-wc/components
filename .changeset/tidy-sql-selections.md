---
'@open-wc/components': patch
---

Fix SQL conversion of multi-select filter values to match the in-memory filter's any-choice behavior. Preserve negation, empty selections, nested groups, and native array operands for `some` and `every`.
