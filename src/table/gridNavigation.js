/**
 * Where the navigation keys of the table's grid move the roving focus (APG
 * data grid). Pure: it knows rows and columns as numbers, nothing of the DOM.
 */

/** The `row` of a position in the header row. Body rows are indices of the list the body renders. */
export const HEADER_ROW = -1;

/**
 * A cell of the grid. In a row with one cell across all columns, `column` is
 * the column the user came from, so ↑ and ↓ come back to it.
 *
 * An open detail is a row of the grid without being an item of the list: its
 * one cell is `detail` at the `row` of its Data Row, the row before it.
 *
 * @typedef {{ row: number, column: number, detail?: true }} GridPosition
 */

/**
 * @typedef {object} GridShape
 * @property {number} rowCount the number of body rows: the length of the list
 * @property {number} columnCount
 * @property {number} pageSize the rows PageUp and PageDown move by
 * @property {(row: number) => boolean} [canFocus] whether a body row takes focus; rows that don't are skipped
 * @property {(row: number) => boolean} [isFullWidth] whether a body row has one cell across all columns
 * @property {(row: number) => boolean} [hasDetail] whether a body row is followed by its open detail
 */

/**
 * The first row from `start` on that can take focus, walking by `step` and
 * not past `end`. `undefined` if there is none.
 *
 * @param {GridShape} grid
 * @param {number} start
 * @param {number} end the last row to look at
 * @param {1 | -1} step
 */
function findRow({ canFocus }, start, end, step) {
  for (let row = start; step > 0 ? row <= end : row >= end; row += step) {
    if (!canFocus || canFocus(row)) {
      return row;
    }
  }
  return undefined;
}

/**
 * The row that takes the place of a row that is gone from the list: the row
 * now at its index if that one can take focus, else the next one that can,
 * else the one before. `undefined` if no row can take focus.
 *
 * @param {number} row the index the row had in the list
 * @param {GridShape} grid
 */
export function nearestRow(row, grid) {
  const lastRow = grid.rowCount - 1;
  if (lastRow < 0) {
    return undefined;
  }
  const from = Math.min(Math.max(row, 0), lastRow);
  return findRow(grid, from, lastRow, 1) ?? findRow(grid, from - 1, 0, -1);
}

/**
 * The position a navigation key moves the focus to, which is `from` itself
 * when the key has nowhere to go. `undefined` for keys that don't navigate.
 *
 * @param {GridPosition} from
 * @param {string} key what `keyName` of `../a11y/keys.js` returned
 * @param {GridShape} grid
 * @returns {GridPosition | undefined}
 */
export function moveInGrid(from, key, grid) {
  const { row, column } = from;
  const lastRow = grid.rowCount - 1;
  const lastColumn = grid.columnCount - 1;
  const onDetail = row !== HEADER_ROW && Boolean(from.detail);
  const fullWidth = onDetail || (row !== HEADER_ROW && Boolean(grid.isFullWidth?.(row)));
  const next = (/** @type {number} */ after) => findRow(grid, after + 1, lastRow, 1);
  const previous = (/** @type {number} */ before) => findRow(grid, before - 1, 0, -1);
  /**
   * The last cell of a body row in the column: its open detail, if it has one.
   *
   * @param {number} bodyRow
   * @param {number} inColumn
   * @returns {GridPosition}
   */
  const lastOf = (bodyRow, inColumn) =>
    grid.hasDetail?.(bodyRow)
      ? { row: bodyRow, column: inColumn, detail: true }
      : { row: bodyRow, column: inColumn };

  switch (key) {
    case 'ArrowLeft':
      return fullWidth ? from : { row, column: Math.max(0, column - 1) };
    case 'ArrowRight':
      return fullWidth ? from : { row, column: Math.min(lastColumn, column + 1) };
    case 'Home':
      return fullWidth ? from : { row, column: 0 };
    case 'End':
      return fullWidth ? from : { row, column: lastColumn };
    case 'ArrowDown': {
      if (row !== HEADER_ROW && !onDetail && grid.hasDetail?.(row)) {
        return { row, column, detail: true };
      }
      const below = next(row);
      return below === undefined ? from : { row: below, column };
    }
    case 'ArrowUp': {
      if (row === HEADER_ROW) {
        return from;
      }
      if (onDetail) {
        return { row, column };
      }
      const above = previous(row);
      return above === undefined ? { row: HEADER_ROW, column } : lastOf(above, column);
    }
    case 'Control+Home': {
      const first = next(HEADER_ROW);
      return first === undefined ? from : { row: first, column: 0 };
    }
    case 'Control+End': {
      const last = previous(grid.rowCount);
      return last === undefined ? from : lastOf(last, lastColumn);
    }
    case 'PageDown': {
      const target = Math.min(lastRow, row + Math.max(1, grid.pageSize));
      // the last row of the page that takes focus, else the first one after the page
      const to = findRow(grid, target, row + 1, -1) ?? next(target);
      return to === undefined ? from : { row: to, column };
    }
    case 'PageUp': {
      if (row === HEADER_ROW) {
        return from;
      }
      const target = Math.max(0, row - Math.max(1, grid.pageSize));
      const to = findRow(grid, target, row - 1, 1) ?? previous(target);
      return to === undefined ? from : { row: to, column };
    }
    default:
      return undefined;
  }
}
