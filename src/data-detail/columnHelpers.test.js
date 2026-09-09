import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { getVisibleColumns, getRowCount, getRequiredFields } from './columnHelpers.js';

describe('getVisibleColumns', () => {
  it('01: keeps items without a visible field', () => {
    const columns = /** @type {any} */ ([
      [{ label: 'A', field: 'a' }],
      [{ label: 'B', field: 'b' }],
    ]);
    assert.deepEqual(getVisibleColumns(columns, {}), columns);
  });

  it('02: filters out items with visible false', () => {
    const columns = /** @type {any} */ ([
      [
        { label: 'A', field: 'a', visible: false },
        { label: 'B', field: 'b', visible: true },
      ],
    ]);
    assert.deepEqual(
      getVisibleColumns(columns, {}).map(col => col.map(item => item.field)),
      [['b']],
    );
  });

  it('03: evaluates visible functions with the data', () => {
    const columns = /** @type {any} */ ([
      [
        {
          label: 'Adult only',
          field: 'a',
          visible: (/** @type {{ age: number }} */ data) => data.age > 20,
        },
        { label: 'Always', field: 'b' },
      ],
    ]);
    assert.deepEqual(
      getVisibleColumns(columns, { age: 40 }).map(col => col.map(item => item.field)),
      [['a', 'b']],
    );
    assert.deepEqual(
      getVisibleColumns(columns, { age: 12 }).map(col => col.map(item => item.field)),
      [['b']],
    );
  });

  it('04: handles empty and missing columns', () => {
    assert.deepEqual(getVisibleColumns([], {}), []);
    assert.deepEqual(getVisibleColumns(/** @type {any} */ (undefined), {}), []);
  });
});

describe('getRowCount', () => {
  it('01: returns the length of the longest column', () => {
    assert.equal(getRowCount([[1, 2, 3], [1], [1, 2]]), 3);
  });

  it('02: returns 0 for no columns (instead of -Infinity)', () => {
    assert.equal(getRowCount([]), 0);
  });

  it('03: returns 0 for only empty columns', () => {
    assert.equal(getRowCount([[], []]), 0);
  });
});

describe('getRequiredFields', () => {
  it('01: collects the fields of required editable items across columns', () => {
    const columns = [
      [
        { label: 'A', field: 'a', editableOptions: { required: true } },
        { label: 'B', field: 'b', editableOptions: { required: false } },
      ],
      [{ label: 'C', field: 'c', editableOptions: { required: true } }],
    ];
    assert.deepEqual(getRequiredFields(columns), ['a', 'c']);
  });

  it('02: returns an empty list when nothing is required', () => {
    assert.deepEqual(getRequiredFields([[{ label: 'A', field: 'a' }]]), []);
    assert.deepEqual(getRequiredFields([]), []);
  });
});
