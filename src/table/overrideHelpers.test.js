import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { mergeVisibility, nextVisibility } from './overrideHelpers.js';

describe('nextVisibility', () => {
  it('01: cycles always → ifFiltered → never → always', () => {
    assert.equal(nextVisibility('always'), 'ifFiltered');
    assert.equal(nextVisibility('ifFiltered'), 'never');
    assert.equal(nextVisibility('never'), 'always');
  });
});

describe('mergeVisibility', () => {
  it('01: merges URL and local overrides', () => {
    assert.deepEqual(mergeVisibility({ a: 'never' }, { b: 'always' }), {
      a: 'never',
      b: 'always',
    });
  });

  it('02: local overrides win over URL overrides for the same column', () => {
    assert.deepEqual(mergeVisibility({ a: 'never' }, { a: 'always', b: 'ifFiltered' }), {
      a: 'never',
      b: 'ifFiltered',
    });
  });

  it('03: does not mutate its inputs', () => {
    const local = /** @type {const} */ ({ a: 'never' });
    const url = /** @type {const} */ ({ b: 'always' });
    mergeVisibility(local, url);
    assert.deepEqual(local, { a: 'never' });
    assert.deepEqual(url, { b: 'always' });
  });
});
