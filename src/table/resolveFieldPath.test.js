import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { resolveFieldPath, deepInsertField } from './resolveFieldPath.js';

describe('resolveFieldPath', () => {
  it('01: resolves a top-level field', () => {
    assert.equal(resolveFieldPath({ name: 'Ada' }, 'name'), 'Ada');
  });

  it('02: resolves a nested field via dot notation', () => {
    assert.equal(resolveFieldPath({ teacher: { name: 'Donald' } }, 'teacher.name'), 'Donald');
  });

  it('03: returns undefined when no field is given', () => {
    assert.equal(resolveFieldPath({ name: 'Ada' }, undefined), undefined);
  });

  it('04: returns an empty string for missing paths', () => {
    assert.equal(resolveFieldPath({ name: 'Ada' }, 'teacher.name'), '');
  });

  it('05: keeps the number zero instead of treating it as missing', () => {
    assert.equal(resolveFieldPath({ count: 0 }, 'count'), 0);
  });

  it('06: returns an empty string for other falsy values', () => {
    assert.equal(resolveFieldPath({ done: false }, 'done'), '');
    assert.equal(resolveFieldPath({ label: '' }, 'label'), '');
  });

  it('07: resolves arrays and dates as-is', () => {
    const date = new Date('2001-04-05T04:20:42.000Z');
    const list = [1, 2, 3];
    assert.equal(resolveFieldPath({ meta: { date } }, 'meta.date'), date);
    assert.equal(resolveFieldPath({ list }, 'list'), list);
  });
});

describe('deepInsertField', () => {
  it('01: sets a top-level field', () => {
    const row = { name: 'Ada' };
    deepInsertField(row, 'Grace', 'name');
    assert.equal(row.name, 'Grace');
  });

  it('02: sets a nested field via dot notation', () => {
    const row = { teacher: { name: 'Donald' } };
    deepInsertField(row, 'Daisy', 'teacher.name');
    assert.equal(row.teacher.name, 'Daisy');
  });

  it('03: creates missing intermediate objects', () => {
    const row = /** @type {{ teacher?: { name: string } }} */ ({});
    deepInsertField(row, 'Daisy', 'teacher.name');
    assert.deepEqual(row, { teacher: { name: 'Daisy' } });
  });

  it('04: does nothing when no field is given', () => {
    const row = { name: 'Ada' };
    deepInsertField(row, 'Grace', undefined);
    assert.deepEqual(row, { name: 'Ada' });
  });
});
