import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { evaluateRule } from './evaluateRule.js';

const value = { showExtras: true, name: 'foo' };

/**
 * @param {string} effect
 * @param {boolean} matching whether the condition should match the value above
 */
function rule(effect, matching = true) {
  return {
    effect,
    condition: {
      scope: '#/properties/showExtras',
      schema: { const: matching },
    },
  };
}

describe('evaluateRule', () => {
  it('01: returns neutral options without a rule', () => {
    assert.deepEqual(evaluateRule(undefined, value), { disabled: false, hidden: false });
  });

  it('02: SHOW hides the control unless the condition matches', () => {
    assert.deepEqual(evaluateRule(rule('SHOW'), value), { disabled: false, hidden: false });
    assert.deepEqual(evaluateRule(rule('SHOW', false), value), { disabled: false, hidden: true });
  });

  it('03: HIDE hides the control when the condition matches', () => {
    assert.deepEqual(evaluateRule(rule('HIDE'), value), { disabled: false, hidden: true });
    assert.deepEqual(evaluateRule(rule('HIDE', false), value), { disabled: false, hidden: false });
  });

  it('04: ENABLE disables the control unless the condition matches', () => {
    assert.deepEqual(evaluateRule(rule('ENABLE'), value), { disabled: false, hidden: false });
    assert.deepEqual(evaluateRule(rule('ENABLE', false), value), {
      disabled: true,
      hidden: false,
    });
  });

  it('05: DISABLE disables the control when the condition matches', () => {
    assert.deepEqual(evaluateRule(rule('DISABLE'), value), { disabled: true, hidden: false });
    assert.deepEqual(evaluateRule(rule('DISABLE', false), value), {
      disabled: false,
      hidden: false,
    });
  });

  it('06: resolves the condition scope against the form value', () => {
    const nestedRule = {
      effect: 'SHOW',
      condition: {
        scope: '#/properties/person/properties/role',
        schema: { const: 'admin' },
      },
    };
    assert.deepEqual(evaluateRule(nestedRule, { person: { role: 'admin' } }), {
      disabled: false,
      hidden: false,
    });
    assert.deepEqual(evaluateRule(nestedRule, { person: { role: 'user' } }), {
      disabled: false,
      hidden: true,
    });
  });
});
