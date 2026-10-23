import { css, html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { ItemSizes, stateOf } from './ItemSizes.js';
import { covers, rangeFor } from './range.js';
import { findScrollContainer, isDocumentScroller } from './scrollContainer.js';

/** Visible height assumed before anything has been laid out, e.g. in the first render. */
const ASSUMED_VISIBLE_HEIGHT = 1000;

/** The smallest buffer rendered beyond each side of the visible area, in px. */
const MIN_BUFFER = 200;

/** From this many items on, a host in `auto` mode virtualizes its list. */
const AUTO_THRESHOLD = 300;

/** @typedef {import('lit').ReactiveController} ReactiveController */

/**
 * A host's `virtualizer-mode`: `auto` virtualizes from 300 items on, `always`
 * and `never` regardless of the number of items.
 *
 * @typedef {'always' | 'never' | 'auto'} VirtualizerMode
 */

/**
 * Whether a host renders its list through the virtualizer, or every item
 * plainly, which keeps find-in-page and printing working for short lists.
 *
 * @param {VirtualizerMode} mode
 * @param {number} count the number of items that count toward the threshold
 */
export function virtualizes(mode, count) {
  return mode === 'always' || (mode === 'auto' && count >= AUTO_THRESHOLD);
}

/**
 * Styles for the spacers that `renderSlice()` renders. The browser's scroll
 * anchoring then keeps the visible items in place by anchoring to them, never
 * to a spacer, which doesn't move with the items.
 */
export const spacerStyles = css`
  .virtualizer-spacer {
    overflow-anchor: none;
  }
`;

/**
 * @typedef {object} VirtualizerOptions
 * @property {number} [estimateSize] height of an item in px until items have been measured (default 40)
 * @property {number} [estimateExpansion] px an expanded item adds to `estimateSize` until expanded items have been measured (default 0)
 */

/**
 * The measured heights of an item, in each state it was measured in.
 *
 * @typedef {Partial<Record<import('./ItemSizes.js').ItemState, number>>} Measured
 */

/**
 * @template T
 * @typedef {object} VirtualSlice
 * @property {number} first index of the first item to render
 * @property {number} last index of the last item to render; `first - 1` when there is none
 * @property {T[]} items the items to render, `items.slice(first, last + 1)`
 * @property {number} before height of the top spacer in px
 * @property {number} after height of the bottom spacer in px
 */

/**
 * Virtualizes a vertical list that the host renders in normal flow between two
 * spacers. The controller decides which items to render and how tall the
 * spacers are; the host renders each item with its own markup. See README.md.
 *
 * @template T
 * @implements {ReactiveController}
 */
export class VirtualizerController {
  /** @type {import('lit').ReactiveElement} */
  #host;

  /** @type {Element | undefined} */
  #explicitContainer;

  /** @type {((item: T, index: number) => boolean) | undefined} */
  #expanded;

  /** Whether `expanded` changed since the last slice. */
  #expandedChanged = false;

  /** @type {readonly T[]} */
  #items = [];

  #sizes;

  /** @type {Map<T, Measured>} measured heights by item identity */
  #measurements = new Map();

  /** The range the next render shows. */
  #range = { first: 0, last: -1 };

  /** @type {{ first: number, last: number } | undefined} the range of the last render */
  #rendered;

  /**
   * The first visible item when the controller last looked: its distance from
   * the top of the list, and the scroll container's offset at that time.
   *
   * @type {{ element: Element, offset: number, scrollOffset: number } | undefined}
   */
  #anchor;

  /** @type {{ first: number, last: number, before: number, after: number } | undefined} */
  #lastSlice;

  /** @type {{ top: number, bottom: number } | undefined} the visible part of the list in list coordinates */
  #viewport;

  /** @type {Element | undefined} */
  #topSpacer;

  /** @type {Element | undefined} */
  #bottomSpacer;

  /** @type {Map<Element, number>} rendered item elements and their indexes */
  #rows = new Map();

  /** @type {WeakSet<Element>} rendered item elements whose height is known */
  #measuredRows = new WeakSet();

  /** @type {Element | undefined} the top spacer the row ResizeObserver watches */
  #observedTopSpacer;

  #connected = false;

  #active = false;

  /** Whether the next host update verifies that the visible area is covered. */
  #checkAfterUpdate = true;

  /** Whether the next host update detects the scroll container again. */
  #detectAfterUpdate = false;

  /** @type {Element | Document | undefined} the explicit or detected scroll container; undefined while unknown */
  #container;

  /** @type {EventTarget[]} */
  #scrollTargets = [];

  /** @type {ResizeObserver | undefined} */
  #rowObserver;

  /** @type {ResizeObserver | undefined} */
  #sizeObserver;

  /** @type {IntersectionObserver | undefined} */
  #spacerObserver;

  #frame = 0;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #scrollEndTimer;

  /** Counts changes, so waiting code can tell when things have settled. */
  #activity = 0;

  /** Whether the controller is handling the host's `updated` phase. */
  #inHostUpdated = false;

  /** Tells the controller about the top spacer element that `renderSlice()` renders. */
  #topSpacerRef = ref(element => this.#setSpacer('top', element));

  /** Tells the controller about the bottom spacer element that `renderSlice()` renders. */
  #bottomSpacerRef = ref(element => this.#setSpacer('bottom', element));

  /**
   * @param {import('lit').ReactiveElement} host
   * @param {VirtualizerOptions} [options]
   */
  constructor(host, { estimateSize = 40, estimateExpansion = 0 } = {}) {
    this.#host = host;
    this.#sizes = new ItemSizes(0, estimateSize, estimateExpansion);
    host.addController(this);
  }

  /**
   * The items to render and the spacer heights. Call it in every render of the
   * virtualized list, with the full list. It doesn't touch the DOM or `window`.
   *
   * @param {readonly T[]} items
   * @returns {VirtualSlice<T>}
   */
  slice(items) {
    if (items !== this.#items || items.length !== this.#sizes.count) {
      this.#setItems(items);
    } else if (this.#expandedChanged) {
      this.#updateExpanded();
    }
    const { first, last } = this.#range;
    const before = this.#sizes.offsetOf(first);
    const after = this.#sizes.total - this.#sizes.offsetOf(last + 1);
    this.#lastSlice = { first, last, before, after };
    return { first, last, items: items.slice(first, last + 1), before, after };
  }

  /**
   * Renders the items of a slice between the two spacers, in normal flow.
   * Items are keyed by identity, so a new range only adds and removes items at
   * its edges. Hosts include `spacerStyles` in their styles.
   *
   * @param {VirtualSlice<T>} slice what `slice()` returned for this render
   * @param {(item: T, index: number) => unknown} renderItem renders exactly one element for an item, given its index in the full list
   */
  renderSlice({ first, items, before, after }, renderItem) {
    return html`
      <div class="virtualizer-spacer" ${this.#topSpacerRef} style="height: ${before}px"></div>
      ${repeat(
        items,
        item => item,
        (item, offset) => renderItem(item, first + offset),
      )}
      <div class="virtualizer-spacer" ${this.#bottomSpacerRef} style="height: ${after}px"></div>
    `;
  }

  /**
   * The element whose scrolling moves the list: the explicit one, or the
   * detected one. `document.scrollingElement` stands for the document.
   */
  get scrollContainer() {
    return (
      this.#explicitContainer ?? this.#containerElement() ?? document.scrollingElement ?? undefined
    );
  }

  /**
   * Overrides the detection; `undefined` turns detection back on.
   *
   * @param {Element | undefined} container
   */
  set scrollContainer(container) {
    this.#explicitContainer = container;
    if (this.#active) {
      this.#attach();
      this.#scheduleCheck();
    }
  }

  /**
   * Whether the host renders an item expanded, e.g. a table row with an open
   * detail. Unmeasured expanded items are estimated at the typical item size
   * plus the typical expansion. Assign a new function whenever the answer
   * changes for any item; the next slice asks it about every item again.
   *
   * @param {((item: T, index: number) => boolean) | undefined} predicate
   */
  set expanded(predicate) {
    if (predicate === this.#expanded) {
      return;
    }
    this.#expanded = predicate;
    this.#expandedChanged = true;
    this.#host.requestUpdate();
  }

  /**
   * Brings an item into view, like `Element.scrollIntoView`, and resolves once it
   * is rendered and the list has settled around it.
   *
   * @param {number} index
   * @param {{ block?: ScrollLogicalPosition }} [options]
   */
  async scrollToIndex(index, { block = 'start' } = {}) {
    const count = this.#items.length;
    if (count === 0) {
      return;
    }
    const target = Math.min(count - 1, Math.max(0, Math.trunc(index)));
    if (!this.#elementAt(target)) {
      const height = this.#visibleHeight();
      const start = this.#sizes.offsetOf(target);
      const end = start + this.#sizes.get(target);
      const top =
        block === 'end' ? end - height : block === 'center' ? (start + end - height) / 2 : start;
      const buffer = this.#bufferFor(height);
      this.#setRange(rangeFor(this.#sizes, top - buffer, top + height + buffer));
      // The scroll position still shows the old items, so don't let the
      // update's coverage check move the range back before scrolling.
      this.#checkAfterUpdate = false;
      await this.#host.updateComplete;
    }
    const element = this.#elementAt(target);
    if (!element) {
      return;
    }
    element.scrollIntoView({ block, inline: 'nearest', behavior: 'instant' });
    this.#scheduleCheck();
    await this.#settled();
    // Measuring the newly rendered items can move the target; align it once more.
    const aligned = this.#elementAt(target);
    if (aligned && !this.#isAligned(aligned, block)) {
      aligned.scrollIntoView({ block, inline: 'nearest', behavior: 'instant' });
      this.#scheduleCheck();
      await this.#settled();
    }
  }

  /**
   * Forgets all measured heights, e.g. after a layout change such as new
   * column widths, and measures the rendered items again.
   */
  remeasure() {
    this.#measurements.clear();
    this.#sizes = ItemSizes.from(
      this.#items.length,
      () => undefined,
      this.#sizes.estimate,
      this.#expandedAt(this.#items),
      this.#sizes.expansion,
    );
    this.#measuredRows = new WeakSet();
    this.#scheduleCheck();
  }

  hostConnected() {
    this.#connected = true;
    this.#checkAfterUpdate = true;
    // A reconnected host doesn't necessarily update, so sync once its spacer
    // refs are reconnected, which happens right after this callback.
    queueMicrotask(() => this.#sync());
  }

  hostDisconnected() {
    this.#connected = false;
    this.#deactivate();
  }

  hostUpdated() {
    this.#inHostUpdated = true;
    try {
      this.#sync();
    } finally {
      this.#inHostUpdated = false;
    }
  }

  /** @param {readonly T[]} items */
  #setItems(items) {
    this.#items = items;
    this.#expandedChanged = false;
    // Different items, e.g. after sorting: there's nothing to keep in place.
    this.#anchor = undefined;
    /** @type {Map<T, Measured>} */
    const measurements = new Map();
    this.#sizes = ItemSizes.from(
      items.length,
      (index, expanded) => {
        const measured = this.#measurements.get(items[index]);
        if (!measured) {
          return undefined;
        }
        measurements.set(items[index], measured);
        return measured[stateOf(expanded)];
      },
      this.#sizes.estimate,
      this.#expandedAt(items),
      this.#sizes.expansion,
    );
    // Only keep measurements of current items, so memory stays bounded.
    this.#measurements = measurements;
    const viewport = this.#viewport ?? { top: 0, bottom: ASSUMED_VISIBLE_HEIGHT };
    const buffer = this.#bufferFor(viewport.bottom - viewport.top);
    this.#range = rangeFor(this.#sizes, viewport.top - buffer, viewport.bottom + buffer);
    this.#checkAfterUpdate = true;
    // A container that didn't overflow before may scroll with the new items.
    this.#detectAfterUpdate = true;
    this.#activity++;
  }

  /**
   * Asks `expanded` about every item again, after it changed. Items that
   * changed get their measurement in the new state back, if there is one.
   */
  #updateExpanded() {
    this.#expandedChanged = false;
    const items = this.#items;
    const expandedAt = this.#expandedAt(items);
    let changed = false;
    for (let index = 0; index < items.length; index++) {
      const expanded = expandedAt?.(index) ?? false;
      if (this.#sizes.setExpanded(index, expanded)) {
        changed = true;
        const size = this.#measurements.get(items[index])?.[stateOf(expanded)];
        if (size !== undefined) {
          this.#sizes.set(index, size);
        }
      }
    }
    if (changed) {
      // Measure the rendered items in their new state.
      this.#measuredRows = new WeakSet();
      this.#checkAfterUpdate = true;
      this.#activity++;
    }
  }

  /**
   * @param {readonly T[]} items
   * @returns {((index: number) => boolean) | undefined}
   */
  #expandedAt(items) {
    const expanded = this.#expanded;
    return expanded && (index => Boolean(expanded(items[index], index)));
  }

  /**
   * @param {'top' | 'bottom'} which
   * @param {Element | undefined} element
   */
  #setSpacer(which, element) {
    if (which === 'top') {
      this.#topSpacer = element;
    } else {
      this.#bottomSpacer = element;
    }
  }

  /** Brings observers and listeners in line with what the host rendered. */
  #sync() {
    if (!this.#connected || !this.#topSpacer?.isConnected || !this.#bottomSpacer?.isConnected) {
      this.#deactivate();
      return;
    }
    const rangeChanged =
      this.#rendered?.first !== this.#lastSlice?.first ||
      this.#rendered?.last !== this.#lastSlice?.last;
    if (this.#lastSlice) {
      this.#rendered = { first: this.#lastSlice.first, last: this.#lastSlice.last };
    }
    this.#activate();
    if (this.#detectAfterUpdate) {
      this.#detectAfterUpdate = false;
      if (!this.#explicitContainer) {
        this.#attach();
      }
    }
    this.#syncRows();
    if (rangeChanged) {
      // The spacers may have stayed visible across the change; observing them
      // again makes the browser report their visibility once more.
      this.#observeSpacers();
    }
    if (this.#checkAfterUpdate) {
      this.#checkAfterUpdate = false;
      this.#check();
    }
  }

  #activate() {
    if (this.#active) {
      return;
    }
    this.#active = true;
    this.#checkAfterUpdate = true;
    this.#rowObserver = new ResizeObserver(this.#onRowsResized);
    this.#sizeObserver = new ResizeObserver(() => this.#scheduleCheck());
    this.#spacerObserver = new IntersectionObserver(this.#onSpacersIntersecting);
    this.#sizeObserver.observe(this.#host);
    this.#attach();
    this.#observeSpacers();
  }

  #deactivate() {
    if (!this.#active) {
      return;
    }
    this.#active = false;
    this.#detach();
    this.#rowObserver?.disconnect();
    this.#sizeObserver?.disconnect();
    this.#spacerObserver?.disconnect();
    this.#rowObserver = undefined;
    this.#sizeObserver = undefined;
    this.#spacerObserver = undefined;
    this.#rows.clear();
    this.#observedTopSpacer = undefined;
    this.#anchor = undefined;
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    clearTimeout(this.#scrollEndTimer);
  }

  /**
   * Listens to the scroll container, which is detected unless it was passed
   * explicitly. While the list isn't part of the rendered flat tree yet, the
   * container stays unknown and every check tries again.
   */
  #attach() {
    this.#detach();
    const explicit = this.#explicitContainer;
    if (explicit) {
      this.#container = isDocumentScroller(explicit) ? document : explicit;
    } else {
      this.#container = this.#topSpacer && findScrollContainer(this.#topSpacer);
    }
    const element = this.#containerElement();
    // The window is always included: page scrolling moves nested scroll containers too.
    this.#scrollTargets = element ? [element, window] : [window];
    for (const target of this.#scrollTargets) {
      target.addEventListener('scroll', this.#onScroll, { passive: true });
      target.addEventListener('scrollend', this.#recheck, { passive: true });
    }
    window.addEventListener('resize', this.#recheck, { passive: true });
    if (element) {
      this.#sizeObserver?.observe(element);
    }
  }

  #detach() {
    for (const target of this.#scrollTargets) {
      target.removeEventListener('scroll', this.#onScroll);
      target.removeEventListener('scrollend', this.#recheck);
    }
    window.removeEventListener('resize', this.#recheck);
    const element = this.#containerElement();
    if (element) {
      this.#sizeObserver?.unobserve(element);
    }
    this.#scrollTargets = [];
  }

  /** The scroll container if it is an element, as opposed to the document. */
  #containerElement() {
    return this.#container instanceof Element ? this.#container : undefined;
  }

  #observeSpacers() {
    for (const spacer of [this.#topSpacer, this.#bottomSpacer]) {
      if (spacer && this.#spacerObserver) {
        this.#spacerObserver.unobserve(spacer);
        this.#spacerObserver.observe(spacer);
      }
    }
  }

  /**
   * Maps the rendered item elements, between the spacers, to their indexes, and
   * observes their sizes. The top spacer is observed as well, so a change of its
   * height reaches `#onRowsResized` like the items' changes do.
   */
  #syncRows() {
    if (this.#observedTopSpacer !== this.#topSpacer) {
      if (this.#observedTopSpacer) {
        this.#rowObserver?.unobserve(this.#observedTopSpacer);
      }
      this.#observedTopSpacer = this.#topSpacer;
      if (this.#topSpacer) {
        this.#rowObserver?.observe(this.#topSpacer);
      }
    }
    const first = this.#rendered?.first ?? 0;
    /** @type {Map<Element, number>} */
    const rows = new Map();
    let index = first;
    for (
      let element = this.#topSpacer?.nextElementSibling;
      element && element !== this.#bottomSpacer;
      element = element.nextElementSibling
    ) {
      rows.set(element, index++);
      if (!this.#rows.has(element)) {
        this.#rowObserver?.observe(element, { box: 'border-box' });
      }
    }
    for (const element of this.#rows.keys()) {
      if (!rows.has(element)) {
        this.#rowObserver?.unobserve(element);
      }
    }
    this.#rows = rows;
  }

  /**
   * Runs after every layout that changed the size of a rendered item or of the
   * top spacer, before the browser paints.
   *
   * @param {ResizeObserverEntry[]} entries
   */
  #onRowsResized = entries => {
    this.#keepAnchor();
    let changed = false;
    for (const entry of entries) {
      const index = this.#rows.get(entry.target);
      if (index === undefined) {
        continue;
      }
      const size = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
      if (size > 0) {
        this.#measuredRows.add(entry.target);
        changed = this.#record(index, size) || changed;
      }
    }
    this.#recordAnchor();
    if (changed) {
      // Rendering from here would add items the browser can't observe in this
      // frame (a ResizeObserver loop error), so check in the next frame.
      this.#scheduleCheck();
    }
  };

  /**
   * @param {number} index
   * @param {number} size
   */
  #record(index, size) {
    const item = this.#items[index];
    const measured = this.#measurements.get(item) ?? {};
    measured[stateOf(this.#sizes.isExpanded(index))] = size;
    this.#measurements.set(item, measured);
    const changed = this.#sizes.set(index, size);
    if (changed) {
      this.#activity++;
    }
    return changed;
  }

  /** Measures rendered items the ResizeObserver hasn't reported yet. */
  #measureNewRows() {
    for (const [element, index] of this.#rows) {
      if (!this.#measuredRows.has(element)) {
        const size = element.getBoundingClientRect().height;
        if (size > 0) {
          this.#measuredRows.add(element);
          this.#record(index, size);
        }
      }
    }
  }

  #onScroll = () => {
    this.#check();
    if (!('onscrollend' in window)) {
      clearTimeout(this.#scrollEndTimer);
      this.#scrollEndTimer = setTimeout(this.#recheck, 150);
    }
  };

  /** Checks again once scrolling ends or the window resizes. */
  #recheck = () => {
    this.#check();
  };

  /** @param {IntersectionObserverEntry[]} entries */
  #onSpacersIntersecting = entries => {
    if (!this.#active) {
      return;
    }
    const visible = entries.filter(
      entry =>
        entry.isIntersecting &&
        entry.intersectionRect.height > 0 &&
        (entry.target === this.#topSpacer || entry.target === this.#bottomSpacer),
    );
    if (visible.length === 0) {
      return;
    }
    // A visible spacer means rows are missing. The scroll container may have
    // changed, or been guessed wrong; detect it again before checking.
    if (!this.#explicitContainer) {
      this.#attach();
    }
    if (this.#check()) {
      return;
    }
    // The geometry says everything is covered, but the browser shows a spacer:
    // trust the browser and cover what it reports as visible.
    this.#check({
      top: Math.min(...visible.map(entry => entry.intersectionRect.top)),
      bottom: Math.max(...visible.map(entry => entry.intersectionRect.bottom)),
    });
  };

  #scheduleCheck() {
    if (this.#frame || !this.#active) {
      return;
    }
    this.#activity++;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#check();
    });
  }

  /**
   * Makes sure the rendered items cover the visible part of the list, with a
   * buffer on both sides. Reads layout, so call it outside of rendering.
   *
   * @param {{ top: number, bottom: number }} [visibleArea] overrides the visible area, in viewport coordinates
   * @returns {boolean} whether the range changed
   */
  #check(visibleArea) {
    const rendered = this.#rendered;
    const topSpacer = this.#topSpacer;
    const bottomSpacer = this.#bottomSpacer;
    if (!this.#active || !rendered || !topSpacer || !bottomSpacer) {
      return false;
    }
    if (topSpacer.getClientRects().length === 0) {
      // The list isn't rendered (e.g. `display: none`); it is checked again when it shows.
      return false;
    }
    if (!this.#container) {
      this.#attach();
    }
    // Reading layout here shows what the last render did; keep the visible items in place first.
    this.#keepAnchor();
    const topRect = topSpacer.getBoundingClientRect();
    const bottomRect = bottomSpacer.getBoundingClientRect();
    this.#measureNewRows();
    const area = visibleArea ?? this.#visibleArea();
    const visibleTop = Math.max(area.top, topRect.top);
    const visibleBottom = Math.min(area.bottom, bottomRect.bottom);
    if (visibleBottom <= visibleTop) {
      // The list is scrolled out of view; keep what is rendered.
      this.#anchor = undefined;
      return this.#refreshSpacers();
    }
    this.#recordAnchor(visibleTop, visibleBottom);
    // Adding this offset maps viewport positions to list positions. It is taken
    // at the first rendered item, so outdated estimates above it don't count.
    const viewportToList = this.#sizes.offsetOf(rendered.first) - topRect.bottom;
    this.#viewport = { top: viewportToList + visibleTop, bottom: viewportToList + visibleBottom };
    const buffer = this.#bufferFor(visibleBottom - visibleTop);
    const covered = covers(
      {
        first: rendered.first,
        last: rendered.last,
        count: this.#items.length,
        blockTop: topRect.bottom,
        blockBottom: bottomRect.top,
        visibleTop,
        visibleBottom,
      },
      buffer / 2,
    );
    if (covered) {
      return this.#refreshSpacers();
    }
    return this.#setRange(
      rangeFor(this.#sizes, this.#viewport.top - buffer, this.#viewport.bottom + buffer),
    );
  }

  /**
   * Renders again when the spacer heights are outdated, e.g. because the
   * typical item height changed.
   */
  #refreshSpacers() {
    const slice = this.#lastSlice;
    if (!slice) {
      return false;
    }
    const before = this.#sizes.offsetOf(slice.first);
    const after = this.#sizes.total - this.#sizes.offsetOf(slice.last + 1);
    if (Math.abs(before - slice.before) >= 1 || Math.abs(after - slice.after) >= 1) {
      this.#activity++;
      this.#requestUpdate();
    }
    return false;
  }

  /** @param {{ first: number, last: number }} range */
  #setRange(range) {
    if (range.first === this.#range.first && range.last === this.#range.last) {
      return false;
    }
    this.#range = range;
    this.#activity++;
    this.#requestUpdate();
    return true;
  }

  #requestUpdate() {
    if (this.#inHostUpdated) {
      // Still before the next paint, but outside of the host's update, which
      // Lit would warn about.
      queueMicrotask(() => this.#host.requestUpdate());
    } else {
      this.#host.requestUpdate();
    }
  }

  /**
   * Remembers the first visible item and its distance from the top of the
   * list, so `#keepAnchor` can tell whether something in the list above it
   * changed size.
   *
   * @param {number} [visibleTop] top of the visible part of the list, in viewport coordinates
   * @param {number} [visibleBottom] bottom of the visible part of the list, in viewport coordinates
   */
  #recordAnchor(visibleTop, visibleBottom) {
    this.#anchor = undefined;
    if (visibleTop === undefined || visibleBottom === undefined) {
      ({ top: visibleTop, bottom: visibleBottom } = this.#visibleArea());
    }
    for (const element of this.#rows.keys()) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > visibleTop) {
        if (rect.top < visibleBottom && rect.height > 0) {
          this.#anchor = {
            element,
            offset: rect.top - this.#listTop(),
            scrollOffset: this.#scrollOffset(),
          };
        }
        return;
      }
    }
  }

  /**
   * Keeps the first visible item in place after the items above it or the top
   * spacer changed size. It runs at the first look at the layout after a
   * change: in the next check, or in the ResizeObserver callback, which comes
   * after the layout and before the paint. The browser's own scroll anchoring
   * has applied by then.
   *
   * The browser's anchoring normally keeps the items in place. But it can hold
   * on to an anchor that doesn't move with the items, such as the top spacer
   * when it was visible before the new items rendered, until the next scroll.
   * So when nothing has scrolled since the controller last looked, and the item
   * moved within the list anyway, the controller scrolls by the difference. A
   * changed scroll offset means someone scrolled, or the browser kept the items
   * in place itself, and is left alone. So are changes outside the list, such
   * as content above it, which are the browser's to handle.
   */
  #keepAnchor() {
    const anchor = this.#anchor;
    if (!anchor || !this.#rows.has(anchor.element)) {
      return;
    }
    if (this.#scrollOffset() !== anchor.scrollOffset) {
      return;
    }
    const offset = anchor.element.getBoundingClientRect().top - this.#listTop();
    const shift = offset - anchor.offset;
    if (Math.abs(shift) >= 1) {
      (this.#containerElement() ?? window).scrollBy({ top: shift, behavior: 'instant' });
      anchor.offset = offset;
      anchor.scrollOffset = this.#scrollOffset();
    }
  }

  /** The vertical scroll offset of the scroll container. */
  #scrollOffset() {
    const container = this.#containerElement();
    return container ? container.scrollTop : window.scrollY;
  }

  /**
   * The top of the list in viewport coordinates: the top edge of the top
   * spacer, which only moves when something above the list does.
   */
  #listTop() {
    return this.#topSpacer?.getBoundingClientRect().top ?? 0;
  }

  /** The visible area of the scroll container, clipped to the viewport, in viewport coordinates. */
  #visibleArea() {
    let top = 0;
    let bottom = window.innerHeight;
    const container = this.#containerElement();
    if (container) {
      const rect = container.getBoundingClientRect();
      const containerTop = rect.top + container.clientTop;
      top = Math.max(top, containerTop);
      bottom = Math.min(bottom, containerTop + container.clientHeight);
    }
    return { top, bottom };
  }

  #visibleHeight() {
    return this.#viewport ? this.#viewport.bottom - this.#viewport.top : ASSUMED_VISIBLE_HEIGHT;
  }

  /**
   * The px rendered beyond each side of the visible area: the visible height,
   * at least `MIN_BUFFER`.
   *
   * @param {number} visibleHeight
   */
  #bufferFor(visibleHeight) {
    return Math.max(visibleHeight, MIN_BUFFER);
  }

  /** @param {number} index */
  #elementAt(index) {
    for (const [element, elementIndex] of this.#rows) {
      if (elementIndex === index) {
        return element;
      }
    }
    return undefined;
  }

  /**
   * @param {Element} element
   * @param {ScrollLogicalPosition} block
   */
  #isAligned(element, block) {
    const rect = element.getBoundingClientRect();
    const area = this.#visibleArea();
    if (block === 'nearest') {
      return rect.top >= area.top - 1 && rect.bottom <= area.bottom + 1;
    }
    const style = getComputedStyle(element);
    const position =
      block === 'end'
        ? rect.bottom + parseFloat(style.scrollMarginBottom) - area.bottom
        : block === 'center'
          ? (rect.top + rect.bottom - area.top - area.bottom) / 2
          : rect.top - parseFloat(style.scrollMarginTop) - area.top;
    return Math.abs(position) <= 1;
  }

  /** Resolves once a whole frame passes without the list changing. */
  async #settled() {
    for (let frames = 0; frames < 20; frames++) {
      const activity = this.#activity;
      await new Promise(resolve => requestAnimationFrame(resolve));
      await this.#host.updateComplete;
      if (activity === this.#activity && !this.#frame && !this.#host.isUpdatePending) {
        return;
      }
    }
  }
}
