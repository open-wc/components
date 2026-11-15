# 14: Action tabs say which tab is open

Status: needs-triage

**What to build:** the tab buttons of the table's info block (`owc-tabs` inside `owc-table-info`) tell assistive technology whether their panel is open, and where it is. Today they work with Tab, Enter and Space (11's smoke test), but nothing but the button's color says which one is open. Not part of the launch gate (C4).

Spec: [Scope](../spec.md#scope), [C4](../spec.md#checks).

**Blocked by:** None.

- Every tab is a `wa-button` without state. A second press closes the open tab, so they behave like disclosure buttons (one open at a time), not like an ARIA `tablist`.
- The panels are `wa-details` with their summary hidden; the region inside has no name (see the `landmark-unique` entry in `src/a11y/axe.test-browser.helpers.js`).
- Opening a tab leaves the focus on its button; the panel comes after all tab buttons in the Tab order.

- [ ] Each tab button has `aria-expanded` (or the pattern chosen instead, recorded in the ticket), and `owc-tabs` keeps it right when `active` changes from outside.
- [ ] The open panel is reachable right after its button, or the docs say how to get there.
- [ ] A browser test with real keys checks the state; axe passes with a tab open.

## Comments
