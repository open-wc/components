import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { normalizeAutofillOptions } from './autofill.js';

describe('normalizeAutofillOptions', () => {
  const scope = '#/properties/iban';

  it('normalizes a scalar value to the control scope', () => {
    assert.deepEqual(
      normalizeAutofillOptions({
        type: 'Control',
        scope,
        options: { autofill: [{ label: 'Main account', value: 'AT12' }] },
      }),
      [{ label: 'Main account', value: 'AT12', fill: { [scope]: 'AT12' } }],
    );
  });

  it('keeps multi-field fills intact', () => {
    const fill = { [scope]: 'AT12', '#/properties/bic': 'EXAMPLEAT' };
    assert.deepEqual(
      normalizeAutofillOptions({
        type: 'Control',
        scope,
        options: { autofill: [{ label: 'Main account', fill }] },
      }),
      [{ label: 'Main account', value: 'AT12', fill }],
    );
  });

  it('requires exactly one preset representation and the control scope', () => {
    assert.throws(() =>
      normalizeAutofillOptions({
        type: 'Control',
        scope,
        options: { autofill: [{ label: 'Invalid' }] },
      }),
    );
    assert.throws(() =>
      normalizeAutofillOptions({
        type: 'Control',
        scope,
        options: { autofill: [{ label: 'Invalid', fill: { '#/properties/bic': 'EXAMPLEAT' } }] },
      }),
    );
  });
});
