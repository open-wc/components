import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { processLabel } from './label.js';

const validatorState = { valid: true, errors: [] };

describe('processLabel', () => {
  it('01: uses label when given', () => {
    const label = processLabel({
      schema: { type: 'string' },
      uiSchema: { type: 'Control', scope: '#/properties/name', label: 'First Name' },
      validatorState,
      required: false,
      forceErrors: false,
    });
    assert.equal('First Name', label);
  });

  it('02: omits label when set to false', () => {
    const label = processLabel({
      schema: { type: 'string' },
      uiSchema: { type: 'Control', scope: '#properties/name', label: false },
      validatorState,
      required: false,
      forceErrors: false,
    });
    assert.equal('', label);
  });

  it('03: uses label in object', () => {
    const label = processLabel({
      schema: { type: 'string' },
      uiSchema: {
        type: 'Control',
        scope: '#properties/name',
        label: { show: true, text: 'First Name' },
      },
      validatorState,
      required: false,
      forceErrors: false,
    });
    assert.equal('First Name', label);
  });

  it('03a: omits label when set to false', () => {
    const label = processLabel({
      schema: { type: 'string' },
      uiSchema: {
        type: 'Control',
        scope: '#properties/name',
        label: { show: false, text: 'First Name' },
      },
      validatorState,
      required: false,
      forceErrors: false,
    });
    assert.equal('', label);
  });

  it('04: uses title from schema', () => {
    const label = processLabel({
      schema: { type: 'string', title: 'First Name' },
      uiSchema: { type: 'Control', scope: '#properties/name' },
      validatorState,
      required: false,
      forceErrors: false,
    });
    assert.equal('First Name:', label);
  });

  it('05: uses property name', () => {
    const label = processLabel({
      schema: { type: 'string' },
      uiSchema: { type: 'Control', scope: '#properties/name' },
      validatorState,
      required: false,
      forceErrors: false,
    });
    assert.equal('Name', label);
  });

  it('05a: can convert complex property names', () => {
    const label = processLabel({
      schema: { type: 'string' },
      uiSchema: { type: 'Control', scope: '#properties/longAndComplexName' },
      validatorState,
      required: false,
      forceErrors: false,
    });
    assert.equal('Long And Complex Name', label);
  });
});
