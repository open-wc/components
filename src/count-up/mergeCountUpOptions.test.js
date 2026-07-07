import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { mergeCountUpOptions } from './mergeCountUpOptions.js';

const props = { start: 10, duration: 2, separator: ',' };

describe('mergeCountUpOptions', () => {
  it('01: maps the convenience properties to countup.js options', () => {
    assert.deepEqual(mergeCountUpOptions(props, undefined), {
      startVal: 10,
      duration: 2,
      separator: ',',
    });
  });

  it('02: explicit options win over the convenience properties', () => {
    const merged = mergeCountUpOptions(props, { duration: 9, prefix: '€ ' });
    assert.equal(merged.duration, 9);
    assert.equal(merged.prefix, '€ ');
    assert.equal(merged.startVal, 10);
    assert.equal(merged.separator, ',');
  });

  it('03: merging twice does not let stale values shadow changed properties (regression)', () => {
    // The component used to write the merged result back into its options
    // property, so a later duration/separator change never took effect.
    const options = { enableScrollSpy: true };
    mergeCountUpOptions(props, options);
    const second = mergeCountUpOptions({ ...props, duration: 0.5, separator: '.' }, options);
    assert.equal(second.duration, 0.5);
    assert.equal(second.separator, '.');
  });

  it('04: does not mutate the options object passed in', () => {
    const options = { suffix: ' km' };
    mergeCountUpOptions(props, options);
    assert.deepEqual(options, { suffix: ' km' });
  });

  it('05: tolerates a missing options object', () => {
    assert.equal(mergeCountUpOptions(props, null).startVal, 10);
  });
});
