import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { WaveController } from './WaveController.js';

/**
 * Minimal stand-in for a ReactiveElement / ReactiveObject host.
 */
class FakeHost extends EventTarget {
  /** @type {import('lit').ReactiveController[]} */
  controllers = [];

  /** @type {{name?: unknown, oldValue?: unknown}[]} */
  updateRequests = [];

  /** @param {import('lit').ReactiveController} controller */
  addController(controller) {
    this.controllers.push(controller);
  }

  /**
   * @param {unknown} [name]
   * @param {unknown} [oldValue]
   */
  requestUpdate(name, oldValue) {
    this.updateRequests.push({ name, oldValue });
  }

  /** Simulates the host running an update cycle. */
  update() {
    this.controllers.forEach(controller => controller.hostUpdate?.());
  }

  connect() {
    this.controllers.forEach(controller => controller.hostConnected?.());
  }

  disconnect() {
    this.controllers.forEach(controller => controller.hostDisconnected?.());
  }
}

/**
 * @param {EventTarget} target
 * @param {string} type
 */
function countEvents(target, type) {
  const counter = { count: 0 };
  target.addEventListener(type, () => {
    counter.count += 1;
  });
  return counter;
}

describe('WaveController', () => {
  beforeEach(() => {
    WaveController.finalize();
  });

  it('01: validates listener modes', () => {
    assert.throws(
      // @ts-expect-error deliberately wrong mode
      () => new WaveController(new FakeHost(), { foo: 'bogus' }),
      /Invalid property mode: foo: bogus/,
    );
    assert.doesNotThrow(
      () => new WaveController(new FakeHost(), { foo: 'self+parent+childUpdate' }),
    );
  });

  it('02: validates the controller mode', () => {
    assert.throws(
      // @ts-expect-error deliberately wrong mode
      () => new WaveController(new FakeHost(), {}, { mode: 'nope' }),
      /Invalid mode: nope/,
    );
  });

  it('03: defaults to forwardWave + updateSendsWave', () => {
    const controller = new WaveController(new FakeHost(), {});
    assert.equal(controller.waveTriggersUpdate, false);
    assert.equal(controller.forwardWave, true);
    assert.equal(controller.updateSendsWave, true);
  });

  it('04: accepts the mode as an object or as a string shorthand', () => {
    const fromObject = new WaveController(new FakeHost(), {}, { mode: 'waveTriggersUpdate' });
    assert.equal(fromObject.waveTriggersUpdate, true);
    assert.equal(fromObject.forwardWave, false);
    assert.equal(fromObject.updateSendsWave, false);

    const fromString = new WaveController(new FakeHost(), {}, 'waveTriggersUpdate+forwardWave');
    assert.equal(fromString.waveTriggersUpdate, true);
    assert.equal(fromString.forwardWave, true);
    assert.equal(fromString.updateSendsWave, false);
  });

  it('05: updateSendsWave dispatches selfUpdate on every host update', () => {
    const host = new FakeHost();
    new WaveController(host, {}, { mode: 'updateSendsWave' });
    const waves = countEvents(host, 'selfUpdate');
    host.update();
    host.update();
    assert.equal(waves.count, 2);
  });

  it('06: does not send waves before WaveController.finalize()', () => {
    WaveController._finalized = false;
    const host = new FakeHost();
    new WaveController(host, {}, { mode: 'updateSendsWave' });
    const waves = countEvents(host, 'selfUpdate');
    host.update();
    assert.equal(waves.count, 0);

    WaveController.finalize();
    host.update();
    assert.equal(waves.count, 1);
  });

  it('07: waveTriggersUpdate requests a host update when the property value fires', () => {
    const host = new FakeHost();
    new WaveController(host, { source: 'selfUpdate' }, { mode: 'waveTriggersUpdate' });
    const source = new EventTarget();
    // @ts-ignore dynamic property on the fake host
    host.source = source;
    host.update();

    source.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 1);
    assert.equal(host.updateRequests[0].name, 'source');
  });

  it('08: only listens to the wave names of the configured listener mode', () => {
    const host = new FakeHost();
    new WaveController(host, { source: 'childUpdate' }, { mode: 'waveTriggersUpdate' });
    const source = new EventTarget();
    // @ts-ignore dynamic property on the fake host
    host.source = source;
    host.update();

    source.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 0);
    source.dispatchEvent(new Event('childUpdate'));
    assert.equal(host.updateRequests.length, 1);
  });

  it('09: forwardWave re-dispatches waves from a single property as parentUpdate', () => {
    const host = new FakeHost();
    new WaveController(host, { source: 'selfUpdate' }, { mode: 'forwardWave' });
    const source = new EventTarget();
    // @ts-ignore dynamic property on the fake host
    host.source = source;
    host.update();

    const forwarded = countEvents(host, 'parentUpdate');
    source.dispatchEvent(new Event('selfUpdate'));
    assert.equal(forwarded.count, 1);
  });

  it('10: forwardWave re-dispatches waves from array elements as childUpdate', () => {
    const host = new FakeHost();
    new WaveController(host, { list: 'selfUpdate' }, { mode: 'forwardWave' });
    const element = new EventTarget();
    // @ts-ignore dynamic property on the fake host
    host.list = [element];
    host.update();

    const forwarded = countEvents(host, 'childUpdate');
    element.dispatchEvent(new Event('selfUpdate'));
    assert.equal(forwarded.count, 1);
  });

  it('11: replacing a property value detaches the old listeners', () => {
    const host = new FakeHost();
    new WaveController(host, { source: 'selfUpdate' }, { mode: 'waveTriggersUpdate' });
    const oldSource = new EventTarget();
    const newSource = new EventTarget();
    // @ts-ignore dynamic property on the fake host
    host.source = oldSource;
    host.update();
    // @ts-ignore dynamic property on the fake host
    host.source = newSource;
    host.update();

    oldSource.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 0);
    newSource.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 1);
  });

  it('12: removing an element from an array property detaches its listeners', () => {
    const host = new FakeHost();
    new WaveController(host, { list: 'selfUpdate' }, { mode: 'waveTriggersUpdate' });
    const kept = new EventTarget();
    const removed = new EventTarget();
    // @ts-ignore dynamic property on the fake host
    host.list = [kept, removed];
    host.update();
    // @ts-ignore dynamic property on the fake host
    host.list = [kept];
    host.update();

    removed.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 0);
    kept.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 1);
  });

  it('13: switching between array and single values rewires cleanly', () => {
    const host = new FakeHost();
    new WaveController(host, { value: 'selfUpdate' }, { mode: 'waveTriggersUpdate' });
    const single = new EventTarget();
    const arrayElement = new EventTarget();

    // @ts-ignore dynamic property on the fake host
    host.value = single;
    host.update();
    // @ts-ignore dynamic property on the fake host
    host.value = [arrayElement];
    host.update();

    single.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 0);
    arrayElement.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 1);

    // and back to a single value
    // @ts-ignore dynamic property on the fake host
    host.value = single;
    host.update();
    arrayElement.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 1);
    single.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 2);
  });

  it('14: ignores non-EventTarget values without crashing', () => {
    const host = new FakeHost();
    new WaveController(host, { value: 'selfUpdate' }, { mode: 'waveTriggersUpdate' });
    // @ts-ignore dynamic property on the fake host
    host.value = 'just a string';
    host.update();
    // @ts-ignore dynamic property on the fake host
    host.value = ['still', 'no', 'targets'];
    host.update();
    assert.equal(host.updateRequests.length, 0);
  });

  it('15: hostDisconnected detaches listeners and reconnect re-attaches them', () => {
    const host = new FakeHost();
    new WaveController(host, { source: 'selfUpdate' }, { mode: 'waveTriggersUpdate' });
    const source = new EventTarget();
    // @ts-ignore dynamic property on the fake host
    host.source = source;
    host.update();

    host.disconnect();
    source.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 0);

    // Reconnect: hostConnected requests an update, the update re-attaches
    host.connect();
    assert.ok(host.updateRequests.length > 0);
    host.updateRequests = [];
    host.update();
    source.dispatchEvent(new Event('selfUpdate'));
    assert.equal(host.updateRequests.length, 1);
  });

  it('16: does not react to waves it dispatches itself (no echo loop)', () => {
    const host = new FakeHost();
    const controller = new WaveController(
      host,
      { source: 'parentUpdate' },
      { mode: 'forwardWave' },
    );
    const source = new EventTarget();
    // @ts-ignore dynamic property on the fake host
    host.source = source;
    host.update();

    // While the controller is dispatching, incoming waves must be ignored
    const forwarded = countEvents(host, 'parentUpdate');
    host.addEventListener('parentUpdate', () => {
      // simulate the source echoing back synchronously
      source.dispatchEvent(new Event('parentUpdate'));
    });
    source.dispatchEvent(new Event('parentUpdate'));
    assert.equal(forwarded.count, 1);
    assert.equal(controller.receiveEvents, true);
  });
});
