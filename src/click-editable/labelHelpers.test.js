import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { labelForValue, labelsForValues } from './labelHelpers.js';

const data = [
  { label: 'Apple', value: '100' },
  { label: 'Banana', value: '101' },
  { label: 'Grape', value: 102 },
];

describe('labelForValue', () => {
  it('01: finds the label for a value', () => {
    assert.equal(labelForValue(data, '100'), 'Apple');
  });

  it('02: matches loosely - string values find numeric options and vice versa', () => {
    assert.equal(labelForValue(data, '102'), 'Grape');
    assert.equal(labelForValue(data, 100), 'Apple');
  });

  it('03: no matching option returns undefined', () => {
    assert.equal(labelForValue(data, '999'), undefined);
    assert.equal(labelForValue([], '100'), undefined);
  });
});

describe('labelsForValues', () => {
  it('01: joins the labels of all matched values', () => {
    assert.equal(labelsForValues(data, ['100', '101']), 'Apple, Banana');
  });

  it('02: skips values without a matching option instead of leaving stray separators (regression)', () => {
    assert.equal(labelsForValues(data, ['100', '999']), 'Apple');
    assert.equal(labelsForValues(data, ['999', '100', '888']), 'Apple');
  });

  it('03: matches loosely like the single-value lookup', () => {
    assert.equal(labelsForValues(data, [102, '100']), 'Grape, Apple');
  });

  it('04: no matches at all returns an empty string', () => {
    assert.equal(labelsForValues(data, ['999']), '');
    assert.equal(labelsForValues(data, []), '');
  });
});
