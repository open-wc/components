import './virtualizer-environment.js';
import {
  Virtualizer,
  elementScroll,
  observeElementOffset,
  observeElementRect,
  observeWindowOffset,
  observeWindowRect,
  windowScroll,
} from '@tanstack/virtual-core';

/**
 * Private Lit integration for a vertically scrolling collection.
 *
 * It intentionally exposes only component-oriented operations: consumers provide
 * items and their stable identity, attach item elements for measurement, receive
 * rendered-range changes, and can scroll to an index. TanStack records and
 * controllers stay contained in this module.
 */
export class VerticalListController {
  /**
   * @param {import('lit').ReactiveControllerHost} host
   * @param {{
   *   getScrollElement?: () => Element | null,
   *   scrollTarget?: 'element' | 'window',
   *   getItems: () => unknown[],
   *   getItemKey: (index: number) => string | number,
   *   estimateSize?: number,
   *   overscan?: number,
   *   rangeExtractor?: (range: {startIndex: number, endIndex: number, overscan: number, count: number}) => number[],
   *   scrollMargin?: number,
   *   onRangeChange?: (startIndex: number, endIndex: number) => void,
   * }} options
   */
  constructor(host, options) {
    this.host = host;
    this.options = options;
    this.lastRange = undefined;
    const isWindow = options.scrollTarget === 'window';
    const controllerOptions = {
      count: options.getItems().length,
      getItemKey: options.getItemKey,
      estimateSize: () => options.estimateSize ?? 36,
      overscan: options.overscan ?? 5,
      rangeExtractor: options.rangeExtractor,
      scrollMargin: options.scrollMargin ?? 0,
      getScrollElement: isWindow
        ? () => (typeof document !== 'undefined' ? window : null)
        : (options.getScrollElement ?? (() => null)),
      observeElementRect: isWindow ? observeWindowRect : observeElementRect,
      observeElementOffset: isWindow ? observeWindowOffset : observeElementOffset,
      scrollToFn: isWindow ? windowScroll : elementScroll,
      initialOffset: isWindow ? () => (typeof document !== 'undefined' ? window.scrollY : 0) : 0,
      /** @param {any} instance */
      onChange: instance => {
        const range = instance.calculateRange();
        if (
          range &&
          (this.lastRange?.startIndex !== range.startIndex ||
            this.lastRange?.endIndex !== range.endIndex)
        ) {
          this.lastRange = { startIndex: range.startIndex, endIndex: range.endIndex };
          options.onRangeChange?.(range.startIndex, range.endIndex);
          this.host.requestUpdate();
        }
      },
    };
    this.virtualizer = new Virtualizer(controllerOptions);
    this.host.addController(this);
  }

  hostConnected() {
    this.cleanup = this.virtualizer._didMount();
  }

  hostUpdated() {
    this.virtualizer._willUpdate();
  }

  hostDisconnected() {
    this.cleanup?.();
    this.cleanup = undefined;
  }

  getVirtualizer() {
    return this.virtualizer;
  }

  update() {
    const virtualizer = this.getVirtualizer();
    virtualizer.setOptions({
      ...virtualizer.options,
      count: this.options.getItems().length,
      getItemKey: this.options.getItemKey,
      rangeExtractor: this.options.rangeExtractor,
      scrollMargin: this.options.scrollMargin ?? 0,
    });
    virtualizer.measure();
  }

  /** @param {number} overscan */
  setOverscan(overscan) {
    if (this.options.overscan === overscan) {
      return;
    }
    this.options.overscan = overscan;
    const virtualizer = this.getVirtualizer();
    virtualizer.setOptions({ ...virtualizer.options, overscan });
    virtualizer.measure();
  }

  /** Recalculate item sizes after a host-driven layout change. */
  remeasure() {
    this.getVirtualizer().measure();
  }

  /** @param {number} scrollMargin */
  setScrollMargin(scrollMargin) {
    if (this.options.scrollMargin === scrollMargin) {
      return;
    }
    this.options.scrollMargin = scrollMargin;
    this.update();
  }

  get scrollMargin() {
    return this.options.scrollMargin ?? 0;
  }

  /** Stop observing a list that is no longer rendered by its host. */
  dispose() {
    this.hostDisconnected();
    this.host.removeController(this);
  }

  /** @returns {Array<{index: number, start: number}>} */
  get items() {
    return /** @type {Array<{index: number, start: number}>} */ (
      this.getVirtualizer().getVirtualItems()
    );
  }

  get totalSize() {
    return this.getVirtualizer().getTotalSize();
  }

  /** @param {Element | null} element */
  measureElement(element) {
    this.getVirtualizer().measureElement(element);
  }

  /** @param {number} index */
  scrollToIndex(index) {
    this.getVirtualizer().scrollToIndex(index, { align: 'auto' });
  }
}
