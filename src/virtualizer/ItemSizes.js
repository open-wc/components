/**
 * Whether an item renders collapsed or expanded, e.g. a table row with an
 * open detail. Its size is measured, and estimated, per state.
 *
 * @typedef {'collapsed' | 'expanded'} ItemState
 */

/**
 * @param {boolean} expanded
 * @returns {ItemState}
 */
export function stateOf(expanded) {
  return expanded ? 'expanded' : 'collapsed';
}

/**
 * Item heights of a virtualized list, and the offsets derived from them.
 *
 * Measured items keep their measured size. Every other item is estimated at the
 * typical size: the median of the measurements, so a few tall items (an open
 * detail, an annotation) don't skew it. Until something is measured, the
 * estimate passed to the constructor is used.
 *
 * Items can be expanded, e.g. table rows with an open detail. Unmeasured
 * expanded items are estimated at the typical size plus the typical expansion:
 * how much the median measured expanded item exceeds the typical size. Measured
 * expanded items don't count toward the typical size, and changing whether an
 * item is expanded forgets its measurement, since it was taken in the other state.
 *
 * Offsets come from three Fenwick trees: the measured sizes, the number of
 * measured items, and the number of unmeasured expanded items. So `offsetOf`
 * and `indexAt` stay O(log n) at 250k items, and new typical sizes don't
 * require a rebuild.
 */
