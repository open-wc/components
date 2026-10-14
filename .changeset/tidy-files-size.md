---
'@open-wc/components': patch
---

Add an optional `maxFileSize` byte limit to `OwcFileUpload`. Oversized selections show localized inline errors and emit `files-rejected`, while accepted files and existing selections are preserved.
