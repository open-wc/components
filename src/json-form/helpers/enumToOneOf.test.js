import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { enumToOneOf } from './enumToOneOf.js';

describe('enumToOneOf', () => {
  it('01: returns an empty list for undefined', () => {
    assert.deepEqual(enumToOneOf(undefined), []);
  });

  it('02: converts enum entries to const/title pairs', () => {
    assert.deepEqual(enumToOneOf(['One', 'Two']), [
      { const: 'One', title: 'One' },
      { const: 'Two', title: 'Two' },
    ]);
  });
});
