import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { getFullHref } from './hrefHelpers.js';

describe('getFullHref', () => {
  it('01: passes a plain href through', () => {
    assert.equal(getFullHref('/contracts', undefined), '/contracts');
    assert.equal(getFullHref('/contracts', {}), '/contracts');
  });

  it('02: appends GET params from an object', () => {
    assert.equal(
      getFullHref('/contracts', { state: 'active', page: '2' }),
      '/contracts?state=active&page=2',
    );
  });

  it('03: accepts params as a query string', () => {
    assert.equal(getFullHref('/contracts', 'state=active'), '/contracts?state=active');
  });

  it('04: encodes values', () => {
    assert.equal(getFullHref('/search', { q: 'a b&c' }), '/search?q=a+b%26c');
  });
});
