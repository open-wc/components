import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { fitColumnWidths } from './fitColumnWidths.js';

describe('fitColumnWidths', () => {
  it('reserves fixed widths and grows or shrinks automatic widths proportionally', () => {
    const columns = Object.freeze([
      Object.freeze({ naturalWidth: 500, fixedWidth: 100 }),
      Object.freeze({ naturalWidth: 100 }),
      Object.freeze({ naturalWidth: 200 }),
    ]);

    assert.deepEqual(fitColumnWidths(columns, 1000, 50), [100, 300, 600]);
    assert.deepEqual(fitColumnWidths(columns, 250, 50), [100, 50, 100]);
  });

  it('redistributes space when enforcing one minimum makes another column too small', () => {
    assert.deepEqual(
      fitColumnWidths(
        [{ naturalWidth: 50 }, { naturalWidth: 100 }, { naturalWidth: 350 }],
        250,
        50,
      ),
      [50, 50, 150],
    );
  });

  it('rounds cumulative boundaries without losing space', () => {
    assert.deepEqual(
      fitColumnWidths(
        [{ naturalWidth: 100 }, { naturalWidth: 100 }, { naturalWidth: 100 }],
        1000,
        50,
      ),
      [333, 334, 333],
    );
  });

  it('overflows when fixed widths and automatic minimums exceed the container', () => {
    assert.deepEqual(
      fitColumnWidths(
        [{ naturalWidth: 100, fixedWidth: 180 }, { naturalWidth: 100 }, { naturalWidth: 200 }],
        100,
        50,
      ),
      [180, 50, 50],
    );
  });

  it('leaves spare space when there are no automatic columns', () => {
    assert.deepEqual(fitColumnWidths([{ naturalWidth: 100, fixedWidth: 180 }], 600, 50), [180]);
    assert.deepEqual(fitColumnWidths([], 600, 50), []);
  });
});
