import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { ItemSizes } from './ItemSizes.js';
import { covers, rangeFor } from './range.js';

describe('rangeFor', () => {
  it('includes every item that intersects the area', () => {
    const sizes = new ItemSizes(100, 10);

    assert.deepEqual(rangeFor(sizes, 95, 205), { first: 9, last: 20 });
  });

  it('clamps the area to the list', () => {
    const sizes = new ItemSizes(100, 10);

    assert.deepEqual(rangeFor(sizes, -300, 50), { first: 0, last: 5 });
    assert.deepEqual(rangeFor(sizes, 950, 2_000), { first: 95, last: 99 });
  });

  it('is empty for an empty list', () => {
    assert.deepEqual(rangeFor(new ItemSizes(0, 10), 0, 500), { first: 0, last: -1 });
  });
});

describe('covers', () => {
  const visible = { visibleTop: 100, visibleBottom: 600 };

  it('covers the visible area when the rendered block reaches past it by the margin', () => {
    assert.equal(
      covers({ ...visible, first: 10, last: 40, count: 100, blockTop: 50, blockBottom: 650 }, 50),
      true,
    );
  });

  it('asks for a new range when the block falls short of the margin on either side', () => {
    assert.equal(
      covers({ ...visible, first: 10, last: 40, count: 100, blockTop: 51, blockBottom: 700 }, 50),
      false,
    );
    assert.equal(
      covers({ ...visible, first: 10, last: 40, count: 100, blockTop: 0, blockBottom: 649 }, 50),
      false,
    );
  });

  it('needs no margin at the start and the end of the list', () => {
    assert.equal(
      covers({ ...visible, first: 0, last: 99, count: 100, blockTop: 100, blockBottom: 600 }, 50),
      true,
    );
  });
});
