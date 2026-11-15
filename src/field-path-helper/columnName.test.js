import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { columnName } from './columnName.js';

describe('columnName', () => {
  it('is the labelString of a column, before its label', () => {
    assert.equal(columnName({ labelString: 'Active', label: 'Is active' }), 'Active');
  });

  it('is a string label without a labelString', () => {
    assert.equal(columnName({ label: 'First Name' }), 'First Name');
  });

  it("is undefined for a label that isn't a string, and without a column", () => {
    assert.equal(columnName({ label: () => 'First Name' }), undefined);
    assert.equal(columnName({}), undefined);
    assert.equal(columnName(undefined), undefined);
  });

  it('keeps an empty labelString, which names a column on purpose', () => {
    assert.equal(columnName({ labelString: '', label: 'First Name' }), '');
  });
});
