import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { ItemSizes } from './ItemSizes.js';

describe('ItemSizes', () => {
  it('estimates unmeasured items at the initial estimate', () => {
    const sizes = new ItemSizes(5, 40);

    assert.equal(sizes.offsetOf(0), 0);
    assert.equal(sizes.offsetOf(3), 120);
    assert.equal(sizes.total, 200);
  });

  it('finds the item that contains an offset', () => {
    const sizes = new ItemSizes(3, 10);
    sizes.set(0, 10);
    sizes.set(1, 20);
    sizes.set(2, 30);

    assert.deepEqual(
      [0, 9.9, 10, 29.9, 30, 59.9].map(offset => sizes.indexAt(offset)),
      [0, 0, 1, 1, 2, 2],
    );
  });

  it('clamps offsets outside the list to the first and the last item', () => {
    const sizes = new ItemSizes(3, 10);

    assert.equal(sizes.indexAt(-50), 0);
    assert.equal(sizes.indexAt(30), 2);
    assert.equal(sizes.indexAt(1_000), 2);
  });

  it('has no items to find in an empty list', () => {
    const sizes = new ItemSizes(0, 40);

    assert.equal(sizes.total, 0);
    assert.equal(sizes.indexAt(0), -1);
  });

  it('estimates unmeasured items at the median measured size, so tall items do not skew it', () => {
    const sizes = new ItemSizes(10, 40);
    sizes.set(0, 48);
    sizes.set(1, 48);
    sizes.set(2, 300);
    sizes.set(3, 48);

    assert.equal(sizes.estimate, 48);
    // 3 × 48 + 300 measured, 6 × 48 estimated
    assert.equal(sizes.total, 732);
  });

  it('replaces the earlier size when an item is measured again', () => {
    const sizes = new ItemSizes(3, 40);
    sizes.set(1, 40);
    sizes.set(1, 60);

    assert.equal(sizes.estimate, 60);
    assert.equal(sizes.total, 180);
  });

  it('ignores sizes of zero, which unrendered items report', () => {
    const sizes = new ItemSizes(2, 40);

    assert.equal(sizes.set(0, 0), false);
    assert.equal(sizes.isMeasured(0), false);
    assert.equal(sizes.total, 80);
  });

  it('restores measured sizes and keeps the given estimate when none are known', () => {
    const restored = ItemSizes.from(4, index => [10, undefined, 30, undefined][index], 20);
    const unknown = ItemSizes.from(3, () => undefined, 25);

    // the lower median of 10 and 30 estimates the two unmeasured items
    assert.equal(restored.total, 60);
    assert.equal(restored.isMeasured(2), true);
    assert.equal(restored.isMeasured(3), false);
    assert.equal(unknown.total, 75);
  });

  it('adds the typical expansion to the estimate of unmeasured expanded items', () => {
    // items 0-3 are collapsed and measure 40, item 4 is expanded and measures 240
    const sizes = ItemSizes.from(
      10,
      index => (index < 4 ? 40 : index === 4 ? 240 : undefined),
      30,
      index => index === 4 || index === 7,
    );

    // the typical expansion is 240 - 40 = 200, so item 7 is estimated at 240
    assert.equal(sizes.get(7), 240);
    assert.equal(sizes.get(6), 40);
    // 4 × 40 + 240 measured, then 40, 40, 240, 40, 40 estimated
    assert.equal(sizes.offsetOf(7), 480);
    assert.equal(sizes.offsetOf(8), 720);
    assert.equal(sizes.total, 800);
    assert.equal(sizes.indexAt(479), 6);
    assert.equal(sizes.indexAt(480), 7);
    assert.equal(sizes.indexAt(719), 7);
    assert.equal(sizes.indexAt(720), 8);
  });

  it('uses the given expansion until an expanded item is measured', () => {
    const sizes = new ItemSizes(4, 30, 100);
    sizes.set(0, 30);

    assert.equal(sizes.setExpanded(2, true), true);
    assert.equal(sizes.setExpanded(2, true), false);
    assert.equal(sizes.get(2), 130);
    assert.equal(sizes.total, 220);
  });

  it('forgets the measurement of an item whose expansion changes', () => {
    const sizes = new ItemSizes(5, 30);
    for (let index = 0; index < 5; index++) {
      sizes.set(index, 30);
    }
    sizes.setExpanded(1, true);
    sizes.set(1, 230);
    sizes.setExpanded(3, true);

    // item 3 was measured collapsed; expanded, it is estimated at 30 + the typical expansion of 200
    assert.equal(sizes.isMeasured(3), false);
    assert.equal(sizes.get(3), 230);
    // 30 + 230 + 30 + 230 + 30
    assert.equal(sizes.total, 550);

    sizes.setExpanded(1, false);
    sizes.setExpanded(3, false);
    // both are estimated at the typical size again, and the expansion is learned no more
    assert.equal(sizes.isMeasured(1), false);
    assert.equal(sizes.total, 150);
  });

  it('keeps offsets exact for 250k items', () => {
    // odd items measure 50, every 1000th item 140, the rest are estimated at the median (50)
    const sizes = ItemSizes.from(
      250_000,
      index => (index % 1000 === 0 ? 140 : index % 2 ? 50 : undefined),
      40,
    );

    assert.equal(sizes.total, 12_522_500);
    assert.equal(sizes.offsetOf(1000), 50_090);
    assert.equal(sizes.indexAt(50_090), 1000);
    assert.equal(sizes.indexAt(50_089.9), 999);
    assert.equal(sizes.indexAt(12_522_499), 249_999);
  });
});
