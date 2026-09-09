import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  toLocalDateTimeInputValue,
  fromLocalDateTimeInputValue,
  toLocalDateInputValue,
  fromLocalDateInputValue,
} from './localTime.js';

const date = new Date('2001-04-05T04:20:42.000Z');

describe('toLocalDateTimeInputValue', () => {
  it('01: produces a yyyy-MM-ddTHH:mm string', () => {
    const value = toLocalDateTimeInputValue(date);

    // should be a 16-char string like "2025-01-02T04:04 because we slice seconds and ms"
    assert.equal(typeof value, 'string');
    assert.equal(value.length, 16);
    assert.match(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('02: string output has no timezone to avoid ISO + timezone weirdness', () => {
    const stringValue = toLocalDateTimeInputValue(date);

    // datetime-local values do NOT contain a timezone or "Z" (doesn't check for "-" TZs)
    assert.ok(!stringValue.includes('Z'));
    assert.ok(!stringValue.includes('+'));
  });
});

describe('fromLocalDateTimeInputValue', () => {
  it('01: parses a valid datetime-local string as local time', () => {
    // datetime-local style string (no TZ)
    const result = fromLocalDateTimeInputValue('2001-04-05T04:20');

    assert.ok(result instanceof Date);
    if (result) {
      // Local Y-M-D and H:M should match the string parts
      assert.equal(result.getFullYear(), 2001);
      assert.equal(result.getMonth(), 4 - 1); // Months are 0 based (eg. 0 = Jan) so - 1
      assert.equal(result.getDate(), 5);
      assert.equal(result.getHours(), 4);
      assert.equal(result.getMinutes(), 20);
    }
  });
});

describe('toLocalDateInputValue', () => {
  it('02: produces a yyyy-MM-dd string for a Date', () => {
    const value = toLocalDateInputValue(date);

    assert.equal(typeof value, 'string');
    assert.equal(value.length, 10); // Because we slice excess from ISO
    assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('fromLocalDateInputValue', () => {
  it('01: returns null for empty or falsy strings', () => {
    assert.equal(fromLocalDateInputValue(''), null);
    // @ts-ignore – again, intentional wrong type, the function should fail gracefully
    assert.equal(fromLocalDateInputValue(undefined), null);
  });

  it('02: parses yyyy-MM-dd as a local date at midnight', () => {
    const result = fromLocalDateInputValue('2001-04-05');

    assert.ok(result instanceof Date);
    if (result) {
      // Local Y-M-D should match the string
      assert.equal(result.getFullYear(), 2001);
      assert.equal(result.getMonth(), 4 - 1); // Months are 0 based (eg. 0 = Jan) so - 1
      assert.equal(result.getDate(), 5);
    }
  });
});
