import { it } from 'node:test';
import assert from 'node:assert/strict';
import { Validator } from '@cfworker/json-schema';
import { formatValidationError } from './formatValidationError.js';
import { en } from '../../localization/languages/en.js';
import { de } from '../../localization/languages/de.js';

/** @param {'en' | 'de'} lang */
function localize(lang) {
  const translations = /** @type {Record<string, any>} */ (lang === 'de' ? de : en);
  return {
    term: (/** @type {string} */ key, /** @type {unknown[]} */ ...args) => {
      const term = translations[key];
      assert.notEqual(term, undefined, `Missing translation: ${key}`);
      return typeof term === 'function' ? term(...args) : term;
    },
    number: (/** @type {number} */ value, /** @type {Intl.NumberFormatOptions} */ options) =>
      new Intl.NumberFormat(lang, options).format(value),
  };
}

/**
 * @param {import('../types/schema.js').JsonSchema7} schema
 * @param {unknown} value
 * @param {string} keyword
 * @param {'en' | 'de'} lang
 */
function message(schema, value, keyword, lang) {
  const result = new Validator(schema, '7', false).validate(value);
  const before = structuredClone(result);
  const error = result.errors.find(error => error.keyword === keyword);
  assert.ok(error, `Expected ${keyword} error`);
  const text = formatValidationError(error, { schema, localize: localize(lang) });
  assert.deepEqual(result, before);
  return text;
}

it('translates required fields, numeric types and formats without altering raw errors', () => {
  assert.equal(message({ required: ['name'] }, {}, 'required', 'en'), 'Please fill in this field.');
  assert.equal(
    message({ required: ['name'] }, {}, 'required', 'de'),
    'Bitte dieses Feld ausfüllen.',
  );
  assert.equal(message({ type: 'number' }, 'x', 'type', 'en'), 'Please enter a number.');
  assert.equal(message({ type: 'integer' }, 1.5, 'type', 'de'), 'Bitte eine ganze Zahl eingeben.');
  assert.equal(
    message({ format: 'email' }, 'x', 'format', 'de'),
    'Bitte eine gültige E-Mail-Adresse eingeben.',
  );
  assert.equal(message({ format: 'date' }, 'x', 'format', 'en'), 'Please enter a valid date.');
  assert.equal(message({ format: 'time' }, 'x', 'format', 'en'), 'Please enter a valid time.');
  assert.equal(
    message({ format: 'date-time' }, 'x', 'format', 'en'),
    'Please enter a valid date and time.',
  );
});

it('uses exact numeric limits, localized decimals, and singular/plural counts', () => {
  assert.equal(message({ minimum: 25.5 }, 0, 'minimum', 'de'), 'Bitte mindestens 25,5 eingeben.');
  assert.equal(message({ maximum: 25.5 }, 30, 'maximum', 'en'), 'Please enter at most 25.5.');
  assert.equal(
    message({ exclusiveMinimum: 25 }, 25, 'exclusiveMinimum', 'en'),
    'Please enter a value greater than 25.',
  );
  assert.equal(
    message({ exclusiveMaximum: 25 }, 25, 'exclusiveMaximum', 'de'),
    'Bitte einen Wert kleiner als 25 eingeben.',
  );
  assert.equal(
    message({ minLength: 1 }, '', 'minLength', 'en'),
    'Please enter at least 1 character.',
  );
  assert.equal(
    message({ maxLength: 2 }, 'abc', 'maxLength', 'en'),
    'Please enter at most 2 characters.',
  );
  assert.equal(
    message({ minItems: 1 }, [], 'minItems', 'de'),
    'Bitte mindestens 1 Eintrag angeben.',
  );
  assert.equal(
    message({ maxItems: 2 }, [1, 2, 3], 'maxItems', 'de'),
    'Bitte höchstens 2 Einträge angeben.',
  );
});

it('resolves conditional constraints and escaped property names from the failing keyword', () => {
  /** @type {import('../types/schema.js').JsonSchema7} */
  const schema = {
    properties: { 'fee/rate~': { type: 'number', minimum: 1 } },
    if: { properties: { premium: { const: true } }, required: ['premium'] },
    then: { properties: { 'fee/rate~': { minimum: 50 } } },
  };
  assert.equal(
    message(schema, { premium: true, 'fee/rate~': 10 }, 'minimum', 'de'),
    'Bitte mindestens 50 eingeben.',
  );
  assert.equal(
    message({ items: { minimum: 2 } }, [1], 'minimum', 'en'),
    'Please enter at least 2.',
  );
});

it('distinguishes selection lists from general oneOf rules and uses a safe fallback', () => {
  assert.equal(
    message({ enum: ['a', 'b'] }, 'c', 'enum', 'en'),
    'Please select an available option.',
  );
  assert.equal(
    message({ oneOf: [{ const: 'a' }, { const: 'b' }] }, 'c', 'oneOf', 'de'),
    'Bitte eine verfügbare Option auswählen.',
  );
  assert.equal(
    message({ oneOf: [{ type: 'number' }, { type: 'boolean' }] }, 'c', 'oneOf', 'en'),
    'Please check this value.',
  );
  assert.equal(message({ pattern: '^abc$' }, 'c', 'pattern', 'de'), 'Bitte diese Eingabe prüfen.');
  assert.equal(
    message(
      { definitions: { amount: { minimum: 5 } }, $ref: '#/definitions/amount' },
      1,
      'minimum',
      'de',
    ),
    'Bitte diese Eingabe prüfen.',
  );
  assert.equal(
    formatValidationError(undefined, { schema: {}, localize: localize('en') }),
    undefined,
  );
});
