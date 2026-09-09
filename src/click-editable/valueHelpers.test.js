import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { parseValueForType, toInputDateString, isReasonableDate } from './valueHelpers.js';

describe('parseValueForType', () => {
  it('01: passes text-ish types through unchanged', () => {
    assert.equal(parseValueForType('hello', 'text'), 'hello');
    assert.equal(parseValueForType('a@b.c', 'email'), 'a@b.c');
    assert.equal(parseValueForType('', 'text'), '');
  });

  it('02: parses numbers and keeps 0', () => {
    assert.equal(parseValueForType('42.5', 'number'), 42.5);
    assert.equal(parseValueForType('0', 'number'), 0);
    assert.equal(parseValueForType(0, 'number'), 0);
  });

  it('03: returns undefined for empty or unparsable numbers', () => {
    assert.equal(parseValueForType('', 'number'), undefined);
    assert.equal(parseValueForType(null, 'number'), undefined);
    assert.equal(parseValueForType(undefined, 'number'), undefined);
    assert.equal(parseValueForType('abc', 'number'), undefined);
  });

  it('04: parses date types into Date instances', () => {
    const date = parseValueForType('2024-01-15', 'date');
    assert.ok(date instanceof Date);
    assert.equal(date.getUTCFullYear(), 2024);

    const dateTime = parseValueForType('2024-01-15T10:30', 'datetime-local');
    assert.ok(dateTime instanceof Date);
  });

  it('05: returns undefined for empty date values', () => {
    assert.equal(parseValueForType('', 'date'), undefined);
    assert.equal(parseValueForType(undefined, 'datetime-local'), undefined);
  });
});

describe('toInputDateString', () => {
  it('01: formats a Date for a date input (local time)', () => {
    const date = new Date(2024, 0, 15, 10, 30);
    assert.equal(toInputDateString(date, 'date'), '2024-01-15');
  });

  it('02: formats a Date for a datetime-local input (local time)', () => {
    const date = new Date(2024, 0, 15, 10, 30);
    assert.equal(toInputDateString(date, 'datetime-local'), '2024-01-15T10:30');
  });

  it('03: accepts date strings', () => {
    const fromString = toInputDateString('2024-01-15T10:30', 'date');
    assert.equal(fromString, '2024-01-15');
  });

  it('04: returns undefined for non-date types', () => {
    assert.equal(toInputDateString('hello', 'text'), undefined);
    assert.equal(toInputDateString(42, 'number'), undefined);
  });

  it('05: returns undefined for empty or invalid values', () => {
    assert.equal(toInputDateString('', 'date'), undefined);
    assert.equal(toInputDateString(undefined, 'date'), undefined);
    assert.equal(toInputDateString('not a date', 'date'), undefined);
  });
});

describe('isReasonableDate', () => {
  it('01: accepts valid dates between 1900 and 3000', () => {
    assert.equal(isReasonableDate(new Date(2024, 5, 1)), true);
    assert.equal(isReasonableDate('2024-06-01'), true);
    assert.equal(isReasonableDate(new Date(1900, 0, 1)), true);
    assert.equal(isReasonableDate(new Date(3000, 0, 1)), true);
  });

  it('02: accepts the unix epoch (valueOf 0)', () => {
    assert.equal(isReasonableDate(new Date(0)), true);
  });

  it('03: rejects invalid dates', () => {
    assert.equal(isReasonableDate('not a date'), false);
    assert.equal(isReasonableDate(new Date('garbage')), false);
  });

  it('04: rejects out-of-range years (e.g. while typing a year)', () => {
    assert.equal(isReasonableDate('0202-01-01'), false);
    assert.equal(isReasonableDate('9999-01-01'), false);
  });
});
