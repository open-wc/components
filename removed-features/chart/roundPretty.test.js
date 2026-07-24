import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { roundPretty } from './roundPretty.js';

describe('roundPretty', () => {
  it('01: rounds to the next highest pretty number', async () => {
    assert.equal(roundPretty(0.11), 0.125);
    assert.equal(roundPretty(0.41), 0.425);
    assert.equal(roundPretty(0.73), 0.75);
    assert.equal(roundPretty(0.99), 1);
    assert.equal(roundPretty(1), 1);
    assert.equal(roundPretty(1.000000000000001), 1.25);
    assert.equal(roundPretty(11), 12.5);
    assert.equal(roundPretty(101), 125);
    assert.equal(roundPretty(230), 250);
    assert.equal(roundPretty(330), 350);
    assert.equal(roundPretty(1120), 1250);
    assert.equal(roundPretty(1000001), 1250000);
    assert.equal(roundPretty(0.000001), 0.000001);
    assert.equal(roundPretty(0.0000011), 0.00000125);
    assert.equal(roundPretty(0.1), 0.1);
    assert.equal(roundPretty(0.4), 0.4);
    assert.equal(roundPretty(0.1), 0.1);
    assert.equal(roundPretty(710), 725);
    assert.equal(roundPretty(5025), 5250);
  });
});
