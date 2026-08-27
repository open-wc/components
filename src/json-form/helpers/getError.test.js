import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { getError } from './getError.js';
import { validateSchemaSystem } from './validateSchema.js';

/**
 * @param {string} scope
 * @returns {import("../types/schema.js").ControlElement}
 */
function control(scope) {
  return { type: 'Control', scope };
}

describe('getError', () => {
  it('01: returns undefined when there are no errors', () => {
    const error = getError(control('#/properties/name'), { valid: true, errors: [] });
    assert.equal(error, undefined);
  });

  it('02: matches errors by exact instance location', () => {
    const schema = /**@type {import("../types/schema.js").JsonSchema7} */ ({
      type: 'object',
      properties: { name: { type: 'string', minLength: 3 }, age: { type: 'integer' } },
    });
    const validatorState = validateSchemaSystem(schema, { name: 'ab', age: 5 });
    assert.equal(Boolean(getError(control('#/properties/name'), validatorState)), true);
    assert.equal(getError(control('#/properties/age'), validatorState), undefined);
  });

  it('03: matches required errors reported on the parent object', () => {
    const schema = /**@type {import("../types/schema.js").JsonSchema7} */ ({
      type: 'object',
      properties: { name: { type: 'string' }, age: { type: 'integer' } },
      required: ['name'],
    });
    const validatorState = validateSchemaSystem(schema, { age: 5 });
    const error = getError(control('#/properties/name'), validatorState);
    assert.equal(error?.keyword, 'required');
    assert.equal(getError(control('#/properties/age'), validatorState), undefined);
  });

  it('04: matches nested required errors', () => {
    const schema = /**@type {import("../types/schema.js").JsonSchema7} */ ({
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: { city: { type: 'string' } },
          required: ['city'],
        },
      },
    });
    const validatorState = validateSchemaSystem(schema, { address: { street: 'Broadway' } });
    const error = getError(control('#/properties/address/properties/city'), validatorState);
    assert.equal(error?.keyword, 'required');
  });

  it('05: matches required errors coming from an if/then branch', () => {
    const schema = /**@type {import("../types/schema.js").JsonSchema7} */ ({
      type: 'object',
      properties: { employed: { type: 'boolean' }, employer: { type: 'string' } },
      if: { properties: { employed: { const: true } }, required: ['employed'] },
      then: { required: ['employer'] },
    });
    const validatorState = validateSchemaSystem(schema, { employed: true });
    const error = getError(control('#/properties/employer'), validatorState);
    assert.equal(error?.keyword, 'required');
  });
});
