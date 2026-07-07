import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  dataPathSegments,
  isRequired,
  resolveDataSchema,
  resolveSchema,
  resolveSubObject,
} from './resolve.js';

describe('resolveSchema', () => {
  it('01: resolves a simple schema', () => {
    const schema = {
      type: 'object',
      properties: { foo: { type: 'string' }, bar: { type: 'number' } },
    };
    const resolvedSchema = resolveSchema(schema, '#/properties/foo');
    assert.deepEqual({ type: 'string' }, resolvedSchema);
  });
  it('02: resolves an array schema', () => {
    const schema = {
      type: 'object',
      properties: { foo: { type: 'array', items: { type: 'string' } }, bar: { type: 'number' } },
    };
    const resolvedSchema = resolveSchema(schema, '#/properties/foo/0');
    const resolvedSchema2 = resolveSchema(schema, '#/properties/foo/1');
    assert.deepEqual({ type: 'string' }, resolvedSchema);
    assert.deepEqual({ type: 'string' }, resolvedSchema2);
  });
  it('03: resolves an oneOf schema', () => {
    const schema = {
      type: 'object',
      oneOf: [
        {
          properties: {
            bar: { type: 'number' },
            foo: { const: 'number' },
          },
        },
        {
          properties: {
            bar: { type: 'string' },
            foo: { const: 'string' },
          },
        },
        {
          properties: {
            foo: { type: 'string' },
          },
        },
      ],
    };
    const value = { foo: 'string' };
    // @ts-ignore
    const resolvedSchema = resolveSchema(schema, '#/properties/bar', value);
    const value2 = { foo: 'number' };
    // @ts-ignore
    const resolvedSchema2 = resolveSchema(schema, '#/properties/bar', value2);
    const value3 = { foo: 'foo' };
    // @ts-ignore
    const resolvedSchema3 = resolveSchema(schema, '#/properties/bar', value3);
    assert.deepEqual({ type: 'string' }, resolvedSchema);
    assert.deepEqual({ type: 'number' }, resolvedSchema2);
    assert.deepEqual(null, resolvedSchema3);
  });
  it('04: resolves an anyOf schema', () => {
    const schema = {
      type: 'object',
      anyOf: [
        {
          properties: {
            bar: { type: 'string', enum: ['foo', 'foobar'] },
            foo: { type: 'string', enum: ['foo only', 'foobar only'] },
          },
        },
        {
          properties: {
            bar: { type: 'string', enum: ['bar', 'foobar'] },
            foo: { type: 'string', enum: ['bar only', 'foobar only'] },
          },
        },
        {
          properties: {
            bar: { type: 'string', enum: ['foo', 'bar', 'foobar'] },
            foo: { type: 'string' },
          },
        },
      ],
    };
    const value = { foo: 'foobar only' };
    // @ts-ignore
    const resolvedSchema = resolveSchema(schema, '#/properties/bar', value);
    const value2 = { foo: 'foo only' };
    // @ts-ignore
    const resolvedSchema2 = resolveSchema(schema, '#/properties/bar', value2);
    assert.deepEqual(resolvedSchema, { type: 'string', enum: ['foobar'] });
    assert.deepEqual(resolvedSchema2, { type: 'string', enum: ['foo', 'foobar'] });
  });
  it('05: resolves an allOf schema', () => {
    const schema = {
      type: 'object',
      allOf: [
        { properties: { foo: { type: 'string' } } },
        { properties: { bar: { type: 'number' } } },
      ],
    };
    // @ts-ignore
    assert.deepEqual(resolveSchema(schema, '#/properties/foo'), { type: 'string' });
    // @ts-ignore
    assert.deepEqual(resolveSchema(schema, '#/properties/bar'), { type: 'number' });
  });
  it('06: resolves an if/then/else schema', () => {
    const schema = {
      type: 'object',
      properties: { kind: { type: 'string' } },
      if: { properties: { kind: { const: 'number' } }, required: ['kind'] },
      then: { properties: { bar: { type: 'number' } } },
      else: { properties: { bar: { type: 'string' } } },
    };
    // @ts-ignore
    const thenSchema = resolveSchema(schema, '#/properties/bar', { kind: 'number' });
    // @ts-ignore
    const elseSchema = resolveSchema(schema, '#/properties/bar', { kind: 'text' });
    assert.deepEqual(thenSchema, { type: 'number' });
    assert.deepEqual(elseSchema, { type: 'string' });
  });
  it('07: returns null for unknown paths', () => {
    const schema = { type: 'object', properties: { foo: { type: 'string' } } };
    assert.equal(resolveSchema(schema, '#/properties/unknown'), null);
  });
});

describe('dataPathSegments', () => {
  it('01: strips the leading # and all "properties" segments', () => {
    assert.deepEqual(dataPathSegments('#/properties/sub/properties/name'), ['sub', 'name']);
  });
  it('02: keeps array indices', () => {
    assert.deepEqual(dataPathSegments('#/properties/arr/0/properties/name'), ['arr', '0', 'name']);
  });
});

