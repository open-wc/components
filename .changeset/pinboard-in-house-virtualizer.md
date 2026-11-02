---
'@open-wc/components': minor
---

`owc-pinboard` renders its columns through the package's in-house virtualizer instead of `@lit-labs/virtualizer`, like `owc-table` and `owc-autocomplete`. A column or dropzone list with 300 cards or more renders only the cards in and around its visible part. Smaller lists render every card, so the browser's find-in-page finds them. The new `virtualizer-mode` attribute (`virtualizerMode`) works like the table's: `auto` (default) from 300 cards on, `always`, or `never`.

Migration:

- `keyFunction` is removed. Cards are keyed by their object, like the table's rows and the autocomplete's options. Setting it does nothing anymore.
- A column is sorted again when its array or the `sorter` changes, not on every render. If a change to a card affects its sort position, assign a new array, e.g. `board.data = [...board.data]` with the column's array copied, or a new `sorter`.

Dependencies:

- `@lit-labs/virtualizer` is no longer a dependency. No component uses it anymore.
