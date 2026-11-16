# a11y (private)

Helpers for composite widgets with a roving focus: the grid of `owc-table`, and the board of `owc-pinboard`. They are not part of the Public Surface: there is no entry in `exports/`, and components import them by relative source path.

## `LiveRegionController.js`

A Lit controller that owns one visually hidden, polite live region (`role="status"`) in its host's shadow root, for status messages (WCAG 4.1.3).

```js
#liveRegion = new LiveRegionController(this);

this.#liveRegion.announce(this.#localize.term('tableInteractionHint'));
```

- The region is a child of the shadow root, next to what the host renders, from the host's first update on: screen readers only watch live regions they already know. It is never inside a virtualized list, where it would count as an item.
- It is absolutely positioned in the top left corner of its containing block, 1px large and clipped. Left at its place in the flow, where the host's content ends, it would not scroll with that content inside a scroll box that isn't positioned (like the content area of `owc-layout-sidebar`), but make the page as tall as the content; in a 100k-row table that showed as a jump while scrolling. `position: fixed` avoids that too, but cost that table 10ms of its first paint.
- `announce(message)` empties the region and sets the text 50ms later (`delay`). A repeated message is read again that way, and of several messages in a row only the last one is read.
- Messages are strings the host has localized.

## `controls.js`

What a widget needs to know about the controls inside its containers (the cells of a grid, the cards of a board). A **control** is a natively focusable element (`a[href]`, `button`, `input`, `select`, `textarea`, `[tabindex]`, `[contenteditable]`), or a custom element that is focusable itself or has one of these in its open shadow tree, at any depth. Closed shadow roots can't be looked into.

- `keepOutOfTabOrder(root, content)`: call it after every render. It puts `tabindex="-1"` on native controls and custom elements inside the elements `content` selects, through open shadow roots and assigned slots, so the widget stays one Tab stop. Chromium skips the whole shadow tree of a host with `tabindex="-1"`, with or without delegated focus. Light children are also handled before a host has rendered its slots. It only changes attributes on elements it hasn't handled, or that made themselves a Tab stop again.
- `controlsIn(container, { transparent })`: the controls in a container, decided from what is rendered right now. It uses the same composed-tree traversal as `keepOutOfTabOrder`, including nested slots, in rendered order without duplicates. A custom widget counts once; its internal and slotted focus targets are expanded by `tabStopsOf`. A wrapper with only slots stays transparent. `transparent` explicitly excludes a custom element's own controls, like the table's header cell with its sort button, while exposing its slotted content.
- `isSimpleControl(control)`: links, buttons and checkboxes (native ones, `wa-button`, `owc-icon-button`, `wa-checkbox`) and `owc-click-editable-*` only use Enter and Space, so arrow keys can move the roving focus on while they have the focus. Everything else may use arrow keys itself.
- `focusTargetOf(container, options)`: the container's control if it has exactly one simple control, else the container.
- `tabStopsOf(control)` and `focusControl(control, options)`: the interaction targets in a control, through open shadow roots and assigned slots, for cycling through controls in interaction mode and focusing the first of them. They don't rely on a host's `focus()`.
- `handleInteractionKey(event, container, options)`: the keys of interaction mode, for a keydown from a control in a container: Tab and Shift+Tab cycle through the Tab stops of the container's controls, Escape returns the focus to the container, and every other key is left to the controls. It returns whether the key was one of them. The table calls it for a cell, the pinboard for a card (unless the card's Move to… menu is open).
- `deepActiveElement()`: the focused element, through shadow roots.

The helper remembers the original `tabindex` values it changes. Interaction mode can still focus these elements programmatically, while respecting negative `tabindex` values a custom widget set itself. An added `tabindex` doesn't turn a wrapper into a control. Unassigned light children and replaced slot fallback aren't interaction targets.

## `keys.js`

`keyName(event)`: the name of a pressed key with its modifiers, like `ArrowDown`, `Shift+Tab` or `Control+Home`, for widgets that look their keys up by name. The Command key counts as Control, and the space bar is `Space`. The table and the pinboard use it.

## `visuallyHidden.js`

`visuallyHidden`: the declarations that hide an element visually but keep it for assistive technology, as a Lit `css` result to put inside a rule (`.named-by-column::part(label) { ${visuallyHidden} }`). The components use it for labels that name a form control which something else on screen labels already, and for names that only assistive technology reads.

## `axe.test-browser.helpers.js`

`expectAccessible(element)` for browser tests: axe over the element, like
`expect(element).to.be.accessible()`, but with a list of accepted findings
(`ACCEPTED_FINDINGS`), each with its reason. A rule on that list is ignored only for the
findings its `accepts` check describes; anything else it reports still fails the test.
Two are Web Awesome's markup, not ours: `landmark-unique` for the unnamed regions of open
`wa-details`, and `label-title-only` for a `wa-select` with a visually hidden `label`.
One is a decision about ours: `aria-required-children` for the controls in an annotation
of `owc-table`, which are in the grid but in no row (see the
[table's README](../table/README.md)). It is accepted only when every child axe reports
is in an annotation.
Add to it only for markup the components can't change, and fix everything else: axe
can't read the name of a `wa-checkbox` (its content is slotted into the `<label>` of
its shadow tree), so a header cell that holds one is named by text of its own, as the
table's selector column is ("Selection").

## Tests

`npx web-test-runner 'src/a11y/*.test-browser.js'` and `node --test src/a11y/keys.test.js`. The Tab order tests press real keys.
