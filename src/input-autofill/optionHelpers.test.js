import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { findOptionByValue, isSelectableOption } from './optionHelpers.js';

const data = [
  { label: 'VAV', value: '100' },
  { label: 'Standard Life', value: '101' },
  { label: '', value: '102' },
];

describe('findOptionByValue', () => {
  it('01: finds the option matching the value exactly', () => {
    assert.deepEqual(findOptionByValue(data, '101'), { label: 'Standard Life', value: '101' });
  });

  it('02: free text that matches no option returns undefined', () => {
    assert.equal(findOptionByValue(data, 'Standard'), undefined);
    assert.equal(findOptionByValue(data, ''), undefined);
  });

  it('03: matches by value, not by label', () => {
    assert.equal(findOptionByValue(data, 'VAV'), undefined);
  });

  it('04: does not coerce types - a numeric value never matches a string option', () => {
    assert.equal(findOptionByValue(data, /** @type {any} */ (101)), undefined);
  });

  it('05: tolerates missing data and sparse entries', () => {
    assert.equal(findOptionByValue(undefined, '100'), undefined);
    assert.equal(findOptionByValue(null, '100'), undefined);
    assert.equal(findOptionByValue([], '100'), undefined);
    assert.deepEqual(findOptionByValue(/** @type {any} */ ([null, data[0]]), '100'), data[0]);
  });
});

describe('isSelectableOption', () => {
  it('01: an option with a string value is selectable', () => {
    assert.equal(isSelectableOption({ label: 'VAV', value: '100' }), true);
  });

  it('02: an empty label stays selectable - the label is display only (regression)', () => {
    assert.equal(isSelectableOption({ label: '', value: '102' }), true);
    assert.equal(isSelectableOption({ value: '102' }), true);
  });

  it('03: an empty string value is a valid value', () => {
    assert.equal(isSelectableOption({ label: 'None', value: '' }), true);
  });

  it('04: rejects options without a usable value', () => {
    assert.equal(isSelectableOption(undefined), false);
    assert.equal(isSelectableOption(null), false);
    assert.equal(isSelectableOption({ label: 'VAV' }), false);
    assert.equal(isSelectableOption({ label: 'VAV', value: 100 }), false);
  });
});