describe('resolveDataSchema', () => {
  const data = { name: 'foo', sub: { city: 'Vienna' }, arr: ['a', 'b'] };
  it('01: resolves top level properties', () => {
    assert.equal(resolveDataSchema(data, '#/properties/name'), 'foo');
  });
  it('02: resolves nested properties', () => {
    assert.equal(resolveDataSchema(data, '#/properties/sub/properties/city'), 'Vienna');
  });
  it('03: resolves array entries', () => {
    assert.equal(resolveDataSchema(data, '#/properties/arr/1'), 'b');
  });
  it('04: returns null for missing paths', () => {
    assert.equal(resolveDataSchema(data, '#/properties/missing'), null);
  });
});

describe('isRequired', () => {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'integer' },
      address: {
        type: 'object',
        properties: { city: { type: 'string' }, street: { type: 'string' } },
        required: ['city'],
      },
    },
    required: ['name'],
  };
  it('01: detects required top level properties', () => {
    // @ts-ignore
    assert.equal(isRequired(schema, '#/properties/name'), true);
    // @ts-ignore
    assert.equal(isRequired(schema, '#/properties/age'), false);
  });
  it('02: detects required nested properties', () => {
    // @ts-ignore
    assert.equal(isRequired(schema, '#/properties/address/properties/city'), true);
    // @ts-ignore
    assert.equal(isRequired(schema, '#/properties/address/properties/street'), false);
  });
  it('03: honors required from a matching if/then branch', () => {
    const conditional = {
      type: 'object',
      properties: { employed: { type: 'boolean' }, employer: { type: 'string' } },
      if: { properties: { employed: { const: true } }, required: ['employed'] },
      then: { required: ['employer'] },
    };
    // @ts-ignore
    assert.equal(isRequired(conditional, '#/properties/employer', { employed: true }), true);
    assert.equal(
      // @ts-ignore
      Boolean(isRequired(conditional, '#/properties/employer', { employed: false })),
      false,
    );
  });
});

const resolveSubObjectData = {
  foo: 'foo',
  bar: 'bar',
  sub: {
    apples: 'apples',
    oranges: 'oranges',
    sub2: {
      monday: 'monday',
      tuesday: 'tuesday',
    },
    subPear: {
      subSubPear: {
        pear: 'pear',
      },
    },
  },

  arr: [{ jazz: { freeJazz: 'freeJazz', classicJazz: 'classicJazz' } }, 'rock', 'pop'],
};
describe('resolveSubObject', () => {
  it('01: inserts a single top level path', () => {
    const newData = resolveSubObject(resolveSubObjectData, ['#/properties/bar']);
    assert.deepEqual(newData, { bar: 'bar' });
  });
  it('02: inserts multiple top level paths', () => {
    const newData = resolveSubObject(resolveSubObjectData, [
      '#/properties/bar',
      '#/properties/foo',
    ]);
    assert.deepEqual(newData, { bar: 'bar', foo: 'foo' });
  });
  it('03: Copies whole subobjects if specified', () => {
    const newData = resolveSubObject(resolveSubObjectData, ['#/properties/sub']);
    assert.deepEqual(newData, {
      sub: {
        apples: 'apples',
        oranges: 'oranges',
        sub2: {
          monday: 'monday',
          tuesday: 'tuesday',
        },
        subPear: {
          subSubPear: {
            pear: 'pear',
          },
        },
      },
    });
  });
  it('04: Deep inserts single properties', () => {
    const newData = resolveSubObject(resolveSubObjectData, ['#/properties/sub/properties/apples']);
    assert.deepEqual(newData, { sub: { apples: 'apples' } });
  });
  it('05: Deep inserts really deep properties', () => {
    const newData = resolveSubObject(resolveSubObjectData, [
      '#/properties/sub/properties/subPear/properties/subSubPear/pear',
    ]);
    assert.deepEqual(newData, { sub: { subPear: { subSubPear: { pear: 'pear' } } } });
  });
  it('06: Deep inserts properties from multiple paths', () => {
    const newData = resolveSubObject(resolveSubObjectData, [
      '#/properties/sub/properties/subPear/properties/subSubPear/pear',
      '#/properties/sub/properties/sub2/monday',
    ]);
    assert.deepEqual(newData, {
      sub: { sub2: { monday: 'monday' }, subPear: { subSubPear: { pear: 'pear' } } },
    });
  });
  it('07: Deep inserts array elements', () => {
    const newData = resolveSubObject(resolveSubObjectData, ['#/properties/arr/1']);
    assert.deepEqual(newData, {
      arr: [null, 'rock'],
    });
  });
  it('08: Deep inserts array elements', () => {
    const newData = resolveSubObject(resolveSubObjectData, [
      '#/properties/arr/0/properties/jazz/properties/freeJazz',
    ]);
    assert.deepEqual(newData, {
      arr: [{ jazz: { freeJazz: 'freeJazz' } }],
    });
  });
  it('09: Deep inserts multiple array elements', () => {
    const newData = resolveSubObject(resolveSubObjectData, [
      '#/properties/arr/0/properties/jazz/properties/freeJazz',
      '#/properties/arr/2',
    ]);
    assert.deepEqual(newData, {
      arr: [{ jazz: { freeJazz: 'freeJazz' } }, null, 'pop'],
    });
  });
});
