/**
 * The row numbers of the table's grid (`aria-rowcount`, `aria-rowindex`),
 * counted over the whole list, not just its rendered slice.
 *
 * The header row is row 1. Every item of the list the body renders is a row:
 * group headers, Data Rows and insert rows; the rows of collapsed groups
 * aren't in the list. An open detail is a row of its own, right after its
 * Data Row, although it isn't an item of the list. So an item's row index is
 * 2 + its index in the list + the open details before it.
 */

/**
 * The indices of the list's items that have an open detail, in ascending
 * order.
 *
 * @template T
 * @param {readonly T[]} items the list the body renders
 * @param {((item: T, index: number) => boolean) | undefined} hasOpenDetail `undefined` when no item can have one
 * @returns {number[]}
 */
export function openDetailIndices(items, hasOpenDetail) {
  /** @type {number[]} */
  const indices = [];
  if (!hasOpenDetail) {
    return indices;
  }
  for (let index = 0; index < items.length; index++) {
    if (hasOpenDetail(items[index], index)) {
      indices.push(index);
    }
  }
  return indices;
}

/**
 * How many of the sorted indices are below `index`.
 *
 * @param {readonly number[]} sorted
 * @param {number} index
 */
function countBelow(sorted, index) {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (sorted[middle] < index) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

/**
 * The `aria-rowindex` of the item at an index of the list. Its open detail,
 * if it has one, is the row after it.
 *
 * @param {number} index the item's index in the list
 * @param {readonly number[]} openDetails what `openDetailIndices` returned
 */
export function gridRowIndex(index, openDetails) {
  return 2 + index + countBelow(openDetails, index);
}

/**
 * The grid's `aria-rowcount`: the header row, every item of the list and
 * every open detail. An empty table has two rows: the header row and the row
 * that shows the empty message.
 *
 * @param {number} itemCount the length of the list
 * @param {readonly number[]} openDetails what `openDetailIndices` returned
 */
export function gridRowCount(itemCount, openDetails) {
  return itemCount === 0 ? 2 : 1 + itemCount + openDetails.length;
}