export class ItemSizes {
  /**
   * Builds the sizes in O(n) from previously measured sizes.
   *
   * @param {number} count
   * @param {(index: number, expanded: boolean) => number | undefined} sizeAt the measured size of an item in its state, if any
   * @param {number} estimate used while no collapsed item is measured
   * @param {(index: number) => boolean} [expandedAt] whether an item is expanded
   * @param {number} [expansion] added to the estimate of expanded items while none is measured
   */
  static from(count, sizeAt, estimate, expandedAt, expansion = 0) {
    const sizes = new ItemSizes(count, estimate, expansion);
    for (let index = 0; index < count; index++) {
      const expanded = expandedAt?.(index) ?? false;
      const size = sizeAt(index, expanded);
      if (expanded) {
        sizes.#expanded[index] = 1;
      }
      if (size !== undefined && size > 0) {
        sizes.#sizes[index] = size;
        sizes.#sums[index + 1] = size;
        sizes.#counts[index + 1] = 1;
        sizes.#addToHistogram(expanded, size, 1);
      } else if (expanded) {
        sizes.#unmeasuredExpanded[index + 1] = 1;
      }
    }
    for (const tree of [sizes.#sums, sizes.#counts, sizes.#unmeasuredExpanded]) {
      for (let node = 1; node <= count; node++) {
        const parent = node + (node & -node);
        if (parent <= count) {
          tree[parent] += tree[node];
        }
      }
    }
    return sizes;
  }

  #count;

  /** Measured size per item; 0 means not measured. */
  #sizes;

  /** 1 for expanded items. */
  #expanded;

  /** Fenwick tree over the measured sizes. */
  #sums;

  /** Fenwick tree counting the measured items. */
  #counts;

  /** Fenwick tree counting the unmeasured expanded items. */
  #unmeasuredExpanded;

  #fallbackEstimate;

  #fallbackExpansion;

  /**
   * The measured sizes of collapsed and of expanded items: size → number of
   * items with that size.
   *
   * @type {Record<ItemState, Map<number, number>>}
   */
  #histograms = { collapsed: new Map(), expanded: new Map() };

  /** @type {number | undefined} */
  #typicalSize;

  /** @type {number | undefined} */
  #typicalExpansion;

  /**
   * @param {number} count
   * @param {number} estimate used while no collapsed item is measured
   * @param {number} [expansion] added to the estimate of expanded items while none is measured
   */
  constructor(count, estimate, expansion = 0) {
    this.#count = count;
    this.#sizes = new Float64Array(count);
    this.#expanded = new Uint8Array(count);
    this.#sums = new Float64Array(count + 1);
    this.#counts = new Float64Array(count + 1);
    this.#unmeasuredExpanded = new Float64Array(count + 1);
    this.#fallbackEstimate = estimate;
    this.#fallbackExpansion = expansion;
  }

  get count() {
    return this.#count;
  }

  /** The size of every unmeasured collapsed item: the median measured size of collapsed items. */
  get estimate() {
    if (this.#typicalSize === undefined) {
      this.#typicalSize = median(this.#histograms.collapsed) ?? this.#fallbackEstimate;
    }
    return this.#typicalSize;
  }

  /** What expanding typically adds: the median measured size of expanded items minus `estimate`. */
  get expansion() {
    if (this.#typicalExpansion === undefined) {
      const expandedSize = median(this.#histograms.expanded);
      this.#typicalExpansion =
        expandedSize === undefined
          ? this.#fallbackExpansion
          : Math.max(0, expandedSize - this.estimate);
    }
    return this.#typicalExpansion;
  }

  get total() {
    return this.offsetOf(this.#count);
  }

  /** @param {number} index */
  isMeasured(index) {
    return this.#sizes[index] > 0;
  }

  /** @param {number} index */
  isExpanded(index) {
    return this.#expanded[index] === 1;
  }

  /** @param {number} index */
  get(index) {
    return this.#sizes[index] || this.estimate + (this.#expanded[index] ? this.expansion : 0);
  }

  /**
   * Records a measurement. Sizes of 0 or less are ignored, since an item that
   * isn't rendered measures 0.
   *
   * @param {number} index
   * @param {number} size
   * @returns {boolean} whether the size changed
   */
  set(index, size) {
    const previous = this.#sizes[index];
    if (!(size > 0) || size === previous) {
      return false;
    }
    const expanded = this.#expanded[index] === 1;
    this.#sizes[index] = size;
    this.#add(this.#sums, index, size - previous);
    if (previous > 0) {
      this.#addToHistogram(expanded, previous, -1);
    } else {
      this.#add(this.#counts, index, 1);
      if (expanded) {
        this.#add(this.#unmeasuredExpanded, index, -1);
      }
    }
    this.#addToHistogram(expanded, size, 1);
    return true;
  }

  /**
   * Marks an item as expanded or collapsed. A changed item loses its
   * measurement, which was taken in the other state.
   *
   * @param {number} index
   * @param {boolean} expanded
   * @returns {boolean} whether it changed
   */
  setExpanded(index, expanded) {
    const wasExpanded = this.#expanded[index] === 1;
    if (wasExpanded === expanded) {
      return false;
    }
    const previous = this.#sizes[index];
    if (previous > 0) {
      this.#sizes[index] = 0;
      this.#add(this.#sums, index, -previous);
      this.#add(this.#counts, index, -1);
      this.#addToHistogram(wasExpanded, previous, -1);
    } else if (wasExpanded) {
      this.#add(this.#unmeasuredExpanded, index, -1);
    }
    this.#expanded[index] = expanded ? 1 : 0;
    if (expanded) {
      this.#add(this.#unmeasuredExpanded, index, 1);
    }
    return true;
  }

  /**
   * The distance from the start of the list to the start of an item.
   * `offsetOf(count)` is the total size.
   *
   * @param {number} index
   */
  offsetOf(index) {
    let measuredSize = 0;
    let measuredCount = 0;
    let unmeasuredExpanded = 0;
    for (let node = Math.min(index, this.#count); node > 0; node -= node & -node) {
      measuredSize += this.#sums[node];
      measuredCount += this.#counts[node];
      unmeasuredExpanded += this.#unmeasuredExpanded[node];
    }
    return (
      measuredSize +
      (Math.min(index, this.#count) - measuredCount) * this.estimate +
      unmeasuredExpanded * this.expansion
    );
  }

  /**
   * The item that contains an offset, clamped to the first and the last item.
   * Returns -1 for an empty list.
   *
   * @param {number} offset
   */
  indexAt(offset) {
    if (this.#count === 0) {
      return -1;
    }
    const estimate = this.estimate;
    const expansion = this.expansion;
    let index = 0;
    let start = 0;
    let step = 1;
    while (step * 2 <= this.#count) {
      step *= 2;
    }
    // Fenwick descent: take every block of items that ends at or before the offset.
    for (; step > 0; step >>= 1) {
      const next = index + step;
      if (next <= this.#count) {
        const blockSize =
          this.#sums[next] +
          (step - this.#counts[next]) * estimate +
          this.#unmeasuredExpanded[next] * expansion;
        if (start + blockSize <= offset) {
          index = next;
          start += blockSize;
        }
      }
    }
    return Math.min(index, this.#count - 1);
  }

  /**
   * @param {Float64Array} tree
   * @param {number} index
   * @param {number} delta
   */
  #add(tree, index, delta) {
    for (let node = index + 1; node <= this.#count; node += node & -node) {
      tree[node] += delta;
    }
  }

  /**
   * @param {boolean} expanded
   * @param {number} size
   * @param {number} delta
   */
  #addToHistogram(expanded, size, delta) {
    const histogram = this.#histograms[stateOf(expanded)];
    const count = (histogram.get(size) ?? 0) + delta;
    if (count > 0) {
      histogram.set(size, count);
    } else {
      histogram.delete(size);
    }
    this.#typicalSize = undefined;
    this.#typicalExpansion = undefined;
  }
}

/**
 * The lower median of a histogram of sizes, or undefined if it is empty.
 *
 * @param {Map<number, number>} histogram size → number of items with that size
 */
function median(histogram) {
  let remaining = 0;
  for (const count of histogram.values()) {
    remaining += count;
  }
  // Index of the lower median among all measured items.
  remaining = Math.floor((remaining - 1) / 2);
  for (const size of [...histogram.keys()].sort((a, b) => a - b)) {
    remaining -= /** @type {number} */ (histogram.get(size));
    if (remaining < 0) {
      return size;
    }
  }
  return undefined;
}
