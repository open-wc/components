import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { inputListener } from './inputListener.js';
import { FormDataChangeEvent } from '../FormDataChangeEvent.js';

/**
 * Fake element capturing the events an inputListener dispatches on `this`.
 */
function eventCollector() {
  /**@type {FormDataChangeEvent[]} */
  const events = [];
  return {
    events,
    dispatchEvent: (/** @type {FormDataChangeEvent} */ event) => events.push(event),
  };
}

const uiSchema = /**@type {import("../types/schema.js").ControlElement} */ ({
  type: 'Control',
  scope: '#/properties/name',
});

describe('inputListener', () => {
  it('01: dispatches a FormDataChangeEvent with the scope as path', () => {
    const collector = eventCollector();
    inputListener(uiSchema).call(collector, { target: { value: 'foo' } });

    assert.equal(collector.events.length, 1);
    const event = collector.events[0];
    assert.equal(event instanceof FormDataChangeEvent, true);
    assert.equal(event.type, 'formDataChange');
    assert.equal(event.path, '#/properties/name');
    assert.equal(event.value, 'foo');
  });

  it('02: reads the configured data field from the target', () => {
    const collector = eventCollector();
    // @ts-ignore
    inputListener(uiSchema, 'checked').call(collector, { target: { checked: true } });
    assert.equal(collector.events[0].value, true);
  });

  it('03: applies postProcessing to the value', () => {
    const collector = eventCollector();
    inputListener(uiSchema, 'value', val => Number.parseFloat(val)).call(collector, {
      target: { value: '5.5' },
    });
    assert.equal(collector.events[0].value, 5.5);
  });

  it('04: uses an empty path without a uiSchema (full form update)', () => {
    const collector = eventCollector();
    inputListener().call(collector, { target: { value: 'ignored' } });
    assert.equal(collector.events[0].path, '');
  });
});

describe('FormDataChangeEvent', () => {
  it('01: bubbles and crosses shadow roots', () => {
    const event = new FormDataChangeEvent('formDataChange', '#/properties/name', 'foo');
    assert.equal(event.bubbles, true);
    assert.equal(event.composed, true);
    assert.equal(event.path, '#/properties/name');
    assert.equal(event.value, 'foo');
  });
});
