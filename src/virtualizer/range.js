/**
 * @typedef {object} Range
 * @property {number} first index of the first rendered item
 * @property {number} last index of the last rendered item; `first - 1` when nothing is rendered
 */

/**
 * The items that intersect an area of the list, given in list coordinates
 * (px from the start of the list). The area is clamped to the list.
 *
 * @param {import('./ItemSizes.js').ItemSizes} sizes
 * @param {number} top
 * @param {number} bottom
 * @returns {Range}
 */
export function rangeFor(sizes, top, bottom) {
  if (sizes.count === 0) {
    return { first: 0, last: -1 };
  }
  return { first: sizes.indexAt(top), last: sizes.indexAt(bottom) };
}

/**
 * Whether the rendered items still cover the visible area of the list with at
 * least `margin` px to spare on both sides. The start and the end of the list
 * need no margin. All positions share one coordinate system, e.g. the viewport.
 *
 * @param {object} state
 * @param {number} state.first first rendered index
 * @param {number} state.last last rendered index
 * @param {number} state.count number of items in the list
 * @param {number} state.blockTop top edge of the rendered items
 * @param {number} state.blockBottom bottom edge of the rendered items
 * @param {number} state.visibleTop top edge of the visible part of the list
 * @param {number} state.visibleBottom bottom edge of the visible part of the list
 * @param {number} margin
 */
export function covers(state, margin) {
  const topCovered = state.first === 0 || state.blockTop <= state.visibleTop - margin;
  const bottomCovered =
    state.last >= state.count - 1 || state.blockBottom >= state.visibleBottom + margin;
  return topCovered && bottomCovered;
}
