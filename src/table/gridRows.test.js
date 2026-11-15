import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { gridRowCount, gridRowIndex, openDetailIndices } from './gridRows.js';

describe('gridRowIndex', () => {
  it('numbers the first item of the list 2, since the header row is 1', () => {
    assert.equal(gridRowIndex(0, []), 2);
    assert.equal(gridRowIndex(7, []), 9);
  });

  it('counts the open details before an item, each a row of its own', () => {
    // list: item 0, item 1 + detail, item 2, item 3 + detail, item 4
    const open = [1, 3];
    assert.deepEqual(
      [0, 1, 2, 3, 4].map(index => gridRowIndex(index, open)),
      [2, 3, 5, 6, 8],
    );
  });

  it("doesn't count an item's own detail, which follows it", () => {
    assert.equal(gridRowIndex(5, [5]), 7);
    assert.equal(gridRowIndex(6, [5]), 9);
  });

  it('finds its place among many open details', () => {
    const open = Array.from({ length: 1000 }, (_, index) => index * 10);
    assert.equal(gridRowIndex(5000, open), 2 + 5000 + 500);
    assert.equal(gridRowIndex(5001, open), 2 + 5001 + 501);
    assert.equal(gridRowIndex(99_999, open), 2 + 99_999 + 1000);
  });
});

describe('gridRowCount', () => {
  it('counts the header row and every item of the list', () => {
    assert.equal(gridRowCount(3, []), 4);
    assert.equal(gridRowCount(100_000, []), 100_001);
  });

  it('counts every open detail as a row', () => {
    assert.equal(gridRowCount(5, [1, 3]), 8);
  });

  it('is the row index of the last row', () => {
    // list: 3 items, the last one with an open detail, which is the last row
    assert.equal(gridRowCount(3, [2]), gridRowIndex(2, [2]) + 1);
    assert.equal(gridRowCount(3, [0]), gridRowIndex(2, [0]));
  });

  it('counts the header row and the row of the empty message in an empty table', () => {
    assert.equal(gridRowCount(0, []), 2);
  });
});

describe('openDetailIndices', () => {
  it('lists the indices of the items with an open detail, in order', () => {
    const items = ['a', 'b', 'c', 'd'];
    assert.deepEqual(
      openDetailIndices(items, item => item === 'd' || item === 'b'),
      [1, 3],
    );
  });

  it('is empty without a predicate, when no row can have an open detail', () => {
    assert.deepEqual(openDetailIndices(['a', 'b'], undefined), []);
  });

  it('counts group headers as items, so the indices are indices of the list', () => {
    // a grouped list: header, row, row + detail, header (collapsed), header, row + detail
    const items = ['# red', 'r1', 'r2', '# green', '# blue', 'b1'];
    const open = openDetailIndices(items, item => item === 'r2' || item === 'b1');
    assert.deepEqual(open, [2, 5]);
    assert.equal(gridRowCount(items.length, open), 9);
    // header row 1, red 2, r1 3, r2 4, its detail 5, green 6, blue 7, b1 8, its detail 9
    assert.equal(gridRowIndex(3, open), 6);
    assert.equal(gridRowIndex(5, open), 8);
  });
});
