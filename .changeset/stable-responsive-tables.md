---
'@open-wc/components': patch
---

Keep full-width tables stable during container resizing by reusing natural column measurements and preserving the rendered width during remeasurement. Contain horizontal overflow and prevent the loading spinner from causing vertical and/or horizontal scrollbar flicker.

Make data details fill their container with shrinkable grid columns so expanded tables remain within the available width.
