---
'@open-wc/components': patch
---

Add the public `OwcDoughnutChart` class, `owc-doughnut-chart` define entry and category/activation
types. Render prepared categories with supplied amounts and colors and emit category IDs from
native slice actions. Automatically load the HTML-in-Canvas polyfill when native support is absent,
and hide component output if rendering fails. Provide center, heading and caption markup through
slots, with selectable center text and outer amount labels inside the drawable chart. Validate
empty, known-zero and unavailable data; preserve category focus through updates; and fit exact
labels, leader lines and optional icons to the available space. Isolate instance lifecycles and
failures. Include generic inline and standalone demos for chart data, icons and angle animation.
Draw colored sectors directly with Canvas 2D paths while retaining matching native HTML controls,
and reposition outer amounts clear of curved edges as their slice angles change.
Ease changes to existing category values automatically over 400 ms, including icons, labels and
hit areas. Retarget interrupted transitions from their current position, respect reduced motion,
and apply initial, structural, empty and all-zero updates immediately. Supplied formatted amounts
and center content remain consumer-owned and update immediately.
Remove the preview's numeric `total` property: slice proportions now use each category's value
divided by the sum of category values. Remove `total` property bindings and attributes when
migrating; raw values need no conversion. Keep any formatted total in the consumer-owned center
slot, and validate independently expected totals in the consumer.
Remove the preview-only `examples/doughnut-chart.js` entry and its domain-specific financial
template factories. Consumers should import `define/owc-doughnut-chart.js` and compose the chart
with their own categories and markup instead.
