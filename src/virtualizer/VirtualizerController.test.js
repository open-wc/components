import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { VirtualizerController, virtualizes } from './VirtualizerController.js';

/** A host as a server render would have one: no DOM, no `window`. */
function serverHost() {
  return {
    addController() {},
    removeController() {},
    requestUpdate() {},
    updateComplete: Promise.resolve(true),
  };
}

describe('VirtualizerController without a DOM', () => {
  it('slices a leading part of the items for the first render', () => {
    assert.equal(typeof globalThis.window, 'undefined');
    const items = Array.from({ length: 100_000 }, (_, index) => index);
    const virtualizer = new VirtualizerController(/** @type {any} */ (serverHost()), {
      estimateSize: 50,
    });

    const slice = virtualizer.slice(items);

    assert.equal(slice.first, 0);
    assert.equal(slice.before, 0);
    assert.deepEqual(slice.items, items.slice(0, slice.last + 1));
    // enough items for a typical viewport, and far from all of them
    assert.ok(slice.items.length >= 20 && slice.items.length <= 100, `${slice.items.length} items`);
    assert.equal(slice.after, (100_000 - slice.items.length) * 50);
  });
});

describe('virtualizes', () => {
  it('virtualizes from 300 items in auto mode', () => {
    assert.equal(virtualizes('auto', 299), false);
    assert.equal(virtualizes('auto', 300), true);
    assert.equal(virtualizes('auto', 100_000), true);
  });

  it('always virtualizes in always mode, and never in never mode', () => {
    assert.equal(virtualizes('always', 1), true);
    assert.equal(virtualizes('never', 100_000), false);
  });
});
