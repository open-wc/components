import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { HEADER_ROW, moveInGrid, nearestRow } from './gridNavigation.js';

/** A grid with a header row, 10 body rows and 4 columns, of which 3 rows fit on a page. */
const grid = { rowCount: 10, columnCount: 4, pageSize: 3 };

/**
 * @param {number} row
 * @param {number} column
 */
const at = (row, column) => ({ row, column });

describe('moveInGrid', () => {
  it('moves between the cells of a row with ← and →, and stops at its ends', () => {
    assert.deepEqual(moveInGrid(at(2, 1), 'ArrowRight', grid), at(2, 2));
    assert.deepEqual(moveInGrid(at(2, 1), 'ArrowLeft', grid), at(2, 0));
    assert.deepEqual(moveInGrid(at(2, 3), 'ArrowRight', grid), at(2, 3));
    assert.deepEqual(moveInGrid(at(2, 0), 'ArrowLeft', grid), at(2, 0));
  });

  it('moves between rows in the same column with ↑ and ↓, and stops at the last row', () => {
    assert.deepEqual(moveInGrid(at(2, 1), 'ArrowDown', grid), at(3, 1));
    assert.deepEqual(moveInGrid(at(2, 1), 'ArrowUp', grid), at(1, 1));
    assert.deepEqual(moveInGrid(at(9, 1), 'ArrowDown', grid), at(9, 1));
  });

  it('reaches the header row with ↑ from the first body row, and stops there', () => {
    assert.deepEqual(moveInGrid(at(0, 2), 'ArrowUp', grid), at(HEADER_ROW, 2));
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 2), 'ArrowUp', grid), at(HEADER_ROW, 2));
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 2), 'ArrowDown', grid), at(0, 2));
  });

  it('moves along the header row like along any row', () => {
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 2), 'ArrowRight', grid), at(HEADER_ROW, 3));
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 2), 'Home', grid), at(HEADER_ROW, 0));
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 2), 'End', grid), at(HEADER_ROW, 3));
  });

  it('goes to the first or last cell of the row with Home and End', () => {
    assert.deepEqual(moveInGrid(at(4, 2), 'Home', grid), at(4, 0));
    assert.deepEqual(moveInGrid(at(4, 2), 'End', grid), at(4, 3));
  });

  it('goes to the first cell of the first body row with Ctrl+Home, also from the header row', () => {
    assert.deepEqual(moveInGrid(at(4, 2), 'Control+Home', grid), at(0, 0));
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 2), 'Control+Home', grid), at(0, 0));
  });

  it('goes to the last cell of the last row with Ctrl+End', () => {
    assert.deepEqual(moveInGrid(at(4, 2), 'Control+End', grid), at(9, 3));
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 0), 'Control+End', grid), at(9, 3));
    assert.deepEqual(
      moveInGrid(at(0, 0), 'Control+End', { ...grid, rowCount: 100_000 }),
      at(99_999, 3),
    );
  });

  it('moves by a page of rows with PageDown and PageUp', () => {
    assert.deepEqual(moveInGrid(at(2, 1), 'PageDown', grid), at(5, 1));
    assert.deepEqual(moveInGrid(at(5, 1), 'PageUp', grid), at(2, 1));
  });

  it('stops PageDown at the last row and PageUp at the first body row', () => {
    assert.deepEqual(moveInGrid(at(8, 1), 'PageDown', grid), at(9, 1));
    assert.deepEqual(moveInGrid(at(1, 1), 'PageUp', grid), at(0, 1));
    assert.deepEqual(moveInGrid(at(0, 1), 'PageUp', grid), at(0, 1));
  });

  it('leaves the header row with PageDown, but not with PageUp', () => {
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 1), 'PageDown', grid), at(2, 1));
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 1), 'PageUp', grid), at(HEADER_ROW, 1));
  });

  it('moves by at least one row per page', () => {
    assert.deepEqual(moveInGrid(at(2, 1), 'PageDown', { ...grid, pageSize: 0 }), at(3, 1));
  });

  it("returns undefined for keys that don't move the focus", () => {
    assert.equal(moveInGrid(at(2, 1), 'Enter', grid), undefined);
    assert.equal(moveInGrid(at(2, 1), 'Shift+ArrowLeft', grid), undefined);
    assert.equal(moveInGrid(at(2, 1), 'Alt+ArrowUp', grid), undefined);
    assert.equal(moveInGrid(at(2, 1), 'Tab', grid), undefined);
  });

  it('stays in the header row when the body has no rows', () => {
    const empty = { ...grid, rowCount: 0 };
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 1), 'ArrowDown', empty), at(HEADER_ROW, 1));
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 1), 'Control+End', empty), at(HEADER_ROW, 1));
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 1), 'Control+Home', empty), at(HEADER_ROW, 1));
    assert.deepEqual(moveInGrid(at(HEADER_ROW, 1), 'PageDown', empty), at(HEADER_ROW, 1));
  });

  describe("with rows that can't take focus", () => {
    // rows 0, 4 and 9 can't take focus, like group headers before they are rows
    const grouped = { ...grid, canFocus: (/** @type {number} */ row) => ![0, 4, 9].includes(row) };

    it('skips them with ↑ and ↓', () => {
      assert.deepEqual(moveInGrid(at(3, 1), 'ArrowDown', grouped), at(5, 1));
      assert.deepEqual(moveInGrid(at(5, 1), 'ArrowUp', grouped), at(3, 1));
      assert.deepEqual(moveInGrid(at(HEADER_ROW, 1), 'ArrowDown', grouped), at(1, 1));
    });

    it('reaches the header row from the first row that can take focus', () => {
      assert.deepEqual(moveInGrid(at(1, 1), 'ArrowUp', grouped), at(HEADER_ROW, 1));
    });

    it('stays when no row follows that can take focus', () => {
      assert.deepEqual(moveInGrid(at(8, 1), 'ArrowDown', grouped), at(8, 1));
    });

    it('goes to the first and last row that can take focus with Ctrl+Home and Ctrl+End', () => {
      assert.deepEqual(moveInGrid(at(5, 1), 'Control+Home', grouped), at(1, 0));
      assert.deepEqual(moveInGrid(at(5, 1), 'Control+End', grouped), at(8, 3));
    });

    it('lands a page on the nearest row that can take focus, without passing the page', () => {
      assert.deepEqual(moveInGrid(at(1, 1), 'PageDown', grouped), at(3, 1));
      assert.deepEqual(moveInGrid(at(7, 1), 'PageUp', grouped), at(5, 1));
    });

    it('moves on past a page that ends on rows that cannot take focus', () => {
      const sparse = { ...grid, pageSize: 1, canFocus: (/** @type {number} */ row) => row !== 4 };
      assert.deepEqual(moveInGrid(at(3, 1), 'PageDown', sparse), at(5, 1));
      assert.deepEqual(moveInGrid(at(5, 1), 'PageUp', sparse), at(3, 1));
    });

    it('stops PageDown and PageUp at the last and first row that can take focus', () => {
      assert.deepEqual(moveInGrid(at(7, 1), 'PageDown', grouped), at(8, 1));
      assert.deepEqual(moveInGrid(at(8, 1), 'PageDown', grouped), at(8, 1));
      assert.deepEqual(moveInGrid(at(2, 1), 'PageUp', grouped), at(1, 1));
      assert.deepEqual(moveInGrid(at(1, 1), 'PageUp', grouped), at(1, 1));
    });
  });

  describe('in a row with one cell across all columns', () => {
    const fullWidth = { ...grid, isFullWidth: (/** @type {number} */ row) => row === 3 };

    it("doesn't move off the cell with ←, →, Home and End, and keeps the column", () => {
      for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
        assert.deepEqual(moveInGrid(at(3, 2), key, fullWidth), at(3, 2));
      }
    });

    it('comes back to the column the user left with ↑ and ↓', () => {
      const onto = moveInGrid(at(2, 2), 'ArrowDown', fullWidth);
      assert.deepEqual(onto, at(3, 2));
      assert.deepEqual(moveInGrid(at(3, 2), 'ArrowDown', fullWidth), at(4, 2));
      assert.deepEqual(moveInGrid(at(3, 2), 'ArrowUp', fullWidth), at(2, 2));
    });
  });

  describe('with open details', () => {
    // rows 3 and 9 have an open detail: a row of its own after them, with one cell
    const withDetails = { ...grid, hasDetail: (/** @type {number} */ row) => [3, 9].includes(row) };
    /**
     * @param {number} row
     * @param {number} column
     * @returns {import('./gridNavigation.js').GridPosition}
     */
    const detailAt = (row, column) => ({ row, column, detail: true });

    it("reaches a row's detail with ↓ from the row, and the next row with ↓ from the detail", () => {
      assert.deepEqual(moveInGrid(at(3, 2), 'ArrowDown', withDetails), detailAt(3, 2));
      assert.deepEqual(moveInGrid(detailAt(3, 2), 'ArrowDown', withDetails), at(4, 2));
    });

    it("reaches a detail with ↑ from the row after it, and the detail's row with ↑ from the detail", () => {
      assert.deepEqual(moveInGrid(at(4, 2), 'ArrowUp', withDetails), detailAt(3, 2));
      assert.deepEqual(moveInGrid(detailAt(3, 2), 'ArrowUp', withDetails), at(3, 2));
    });

    it("doesn't move off a detail with ←, →, Home and End, and keeps the column", () => {
      for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
        assert.deepEqual(moveInGrid(detailAt(3, 2), key, withDetails), detailAt(3, 2));
      }
    });

    it('stays on the detail of the last row with ↓', () => {
      assert.deepEqual(moveInGrid(at(9, 1), 'ArrowDown', withDetails), detailAt(9, 1));
      assert.deepEqual(moveInGrid(detailAt(9, 1), 'ArrowDown', withDetails), detailAt(9, 1));
    });

    it('goes to the detail of the last row with Ctrl+End, since it is the last row', () => {
      assert.deepEqual(moveInGrid(at(4, 2), 'Control+End', withDetails), detailAt(9, 3));
      assert.deepEqual(
        moveInGrid(at(4, 2), 'Control+End', { ...withDetails, rowCount: 9 }),
        at(8, 3),
      );
    });

    it('leaves a detail for the first cell of the first body row with Ctrl+Home', () => {
      assert.deepEqual(moveInGrid(detailAt(3, 2), 'Control+Home', withDetails), at(0, 0));
    });

    it('moves by pages from Data Row to Data Row, also from a detail', () => {
      assert.deepEqual(moveInGrid(at(0, 1), 'PageDown', withDetails), at(3, 1));
      assert.deepEqual(moveInGrid(detailAt(3, 1), 'PageDown', withDetails), at(6, 1));
      assert.deepEqual(moveInGrid(detailAt(3, 1), 'PageUp', withDetails), at(0, 1));
      assert.deepEqual(moveInGrid(at(6, 1), 'PageUp', withDetails), at(3, 1));
    });

    it('leaves the detail of the last row with PageDown for nothing, and with PageUp for its page', () => {
      assert.deepEqual(moveInGrid(detailAt(9, 1), 'PageDown', withDetails), detailAt(9, 1));
      assert.deepEqual(moveInGrid(detailAt(9, 1), 'PageUp', withDetails), at(6, 1));
    });

    it('comes from the header row to the first row, not to a detail', () => {
      const first = { ...grid, hasDetail: (/** @type {number} */ row) => row === 0 };
      assert.deepEqual(moveInGrid(at(HEADER_ROW, 1), 'ArrowDown', first), at(0, 1));
      assert.deepEqual(moveInGrid(at(0, 1), 'ArrowUp', first), at(HEADER_ROW, 1));
    });
  });
});

describe('nearestRow', () => {
  it('is the row itself while it is in the list', () => {
    assert.equal(nearestRow(0, grid), 0);
    assert.equal(nearestRow(4, grid), 4);
    assert.equal(nearestRow(9, grid), 9);
  });

  it('is the last row for a row beyond the end of a list that got shorter', () => {
    assert.equal(nearestRow(10, grid), 9);
    assert.equal(nearestRow(99_999, grid), 9);
    assert.equal(nearestRow(3, { ...grid, rowCount: 1 }), 0);
  });

  it('is the next row that can take focus, else the one before', () => {
    // rows 0, 4 and 9 are group headers
    const grouped = { ...grid, canFocus: (/** @type {number} */ row) => ![0, 4, 9].includes(row) };
    assert.equal(nearestRow(0, grouped), 1);
    assert.equal(nearestRow(4, grouped), 5);
    assert.equal(nearestRow(9, grouped), 8);
    assert.equal(nearestRow(50, grouped), 8);
  });

  it('is undefined when no row can take focus', () => {
    assert.equal(nearestRow(2, { ...grid, canFocus: () => false }), undefined);
    assert.equal(nearestRow(0, { ...grid, rowCount: 0 }), undefined);
  });
});
