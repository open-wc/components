import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { getFieldPathContent } from './getFieldPathContent.js';
import { litTemplateToTestString } from './litTemplateToTestString.js';

import { html } from 'lit';

const data = {
  firstName: 'Max',
  lastName: 'Mustermann',
  dateOfBirth: '2000-01-01',
  age: 42,
  10: 'ten',
  nested: {
    value: 'nested.value content',
  },
};

describe('resolveFieldPath ', () => {
  it('01: direct string value', async () => {
    assert.equal(getFieldPathContent(data, { label: 'First Name', field: 'firstName' }), 'Max');
  });

  it('02: Formatter Date', async () => {
    assert.equal(
      getFieldPathContent(data, {
        label: 'Date of Birth',
        field: 'dateOfBirth',
        formatter: 'date',
      }),
      '01.01.2000',
    );
  });

  it('02a: formatter & formatterString', async () => {
    /** @type {import('./getFieldPathContent.types.js').FieldPathConfig<data>} */
    const config = {
      label: 'First Name',
      field: 'firstName',
      formatter: row => html`<span>${row.firstName}</span>`,
      formatterString: row => `${row.firstName}`,
    };
    assert.equal(litTemplateToTestString(getFieldPathContent(data, config)), '<span>Max</span>');
    assert.equal(getFieldPathContent(data, config, { renderType: 'string' }), 'Max');
  });

  it('03: render content output', async () => {
    assert.equal(
      getFieldPathContent(
        data,
        { label: 'First Name', field: 'firstName' },
        { render: ({ content }) => `PREFIX ${content} SUFIX` },
      ),
      'PREFIX Max SUFIX',
    );
  });

  it('03a: render will be ignored for string output', async () => {
    assert.equal(
      getFieldPathContent(
        data,
        { label: 'First Name', field: 'firstName', formatterString: row => `${row.firstName}` },
        { renderType: 'string', render: ({ content }) => `PREFIX ${content} SUFIX` },
      ),
      'Max',
    );
  });

  it('04: editable input', async () => {
    assert.equal(
      litTemplateToTestString(
        getFieldPathContent(data, { label: 'First Name', field: 'firstName', type: 'editable' }),
      ),
      '<owc-click-editable-input .value=Max  @submit=handleUpdate() > </owc-click-editable-input>',
    );
  });

  it('05: nested field', async () => {
    assert.equal(
      getFieldPathContent(data, { label: 'Nested Value', field: 'nested.value' }),
      'nested.value content',
    );
  });

  it('06: can provide additional options for formatters', async () => {
    assert.equal(
      getFieldPathContent(
        data,
        {
          label: 'First Name',
          field: 'firstName',
          // @ts-ignore
          formatter: (row, options) => `${options.index}: ${row.firstName} ${options.extra}`,
        },
        {
          additionalFormatterOptions: ({ data, config }) => ({
            extra: `extra ${JSON.stringify(config)} - ${data.lastName}`,
            index: 12,
          }),
        },
      ),
      '12: Max extra {"label":"First Name","field":"firstName"} - Mustermann',
    );
  });
  it('06b: can provide one additional formatter function', async () => {
    assert.equal(
      getFieldPathContent(
        data,
        { label: 'Nr.', field: '_nr', formatter: 'rownum' },
        {
          additionalFormatter: (_data, { config, content, custom }) => {
            if (config.formatter === 'rownum') {
              const index = /** @type {number} */ (custom?.index || 0);
              return `Row ${index + 1}:`;
            }
            return content;
          },
          custom: { index: 0 },
        },
      ),
      'Row 1:',
    );
  });
  it('06c: additional formatter must return the original content by default', async () => {
    assert.equal(
      getFieldPathContent(
        data,
        { label: 'First Name', field: 'firstName' },
        {
          additionalFormatter: (_data, { config, content, custom }) => {
            if (config.formatter === 'rownum') {
              const index = /** @type {number} */ (custom?.index || 0);
              return `Row ${index + 1}:`;
            }
            return content;
          },
          custom: { index: 0 },
        },
      ),
      'Max',
    );
  });
  it('07: provides default dateFormatter for dates', async () => {
    assert.equal(
      getFieldPathContent(data, {
        label: 'Date of Birth',
        field: 'dateOfBirth',
        formatter: (data, { dateFormatter }) =>
          `${dateFormatter.format(new Date(data.dateOfBirth))}`,
      }),
      '01.01.2000',
    );
  });
  it('08: Can override the existing date formatter', async () => {
    assert.equal(
      getFieldPathContent(
        data,
        {
          label: 'Date of Birth',
          field: 'dateOfBirth',
          formatter: 'date',
        },
        {
          dateFormatter: new Intl.DateTimeFormat('de-DE', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
          }),
        },
      ),
      '01. Januar 2000',
    );
  });
});
