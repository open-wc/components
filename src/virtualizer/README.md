# Virtualizer

A private Lit controller that virtualizes vertical lists: it renders only the items in and around the visible area. The items are rendered in normal flow between two spacers, each item with the host's own markup, and the controller decides which items those are and how tall the spacers are. Because the rows stay in normal flow, the browser lays them out, so a table's rows can share CSS grid tracks.

`owc-table` uses it for every list, grouped or not, and `owc-autocomplete` for its option list. [ADR-0006](https://github.com/open-wc/components/blob/main/docs/adr/0006-own-an-in-flow-vertical-virtualizer.md) explains why it's in-house.

It's not part of the Public Surface: it has no entry in `exports/` or the `package.json` exports map, and the docs don't present it as importable. Hosts import it by relative source path.

## Usage

```js
import { LitElement, html } from 'lit';
import {
  VirtualizerController,
  spacerStyles,
  virtualizes,
} from '../virtualizer/VirtualizerController.js';

class ItemList extends LitElement {
  static properties = {
    items: { attribute: false },
    virtualizerMode: { attribute: 'virtualizer-mode' },
  };

  static styles = [spacerStyles];

  #virtualizer = new VirtualizerController(this, { estimateSize: 32 });

  constructor() {
    super();
    this.items = [];
    this.virtualizerMode = 'auto';
  }

  render() {
    const renderItem = (item, index) => html`<div class="item">${index}: ${item.label}</div>`;
    if (!virtualizes(this.virtualizerMode, this.items.length)) {
      return this.items.map(renderItem);
    }
    return this.#virtualizer.renderSlice(this.#virtualizer.slice(this.items), renderItem);
  }
}
```

The host must:

- call `slice(items)` in every render of the virtualized list, with the full list, and render what it returns with `renderSlice()`;
- render exactly one element per item in `renderItem`, with a box (no `display: contents`) and no vertical margins or gaps between the items, since the controller adds up their border-box heights;
- include `spacerStyles`, so the browser's scroll anchoring picks a visible item instead of a spacer that doesn't move with the items (see Anchoring below);
- if items can render expanded, e.g. a table row with an open detail, assign a new `expanded` function whenever an item starts or stops being expanded.

`renderSlice()` keys the items by identity, so a new range only adds and removes items at its edges, and gives the spacers the class `virtualizer-spacer`. `virtualizes(mode, count)` is the `virtualizer-mode` decision that the hosts share: `auto` virtualizes from 300 items, `always` and `never` regardless of the count.

When the host stops rendering the spacers, for example because it renders a plain list below a threshold, the controller goes idle until the spacers come back.

## API

| Member                                     | Description                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new VirtualizerController(host, options)` | `options.estimateSize`: item height in px until items are measured (default 40). `options.estimateExpansion`: px an expanded item adds until expanded items are measured (default 0). The host sets `scrollContainer` and `expanded` through their setters.                                                                               |
| `slice(items)`                             | `{ first, last, items, before, after }`: the indexes and items to render, and the spacer heights. Pure: it doesn't touch the DOM or `window`, so a server render can call it.                                                                                                                                                             |
| `renderSlice(slice, renderItem)`           | The template of a slice: the top spacer, `renderItem(item, index)` for each item in range, keyed by item, and the bottom spacer. `index` is the item's index in the full list.                                                                                                                                                            |
| `scrollContainer`                          | The element that scrolls the list (`document.scrollingElement` for the document). Setting it overrides the detection, with `document.documentElement`, `document.body` and `document.scrollingElement` standing for the document; setting `undefined` turns detection back on.                                                            |
| `expanded` (set only)                      | `(item, index) => boolean`: whether the host renders an item expanded, e.g. a table row with an open detail. Unmeasured expanded items are estimated at the typical item height plus the typical expansion. Assign a new function whenever the answer changes for any item; the next slice asks it about every item again, which is O(n). |
| `scrollToIndex(index, { block })`          | Renders the item, scrolls it into view like `scrollIntoView` (`block`: `start`, `center`, `end` or `nearest`, honoring `scroll-margin`), and resolves once the list has settled around it.                                                                                                                                                |
| `remeasure()`                              | Forgets all measured heights and measures the rendered items again, e.g. after column widths changed.                                                                                                                                                                                                                                     |

The controller requests a host update only when the range or the spacer heights change, so the host reads the range in its own update (`slice()`), and anything it derives from the range, like the table's `visibleData`, changes in that same update.

## How it works

- **First render:** without any layout, the controller assumes a visible height of 1000px and slices the items that cover it plus the buffer (the visible height, at least 200px, on each side), using the estimate. Nothing waits for a frame.
- **Scroll container ([scrollContainer.js](./scrollContainer.js)):** the first ancestor in the flat tree (assigned slots and shadow hosts) whose `overflow-y` lets it scroll and whose content actually overflows it. Boxless elements (`display: contents`) are skipped, and the search stops at `position: fixed` and top-layer elements. Otherwise the document scrolls. While the list isn't rendered yet (inside `display: none`, or an ancestor component hasn't rendered its slot), the container stays unknown and every check tries again. Detection runs again when the items change, because a container that didn't overflow before may scroll now.
- **Fast path:** passive `scroll` listeners on the scroll container and on `window`. Scroll events fire before animation frames, and Lit updates in a microtask, so new items paint in the same frame. The handler reads live geometry: the spacers' rects and the container's visible area clipped to the viewport.
- **Coverage check:** the rendered items must reach `buffer / 2` beyond both edges of the visible part of the list. Otherwise the controller renders the items that cover the visible part plus `buffer` on both sides. Viewport positions map to list offsets relative to the first rendered item, so outdated estimates above it don't shift the result. The same check runs after the first render, after the items change, when scrolling ends (`scrollend`, or a 150ms debounce where it's missing), on window resizes, and when the host or the container changes size (`ResizeObserver`).
- **Measurements ([ItemSizes.js](./ItemSizes.js)):** a `ResizeObserver` reports every rendered item's border-box height, and items it hasn't reported yet are measured during the next check. Heights are cached by item identity, so they survive sorting and filtering, and the cache is pruned to the current items. Unmeasured items are estimated at the median measured height of collapsed items, so a few tall items don't skew it. Offsets come from three Fenwick trees (measured sizes, measured count, and unmeasured expanded count), so lookups stay O(log n) at 250k items and a new median doesn't need a rebuild. Rebuilding for new items is O(n).
- **Expanded items:** the host's `expanded` function marks the items that render expanded. Unmeasured expanded items are estimated at the typical size plus the typical expansion: how much the median measured expanded item exceeds the typical size, or `estimateExpansion` until one is measured. A measurement belongs to the state it was taken in. When an item expands or collapses, its cached measurement in the new state comes back, or it is estimated, and rendered items are measured again.
- **Anchoring:** when items above the visible ones change size, the visible items stay where they are on screen. That covers a changed top spacer (a new estimate, an item expanding outside the rendered range) and a changed rendered item (measured for the first time, a detail opening, content arriving). The browser's scroll anchoring does that in most cases. The controller also remembers the first visible item, and its distance from the top of the list (the top spacer's top edge), whenever it looks at the layout. It looks in every check, and in the `ResizeObserver` callback, which runs after the layout and before the paint and also watches the top spacer. When the scroll offset is unchanged since the last look but that distance changed anyway, the browser didn't compensate, so the controller scrolls by the difference before the paint. The scrollbar stays approximate until irregular items have been seen.
- **Safety net:** an `IntersectionObserver` with the implicit root watches both spacers, and the controller observes them again after every range change so the browser reports them again. A visible spacer always triggers a correction: the controller detects the container again and checks. If the geometry still says everything is covered, it trusts the browser and covers the area the browser reports as visible. So a wrong container can't leave the list white.
- **No ResizeObserver loop errors:** corrections caused by a `ResizeObserver` callback run in the next animation frame. Rendering new items from the callback would create observations the browser can't deliver in that frame.

## Decisions

The less obvious choices, and the alternatives they were weighed against.

- **Live geometry in the scroll handler** instead of cached offsets. Layout is normally clean when scroll events fire, so reading two rects is cheap. And the result stays right when something above the list changes height without a scroll.
- **The window is always listened to**, in addition to the detected container, because page scrolling moves nested containers and changes what of them is visible.
- **"Scrolls" means the content overflows.** `overflow-x: auto` or `hidden` makes `overflow-y` compute to `auto`, so wrappers for wide tables, or the docs page's `#bg`, would otherwise be picked. They never scroll vertically, and the real scroller's events would be missed.
- **Items are keyed, and their heights cached, by identity**, not by an id such as the table's `getRowId`. `@lit-labs/virtualizer` keyed by the item too. It survives sorting and filtering, doesn't call `getRowId` for 100k rows on every data change, and can't break on duplicate or falsy ids (`getRowId` returns `undefined` for an id of `0`). The cost: data replaced by new objects is measured again.
- **Hysteresis:** the range only changes when less than half the buffer is left on a side, so slow scrolling doesn't update the host on every frame.
- **Update requests made while handling the host's `updated` phase are queued in a microtask.** That's still before the next paint, but Lit doesn't warn about an update scheduled during an update.
- **Anchoring is the browser's scroll anchoring, plus a correction for what it misses.** The alternative was manual compensation with `overflow-anchor: none` on the scroll container, which is what virtua and TanStack do. We don't own the scroll container (it's often the document), the browser's adjustments compose with flings and smooth scrolls, and they cover changes the controller never sees, such as an image loading in a row above. What the browser misses, measured in Chromium:
  - It picks its anchor from the old layout, before new items are laid out. After a jump, only a spacer or the list itself was visible there. Their top edges don't move, so the browser keeps one of them as the anchor and adjusts nothing until the next scroll, and a new estimate then moves the visible items by thousands of pixels. The spacers' `overflow-anchor: none` avoids a spacer anchor when items were visible too, e.g. when a scroll set in an animation frame lets the `IntersectionObserver` report the top spacer before the scroll event arrives.
  - The correction only acts when the scroll offset hasn't changed since the controller last looked. A changed offset means someone scrolled, or the browser compensated itself, and neither should be undone. Chromium applies its adjustment in every layout, forced ones included, and before `ResizeObserver` callbacks, so the controller always sees it.
  - It only undoes shifts from inside the list, because it measures the item from the top of the list. Content above the list growing is the browser's to handle: Chromium doesn't anchor at scroll offset 0, for example, so a filter panel opening above a table at the top of the page stays in view.
- **The open-detail estimate is learned.** The typical expansion is the median measured expanded item minus the typical size, so it follows the actual detail content. Until a detail has been measured, the table assumes 200px, about the detail's minimum height (25dvh) in a typical window.

## Hosts

- **`owc-table`:** every list, grouped or not, from the `virtualizer-mode` threshold on. Rows with an open detail are expanded items (`#openDetailPredicate()`), so rows that haven't rendered yet count with the typical detail height, and the spacers have `overflow-anchor: none`.
  - **Scroll container:** detected, unless the table's `scrollTarget` names one. Consumers need that where detection can't see the container: inside a closed shadow root (`assignedSlot` is `null` there), or a box that clips (`overflow: hidden`) and is scrolled by script. The table passes `scrollTarget` to the `scrollContainer` setter in `update()` whenever it changes, with `null` as `undefined`. A target bound in the table's first render is therefore in place before the controller first attaches, and a later one re-attaches right away.
  - **Grouped lists:** the table passes one list in which each group's header is an item followed by the group's rows ([groupedList.js](../table/groupedList.js)). A header is one element between the spacers, keyed and measured by its identity like a row: the table keeps one header object per group definition. Expanding or collapsing a group passes a new list; heights stay cached because they are keyed by item. The rendered index of an item (the table's `data-index`) is its index in that list, so it counts headers, which is what `scrollToIndex()` takes. The table's `expanded` function is asked about every item, so it answers `false` for headers before it calls `getRowId`, which throws for objects without an `id`.
  - **Inserted rows:** the table awaits `scrollToIndex(index, { block: 'nearest' })` for the new row, with the row's index in the list it renders, which resolves once the row is rendered and settled, and then focuses the row's first editable field. In a grouped table, the table first expands the new row's group if it is collapsed, so the row is part of the list.
- **`owc-autocomplete`:** its option list (`#rows`) is the explicit scroll container, so popups and table cells (`overflow: hidden`) around it don't matter. It sets it from a `ref` callback, which Lit calls while committing the render, so even the first `hostUpdated` attaches to it and nothing is detected. It renders options only while the dropdown is open, so the controller is idle while it's closed, and it keys options by their object. It keeps the active option in view with `scrollToIndex(index, { block: 'nearest' })`. Two things that any host in a popup runs into:
  - Chromium resets the scroll position of a hidden popover, while the controller still has the range of the last scroll position. Without help, the first frame after reopening shows a spacer. The autocomplete calls `scrollToIndex` in the first animation frame after opening, before that frame is painted.
  - `scrollToIndex` uses `scrollIntoView`, which scrolls every scrollable ancestor. Until the popup has positioned and sized itself (in microtasks after it opens), the option list is as tall as all its options, so the page would scroll instead. The autocomplete reveals options only once the popup has set `--auto-size-available-height`.

## Limits

- Chromium clamps element heights at about 33.5M px, and Firefox treats heights from about 17.9M px as `auto`. There's no scroll compression.
- Only vertical lists; every column of a rendered row renders.
- DOM-only state (focus, half-typed input) is lost when an item leaves the rendered range.
- Without the browser's scroll anchoring (an engine without it, or `overflow-anchor: none` on the scroll container), the controller's correction keeps the visible items in place on its own. It scrolls programmatically, which can interrupt momentum scrolling on iOS.

## Files

- [VirtualizerController.js](./VirtualizerController.js): the controller
- [ItemSizes.js](./ItemSizes.js): item heights, the typical size and expansion, and offsets (pure)
- [range.js](./range.js): which items to render, and whether they still cover the visible area (pure)
- [scrollContainer.js](./scrollContainer.js): scroll container detection
- [VirtualizerController.test-browser.js](./VirtualizerController.test-browser.js): browser tests through a minimal host (`npx web-test-runner src/virtualizer/VirtualizerController.test-browser.js`)
- [virtualList.test-browser.helpers.js](./virtualList.test-browser.helpers.js): helpers that the controller's and the table's browser tests share, e.g. to scroll, wait until the list settles, and assert that the rendered items cover the visible area. Its name keeps it out of the package and out of the test runs.
- [ItemSizes.test.js](./ItemSizes.test.js), [range.test.js](./range.test.js), [VirtualizerController.test.js](./VirtualizerController.test.js): node tests (`node --test src/virtualizer/ItemSizes.test.js src/virtualizer/range.test.js src/virtualizer/VirtualizerController.test.js`)

## Testing notes

- A failing chai equality between two DOM elements (`expect(a).to.equal(b)`) makes web-test-runner hang while it serializes them. Compare identities through a boolean instead.
- To prove the scroll handler alone updated the list, scroll from a task of its own (`await new Promise(resolve => setTimeout(resolve))`). A scroll set inside an animation frame callback lets that frame paint, and the `IntersectionObserver` correct the list, before the scroll event arrives.
- Chromium fires `scrollend` for instant programmatic scrolls, so tests can await it.
- An anchoring test passes as long as either the browser's anchoring or the controller's correction keeps the items in place. To see that a test can fail, set `overflow-anchor: none` on its scroll box and make `#keepAnchor()` return early. To test the correction alone, only set the former.
- A detached element's rect is all zeros. An item that "moved to 0" was usually removed, because the range moved away from it.
