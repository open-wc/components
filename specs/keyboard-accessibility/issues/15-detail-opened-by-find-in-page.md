# 15: A detail that find-in-page opens joins the grid

Status: needs-triage

**What to build:** when the browser's find-in-page opens a closed detail of the table, the detail becomes a row of the grid like one opened through `openDetails`. Found in 05, made more visible by 11.

Spec: [K8](../spec.md#table-keyboard).

**Blocked by:** None.

- In `detail` mode, every rendered row renders its closed `wa-details` with its content, so find-in-page finds the text. Chromium opens a closed `<details>` it finds text in, and `wa-details` follows (its `MutationObserver` on `open`), but the table's `openDetails` doesn't know.
- So the detail shows, but isn't a row of the grid (no `role="row"`, the arrow keys don't reach it), and since 11 the closed detail row is `aria-hidden`, so assistive technology doesn't see its content either.
- 05 didn't sync `openDetails` from `wa-show`, because that would change which details stay open (a toggle in `detail` mode keeps one detail open, `openDetails = [rowId]`).

- [ ] A detail opened by find-in-page is in `openDetails` (added, without closing the others), is a row of the grid and not `aria-hidden`; decide whether the table fires anything for it.
- [ ] A browser test opens the native `<details>` the way find-in-page does (setting `open` on it) and checks the row.

## Comments
