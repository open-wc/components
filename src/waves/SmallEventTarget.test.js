import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { SmallEventTarget } from './SmallEventTarget.js';

describe('SmallEventTarget', () => {
  it('01: calls listeners of the dispatched type with the event', () => {
    const target = new SmallEventTarget();
    /** @type {Event[]} */
    const seen = [];
    target.addEventListener('update', event => seen.push(event));
    const event = new Event('update');
    target.dispatchEvent(event);
    assert.deepEqual(seen, [event]);
  });

  it('02: does not call listeners of other types', () => {
    const target = new SmallEventTarget();
    let called = 0;
    target.addEventListener('other', () => {
      called += 1;
    });
    target.dispatchEvent(new Event('update'));
    assert.equal(called, 0);
  });

  it('03: calls multiple listeners in registration order', () => {
    const target = new SmallEventTarget();
    /** @type {string[]} */
    const order = [];
    target.addEventListener('update', () => order.push('first'));
    target.addEventListener('update', () => order.push('second'));
    target.dispatchEvent(new Event('update'));
    assert.deepEqual(order, ['first', 'second']);
  });

  it('04: removeEventListener removes every registration of the listener', () => {
    const target = new SmallEventTarget();
    let called = 0;
    const listener = () => {
      called += 1;
    };
    target.addEventListener('update', listener);
    target.addEventListener('update', listener);
    target.removeEventListener('update', listener);
    target.dispatchEvent(new Event('update'));
    assert.equal(called, 0);
  });

  it('05: removing a listener that was never added is a no-op', () => {
    const target = new SmallEventTarget();
    let called = 0;
    target.addEventListener('update', () => {
      called += 1;
    });
    target.removeEventListener('update', () => {});
    target.dispatchEvent(new Event('update'));
    assert.equal(called, 1);
  });

  it('06: a listener removing another listener does not skip the current dispatch', () => {
    const target = new SmallEventTarget();
    let secondCalled = 0;
    const second = () => {
      secondCalled += 1;
    };
    target.addEventListener('update', () => target.removeEventListener('update', second));
    target.addEventListener('update', second);
    target.dispatchEvent(new Event('update'));
    assert.equal(secondCalled, 1);
    target.dispatchEvent(new Event('update'));
    assert.equal(secondCalled, 1);
  });

  it('07: dispatchEvent returns true like EventTarget', () => {
    const target = new SmallEventTarget();
    assert.equal(target.dispatchEvent(new Event('update')), true);
  });

  it('08: validates the type and listener arguments', () => {
    const target = new SmallEventTarget();
    // @ts-expect-error deliberately wrong types
    assert.throws(() => target.addEventListener(1, () => {}));
    // @ts-expect-error deliberately wrong types
    assert.throws(() => target.addEventListener('update', 'nope'));
    // @ts-expect-error deliberately wrong types
    assert.throws(() => target.removeEventListener(1, () => {}));
    // @ts-expect-error deliberately wrong types
    assert.throws(() => target.removeEventListener('update', 'nope'));
  });
});
