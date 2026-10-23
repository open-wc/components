---
'@open-wc/components': patch
---

`owc-table`: inserting a row with the **New** button (`handleInsert`) now scrolls to the new row and focuses its first editable field in large virtualized tables too. Before, nothing happened when the new row wasn't rendered, for example in a table of 100,000 rows scrolled to the top. This includes grouped tables, where a collapsed group expands to show its new row.

- The table no longer waits a fixed 100ms before it scrolls and focuses. It waits until the new row is rendered.
- The whole new row is scrolled into view, and only when it isn't fully visible yet. This works in whatever element scrolls the table, such as a scroll box of your own; before, only the browser window was checked.
- Focus goes to the first editable field of the new row. Before, it went to the first editable field anywhere in the table, so a second insert focused the earlier insert row again.
