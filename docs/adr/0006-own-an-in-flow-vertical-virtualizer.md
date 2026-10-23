# Own an in-flow vertical virtualizer instead of adopting a library

The table and autocomplete replace `@lit-labs/virtualizer` with a private, in-house Lit controller rather than another virtualization library. Two to three libraries, TanStack included, were tried in this integration, and none beat lit-labs on the problems that mattered: the table staying blank after scrolling, wrong total height, and wrong column widths. The controller renders rows in normal flow between two spacers, so the browser lays out the rows and sizes the table's CSS grid columns. Absolutely positioned library rows cannot take part in grid track sizing. The controller finds the scroll container automatically through slots and shadow roots, and relies on the browser to report visible empty space, so a wrong guess corrects itself instead of leaving the table blank.

## Considered Options

- **TanStack Virtual** (Lit adapter or core with our own controller): tried on `origin/feat/virtualizer-replacement` and never worked better than lit-labs. It positions rows absolutely, and its Lit adapter has open bugs around option updates and dynamic sizes.
- **Waiting for or patching lit-labs**: no release since 2.1.1. The fixes for blank rendering and `display: contents` slots sit in an unmerged draft PR, and the in-repo patch never reached package consumers.
- **virtua**: no Lit adapter; its framework-agnostic core is explicitly unstable.
