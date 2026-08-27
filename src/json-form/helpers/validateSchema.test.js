import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { removeFalseIshAndEmptyProperties, validateSchemaSystem } from './validateSchema.js';

describe('removeFalseIshAndEmptyProperties', () => {
  it('01: returns null for falsy values', () => {
    assert.equal(removeFalseIshAndEmptyProperties(null), null);
    // @ts-ignore
    assert.equal(removeFalseIshAndEmptyProperties(undefined), null);
  });

  it('02: returns primitives unchanged', () => {
    assert.equal(removeFalseIshAndEmptyProperties('foo'), 'foo');
    assert.equal(removeFalseIshAndEmptyProperties(5), 5);
  });

  it('03: drops empty strings, null, undefined and NaN properties', () => {
    const cleaned = removeFalseIshAndEmptyProperties({
      empty: '',
      nulled: null,
      undef: undefined,
      nan: NaN,
      name: 'foo',
    });
    assert.deepEqual(cleaned, { name: 'foo' });
  });

  it('04: keeps false and 0', () => {
    const cleaned = removeFalseIshAndEmptyProperties({ checked: false, count: 0 });
    assert.deepEqual(cleaned, { checked: false, count: 0 });
  });

  it('05: drops empty objects and cleans nested objects', () => {
    const cleaned = removeFalseIshAndEmptyProperties({
      emptyObject: {},
      nested: { name: 'foo', empty: '' },
    });
    assert.deepEqual(cleaned, { nested: { name: 'foo' } });
  });

  it('06: keeps arrays and cleans the objects inside them', () => {
    const cleaned = removeFalseIshAndEmptyProperties({
      empty: [],
      items: [{ name: 'foo', empty: '' }, 'bar', 0],
    });
    assert.deepEqual(cleaned, { empty: [], items: [{ name: 'foo' }, 'bar', 0] });
  });
});

describe('validateSchemaSystem', () => {
  const schema = /**@type {import("../types/schema.js").JsonSchema7} */ ({
    type: 'object',
    properties: { name: { type: 'string' }, age: { type: 'integer' } },
    required: ['name'],
  });

  it('01: reports valid data as valid', () => {
    const result = validateSchemaSystem(schema, { name: 'foo', age: 5 });
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it('02: reports missing required properties', () => {
    const result = validateSchemaSystem(schema, { age: 5 });
    assert.equal(result.valid, false);
    assert.equal(
      result.errors.some(error => error.keyword === 'required'),
      true,
    );
  });

  it('03: treats empty strings as missing (cleaned before validation)', () => {
    const result = validateSchemaSystem(schema, { name: '', age: 5 });
    assert.equal(result.valid, false);
    assert.equal(
      result.errors.some(error => error.keyword === 'required'),
      true,
    );
  });
});
