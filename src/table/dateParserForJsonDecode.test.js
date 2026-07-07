import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { dateParserForJsonDecode } from './dateParserForJsonDecode.js';

describe('dateParserForJsonDecode', () => {
  it('01: revives full ISO strings as Date instances', () => {
    const result = dateParserForJsonDecode('createdAt', '2024-01-20T20:41:42.098Z');
    assert.ok(result instanceof Date);
    assert.equal(/** @type {Date} */ (result).toISOString(), '2024-01-20T20:41:42.098Z');
  });

  it('02: leaves non-ISO strings untouched', () => {
    assert.equal(dateParserForJsonDecode('name', 'Ada'), 'Ada');
    // date-only strings are NOT revived, only full ISO timestamps
    assert.equal(dateParserForJsonDecode('day', '2024-01-20'), '2024-01-20');
    // missing milliseconds means no match
    assert.equal(dateParserForJsonDecode('at', '2024-01-20T20:41:42Z'), '2024-01-20T20:41:42Z');
  });

  it('03: leaves non-string values untouched', () => {
    assert.equal(dateParserForJsonDecode('count', 42), 42);
    assert.equal(dateParserForJsonDecode('flag', true), true);
    assert.equal(dateParserForJsonDecode('nothing', null), null);
  });

  it('04: works as a JSON.parse reviver', () => {
    const parsed = JSON.parse(
      '{"name":"Ada","createdAt":"2024-01-20T20:41:42.098Z"}',
      dateParserForJsonDecode,
    );
    assert.equal(parsed.name, 'Ada');
    assert.ok(parsed.createdAt instanceof Date);
  });
});
