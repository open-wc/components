---
'@open-wc/components': patch
---

In large `owc-table` tables (from 300 Data Rows in `virtualizer-mode="auto"`, or with `virtualizer-mode="always"`), the rows you are looking at stay where they are on screen when rows above them change height.

- Fix rows jumping while you scroll up through rows that are taller than the others, such as rows with annotations or cells with several lines, and after jumping to another part of the table when the table learns how tall its rows really are.
- Fix rows jumping when a detail above them opens or closes, or when detail content above them arrives asynchronously.
- Rows with an open detail that haven't been shown yet, for example ones opened through `openDetails`, now count with the typical detail height, so the scrollbar is closer to the real height of the table.

Opening a detail still scrolls it into view, `detail` mode still renders the closed details of all rendered rows so the browser's find in page sees them, and open details stay open when their rows scroll out of view and back.

The 100,000-row benchmarks in the table docs can now render details (`detail` or `detailDeferred`) and annotations, and their scripted run reports frames in which the rows jumped.
