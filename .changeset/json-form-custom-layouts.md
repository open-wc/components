---
'@open-wc/components': patch
---

Add a `layouts` property to JsonForm for caller-supplied layout components, registered through scoped elements and selected by `uiSchema.type`. Forward registrations through built-in layouts and register their child forms in the correct scope. Export `LayoutDefinition` and `LayoutRecord` types.
