import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { compare } from './compare.js';

describe('compare ', () => {
  it('01a: string equal', async () => {
    assert.equal(compare('foo', 'foo', 'equal'), true);
    assert.equal(compare('foo', 'bar', 'equal'), false);
  });

  it('01b: string not equal', async () => {
    assert.equal(compare('foo', 'bar', 'notEqual'), true);
    assert.equal(compare('foo', 'foo', 'notEqual'), false);
  });

  it('01c: string endsWith', async () => {
    assert.equal(compare('me.jpg', 'jpg', 'endsWith'), true);
    assert.equal(compare('me.jpg', 'me', 'endsWith'), false);
  });

  it('01d: string startsWith', async () => {
    assert.equal(compare('[BUG] not working', '[BUG]', 'startsWith'), true);
    assert.equal(compare('[BUG] not working', 'BUG', 'startsWith'), false);
  });

  it('01e: string includes', async () => {
    assert.equal(compare('Sandra', 'sa', 'includes'), true);
    assert.equal(compare('Thomas', 'sa', 'includes'), false);
  });

  it('01f: string notIncludes', async () => {
    assert.equal(compare('Thomas', 'sa', 'notIncludes'), true);
    assert.equal(compare('Sandra', 'sa', 'notIncludes'), false);
  });

  // numbers
  it('02a: number equal', async () => {
    assert.equal(compare(10, 10, 'equal'), true);
    assert.equal(compare(20, 10, 'equal'), false);
  });

  it('02b: number not equal', async () => {
    assert.equal(compare(20, 10, 'notEqual'), true);
    assert.equal(compare(10, 10, 'notEqual'), false);
  });

  it('02b: number greaterThan', async () => {
    assert.equal(compare(20, 10, 'greaterThan'), true);
    assert.equal(compare(10, 10, 'greaterThan'), false);
  });

  it('02c: number greaterThanOrEqual', async () => {
    assert.equal(compare(10, 10, 'greaterThanOrEqual'), true);
    assert.equal(compare(9, 10, 'greaterThanOrEqual'), false);
  });

  it('02d: number lessThan', async () => {
    assert.equal(compare(10, 20, 'lessThan'), true);
    assert.equal(compare(10, 10, 'lessThan'), false);
  });

  it('02e: number lessThanOrEqual', async () => {
    assert.equal(compare(10, 10, 'lessThanOrEqual'), true);
    assert.equal(compare(10, 9, 'lessThanOrEqual'), false);
  });

  // string search for number
  it('03a: string includes for numbers', async () => {
    assert.equal(compare(5, '5', 'includes'), true);
    assert.equal(compare(528, '5', 'includes'), true);
    assert.equal(compare(6, '5', 'includes'), false);
  });

  it('03b: string notIncludes for numbers', async () => {
    assert.equal(compare(5, '5', 'notIncludes'), false);
    assert.equal(compare(528, '5', 'notIncludes'), false);
    assert.equal(compare(6, '5', 'notIncludes'), true);
  });

  // date
  it('04a: date equal', async () => {
    assert.equal(compare(new Date('2000-01-10'), new Date('2000-01-10'), 'equal'), true);
    assert.equal(compare(new Date('2000-01-10'), new Date('2000-01-11'), 'equal'), false);
  });

  it('04b: date not equal', async () => {
    assert.equal(compare(new Date('2000-01-10'), new Date('2000-01-11'), 'notEqual'), true);
    assert.equal(compare(new Date('2000-01-10'), new Date('2000-01-10'), 'notEqual'), false);
  });

  it('04b: date greaterThan', async () => {
    assert.equal(compare(new Date('2000-01-11'), new Date('2000-01-10'), 'greaterThan'), true);
    assert.equal(compare(new Date('2000-01-10'), new Date('2000-01-10'), 'greaterThan'), false);
  });

  it('04c: date greaterThanOrEqual', async () => {
    assert.equal(
      compare(new Date('2000-01-10'), new Date('2000-01-10'), 'greaterThanOrEqual'),
      true,
    );
    assert.equal(
      compare(new Date('2000-01-09'), new Date('2000-01-10'), 'greaterThanOrEqual'),
      false,
    );
  });

  it('04d: date lessThan', async () => {
    assert.equal(compare(new Date('2000-01-09'), new Date('2000-01-10'), 'lessThan'), true);
    assert.equal(compare(new Date('2000-01-10'), new Date('2000-01-10'), 'lessThan'), false);
  });

  it('04e: date lessThanOrEqual', async () => {
    assert.equal(compare(new Date('2000-01-10'), new Date('2000-01-10'), 'lessThanOrEqual'), true);
    assert.equal(compare(new Date('2000-01-11'), new Date('2000-01-10'), 'lessThanOrEqual'), false);
  });

  // value as an array
  it('05a: value and search are array', () => {
    assert.equal(compare(['foo', 'bar'], ['foo'], 'includes'), true);
    assert.equal(compare(['foo', 'bar'], ['foo2'], 'includes'), false);
  });

  it('05b: value is array and search is string', () => {
    assert.equal(compare(['foo', 'bar'], 'foo', 'includes'), true);
    assert.equal(compare(['foo', 'bar'], ['bar'], 'includes'), true);
    assert.equal(compare(['foo', 'bar'], 'foo2', 'includes'), false);
  });

  it('05c: value is array and search is number', () => {
    assert.equal(compare(['foo', 'bar', 3, 4], 3, 'includes'), true);
    assert.equal(compare(['foo', 'bar', '3', 4], 3, 'includes'), false);
  });
});
