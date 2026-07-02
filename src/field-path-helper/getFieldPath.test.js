import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { getFieldPath } from './getFieldPath.js';

const data = {
  firstName: 'Max',
  lastName: 'Mustermann',
  age: 42,
  10: 'ten',
  nested: {
    value: 'nested.value content',
  },
  friendsList: [{ name: 'Frank', age: 40 }],
  extras: {
    childList: [
      { name: 'Peter', age: 2 },
      { name: 'Anna', age: 3 },
    ],
  },
};

describe('resolveFieldPath ', () => {
  it('01: direct string value', async () => {
    assert.equal(getFieldPath(data, 'firstName'), 'Max');
  });
  it('02: direct number value', async () => {
    assert.equal(getFieldPath(data, 'age'), 42);
  });
  it('03: direct number value as string', async () => {
    assert.equal(getFieldPath(data, '10'), 'ten');
    // @ts-ignore
    assert.equal(getFieldPath(data, 10), 'ten');
  });
  it.skip('04a: wrong path returns empty string', async () => {
    // @ts-ignore
    assert.equal(getFieldPath(data, 'wrong'), undefined);
  });
  it('04b: empty or undefined field return empty string', async () => {
    // @ts-ignore
    assert.equal(getFieldPath(data, ''), undefined);
  });
  it('05: nested value', async () => {
    assert.equal(getFieldPath(data, 'nested.value'), 'nested.value content');
  });
  it('06: nested value with wrong path', async () => {
    // @ts-ignore
    assert.equal(getFieldPath(data, 'nested.wrong'), '');
  });
  it('07a: array', async () => {
    assert.deepEqual(getFieldPath(data, 'friendsList'), [{ name: 'Frank', age: 40 }]);
  });
  it('07b: nested array', async () => {
    assert.deepEqual(getFieldPath(data, 'extras.childList'), [
      { name: 'Peter', age: 2 },
      { name: 'Anna', age: 3 },
    ]);
  });
});
