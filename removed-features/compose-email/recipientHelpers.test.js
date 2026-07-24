import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { resolveRecipientStatus, useShortFormatter } from './recipientHelpers.js';

describe('useShortFormatter', () => {
  it('01: short always collapses, long never does', () => {
    assert.equal(useShortFormatter('short', 1), true);
    assert.equal(useShortFormatter('long', 100000), false);
  });

  it('02: auto modes collapse at their threshold', () => {
    assert.equal(useShortFormatter('500auto', 499), false);
    assert.equal(useShortFormatter('500auto', 500), true);
    assert.equal(useShortFormatter('10auto', 10), true);
  });
});

describe('resolveRecipientStatus', () => {
  const good = { good: true };
  const bad = { good: false, reason: 'bounced' };

  it('01: without a tag filter the external status passes through', () => {
    assert.deepEqual(resolveRecipientStatus(good, false, false), good);
    assert.deepEqual(resolveRecipientStatus(bad, true, false), bad);
  });

  it('02: a bad external status always wins', () => {
    assert.deepEqual(resolveRecipientStatus(bad, true, true), bad);
    assert.deepEqual(resolveRecipientStatus(bad, false, true), bad);
  });

  it('03: with a tag filter, recipients without the tag are excluded', () => {
    assert.deepEqual(resolveRecipientStatus(good, true, true), good);
    assert.deepEqual(resolveRecipientStatus(good, false, true), {
      good: false,
      reason: 'Hat kein Interesse an dieser E-Mail',
    });
  });
});
