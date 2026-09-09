import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { filterOptionsByLabel } from './filterOptionsByLabel.js';

const data = [
  { label: 'VAV', value: '100' },
  { label: 'Standard Life', value: '101' },
  { label: 'UNIQA', value: '102' },
  { label: 'Zürich', value: '103' },
];

describe('filterOptionsByLabel', () => {
  it('01: returns the data unchanged for an empty query', () => {
    assert.equal(filterOptionsByLabel(data, ''), data);
  });

  it('02: matches labels case-insensitively', () => {
    assert.deepEqual(filterOptionsByLabel(data, 'uniqa'), [{ label: 'UNIQA', value: '102' }]);
    assert.deepEqual(filterOptionsByLabel(data, 'VAV'), [{ label: 'VAV', value: '100' }]);
  });

  it('03: matches substrings anywhere in the label', () => {
    assert.deepEqual(filterOptionsByLabel(data, 'life'), [
      { label: 'Standard Life', value: '101' },
    ]);
  });

  it('04: matches non-ascii labels', () => {
    assert.deepEqual(filterOptionsByLabel(data, 'zür'), [{ label: 'Zürich', value: '103' }]);
  });

  it('05: returns an empty list when nothing matches', () => {
    assert.deepEqual(filterOptionsByLabel(data, 'no-such-label'), []);
  });

  it('06: matches non-string labels against their string form', () => {
    const numeric = [
      { label: 2024, value: 'a' },
      { label: 2025, value: 'b' },
    ];
    assert.deepEqual(filterOptionsByLabel(numeric, '2025'), [{ label: 2025, value: 'b' }]);
  });

  it('07: skips empty rows instead of throwing', () => {
    const withHoles = /** @type {Array<Record<string, unknown>>} */ (
      /** @type {unknown} */ ([{ label: 'VAV', value: '100' }, null, { label: null, value: '101' }])
    );
    assert.deepEqual(filterOptionsByLabel(withHoles, 'vav'), [{ label: 'VAV', value: '100' }]);
  });
});
