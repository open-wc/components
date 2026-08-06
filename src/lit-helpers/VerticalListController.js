import { VirtualizerController, WindowVirtualizerController } from '@tanstack/lit-virtual';

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
   *   scrollMargin?: number,
   *   onRangeChange?: (startIndex: number, endIndex: number) => void,
   * }} options
   */
  constructor(host, options) {
    this.host = host;
    this.options = options;
    const controllerOptions = {
      count: options.getItems().length,
      getItemKey: options.getItemKey,
      estimateSize: () => options.estimateSize ?? 36,
      overscan: options.overscan ?? 5,
      scrollMargin: options.scrollMargin ?? 0,
      /** @param {any} instance */
      onChange: instance => {
        const range = instance.calculateRange();
        if (range) {
          options.onRangeChange?.(range.startIndex, range.endIndex);
        }
      },
    };
    this.controller = /** @type {any} */ (
      options.scrollTarget === 'window'
        ? new WindowVirtualizerController(host, controllerOptions)
        : new VirtualizerController(host, {
            ...controllerOptions,
            getScrollElement: options.getScrollElement ?? (() => null),
          })
    );
  }

  update() {
    const virtualizer = this.controller.getVirtualizer();
    virtualizer.setOptions({
      ...virtualizer.options,
      count: this.options.getItems().length,
      getItemKey: this.options.getItemKey,
      scrollMargin: this.options.scrollMargin ?? 0,
    });
    virtualizer.measure();
  }

  /** Recalculate item sizes after a host-driven layout change. */
  remeasure() {
    this.controller.getVirtualizer().measure();
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
    this.controller.hostDisconnected();
    this.host.removeController(this.controller);
  }

  /** @returns {Array<{index: number, start: number}>} */
  get items() {
    return /** @type {Array<{index: number, start: number}>} */ (
      this.controller.getVirtualizer().getVirtualItems()
    );
  }

  get totalSize() {
    return this.controller.getVirtualizer().getTotalSize();
  }

  /** @param {Element | null} element */
  measureElement(element) {
    this.controller.getVirtualizer().measureElement(element);
  }

  /** @param {number} index */
  scrollToIndex(index) {
    this.controller.getVirtualizer().scrollToIndex(index, { align: 'auto' });
  }
}
