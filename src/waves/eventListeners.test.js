import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  requestUpdateEventName,
  addRequestUpdateReDispatcher,
  removeRequestUpdateReDispatcher,
  dispatchRequestUpdateEvent,
  addRequestUpdateListener,
} from './eventListeners.js';

describe('dispatchRequestUpdateEvent', () => {
  it('01: dispatches a requestUpdate event on the target', () => {
    const target = new EventTarget();
    let called = 0;
    target.addEventListener(requestUpdateEventName, () => {
      called += 1;
    });
    dispatchRequestUpdateEvent(target);
    assert.equal(called, 1);
  });
});

describe('addRequestUpdateReDispatcher', () => {
  it('01: forwards requestUpdate events from source to target', () => {
    const source = new EventTarget();
    const target = new EventTarget();
    let called = 0;
    target.addEventListener(requestUpdateEventName, () => {
      called += 1;
    });

    addRequestUpdateReDispatcher(source, target);
    dispatchRequestUpdateEvent(source);
    assert.equal(called, 1);
  });

  it('02: adding the same pair twice keeps a single forwarder', () => {
    const source = new EventTarget();
    const target = new EventTarget();
    let called = 0;
    target.addEventListener(requestUpdateEventName, () => {
      called += 1;
    });

    addRequestUpdateReDispatcher(source, target);
    addRequestUpdateReDispatcher(source, target);
    dispatchRequestUpdateEvent(source);
    assert.equal(called, 1);
  });

  it('03: forwards to multiple targets independently', () => {
    const source = new EventTarget();
    const targetA = new EventTarget();
    const targetB = new EventTarget();
    /** @type {string[]} */
    const seen = [];
    targetA.addEventListener(requestUpdateEventName, () => seen.push('a'));
    targetB.addEventListener(requestUpdateEventName, () => seen.push('b'));

    addRequestUpdateReDispatcher(source, targetA);
    addRequestUpdateReDispatcher(source, targetB);
    dispatchRequestUpdateEvent(source);
    assert.deepEqual(seen, ['a', 'b']);
  });
});

describe('removeRequestUpdateReDispatcher', () => {
  it('01: stops forwarding for the removed pair', () => {
    const source = new EventTarget();
    const target = new EventTarget();
    let called = 0;
    target.addEventListener(requestUpdateEventName, () => {
      called += 1;
    });

    addRequestUpdateReDispatcher(source, target);
    removeRequestUpdateReDispatcher(source, target);
    dispatchRequestUpdateEvent(source);
    assert.equal(called, 0);
  });

  it('02: keeps other targets of the same source wired', () => {
    const source = new EventTarget();
    const removed = new EventTarget();
    const kept = new EventTarget();
    let keptCalled = 0;
    kept.addEventListener(requestUpdateEventName, () => {
      keptCalled += 1;
    });

    addRequestUpdateReDispatcher(source, removed);
    addRequestUpdateReDispatcher(source, kept);
    removeRequestUpdateReDispatcher(source, removed);
    dispatchRequestUpdateEvent(source);
    assert.equal(keptCalled, 1);
  });

  it('03: removing a pair that was never added is a no-op', () => {
    const source = new EventTarget();
    const target = new EventTarget();
    removeRequestUpdateReDispatcher(source, target);
  });
});

describe('addRequestUpdateListener', () => {
  it('01: calls element.requestUpdate on requestUpdate events', () => {
    const source = new EventTarget();
    let updates = 0;
    addRequestUpdateListener(source, {
      requestUpdate: () => {
        updates += 1;
      },
    });
    dispatchRequestUpdateEvent(source);
    dispatchRequestUpdateEvent(source);
    assert.equal(updates, 2);
  });

  it('02: the returned AbortController removes the listener', () => {
    const source = new EventTarget();
    let updates = 0;
    const controller = addRequestUpdateListener(source, {
      requestUpdate: () => {
        updates += 1;
      },
    });
    controller.abort();
    dispatchRequestUpdateEvent(source);
    assert.equal(updates, 0);
  });
});
