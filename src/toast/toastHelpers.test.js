import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { containerStyleFor, defaultIconForVariant } from './toastHelpers.js';

describe('containerStyleFor', () => {
  it('01: pins top positions to the top and stacks downwards', () => {
    const style = containerStyleFor('top-center');
    assert.match(style, /top: 0;/);
    assert.match(style, /flex-direction: column;/);
    assert.match(style, /align-items: center;/);
  });

  it('02: pins bottom positions to the bottom and stacks upwards', () => {
    const style = containerStyleFor('bottom-center');
    assert.match(style, /bottom: 0;/);
    assert.match(style, /flex-direction: column-reverse;/);
  });

  it('03: aligns start and end variants horizontally', () => {
    assert.match(containerStyleFor('top-start'), /align-items: start;/);
    assert.match(containerStyleFor('top-end'), /align-items: end;/);
    assert.match(containerStyleFor('bottom-start'), /align-items: start;/);
    assert.match(containerStyleFor('bottom-end'), /align-items: end;/);
  });

  it('04: keeps the container click-through and above other content', () => {
    const style = containerStyleFor('top-center');
    assert.match(style, /position: fixed;/);
    assert.match(style, /pointer-events: none;/);
    assert.match(style, /z-index: 99999;/);
  });
});

describe('defaultIconForVariant', () => {
  it('01: maps every variant to an icon', () => {
    assert.equal(defaultIconForVariant('brand'), 'info-circle');
    assert.equal(defaultIconForVariant('neutral'), 'gear');
    assert.equal(defaultIconForVariant('success'), 'check-circle');
    assert.equal(defaultIconForVariant('warning'), 'exclamation-triangle');
    assert.equal(defaultIconForVariant('danger'), 'exclamation-circle');
  });

  it('02: returns an empty string for unknown variants', () => {
    assert.equal(defaultIconForVariant('unknown'), '');
    assert.equal(defaultIconForVariant(''), '');
  });
});
