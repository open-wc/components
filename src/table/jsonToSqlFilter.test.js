import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { jsonToSqlFilter } from './jsonToSqlFilter.js';
import { jsonToFilter } from './jsonToFilter.js';

const allowedFields = new Set(['age', 'name', 'city']);

describe('jsonToSqlFilter selection values', () => {
  it('01: converts multiple selections into scalar comparisons joined by OR', () => {
    assert.deepEqual(
      jsonToSqlFilter(
        [{ field: 'name', operator: 'equal', value: ['Anna', 'Ben'] }],
        allowedFields,
      ),
      { clause: '("name" = ? OR "name" = ?)', params: ['Anna', 'Ben'] },
    );
    assert.deepEqual(
      jsonToSqlFilter([{ field: 'age', operator: 'greaterThan', value: [18, 21] }], allowedFields),
      { clause: '("age" > ? OR "age" > ?)', params: [18, 21] },
    );
    assert.deepEqual(
      jsonToSqlFilter(
        [{ field: 'name', operator: 'includes', value: ['Ann', 'Be'] }],
        allowedFields,
      ),
      { clause: '("name" LIKE ? OR "name" LIKE ?)', params: ['%Ann%', '%Be%'] },
    );
  });

  it('02: negates the whole selection rather than each choice', () => {
    /** @type {import('./filter.type.js').NestedJsonFilters} */
    const filters = [{ field: 'name', operator: 'equal', value: ['Anna', 'Ben'], negated: true }];
    assert.deepEqual(jsonToSqlFilter(filters, allowedFields), {
      clause: 'NOT (("name" = ? OR "name" = ?))',
      params: ['Anna', 'Ben'],
    });
    const matches = jsonToFilter(filters);
    assert.equal(matches({ name: 'Anna' }), false);
    assert.equal(matches({ name: 'Ben' }), false);
    assert.equal(matches({ name: 'Other' }), true);
  });

  it('03: matches nothing for an empty selection and everything for its negation', () => {
    for (const negated of [false, true]) {
      /** @type {import('./filter.type.js').NestedJsonFilters} */
      const filters = [{ field: 'name', operator: 'equal', value: [], negated }];
      assert.deepEqual(jsonToSqlFilter(filters, allowedFields), {
        clause: negated ? 'NOT (1=0)' : '1=0',
        params: [],
      });
      assert.equal(jsonToFilter(filters)({ name: 'Anna' }), negated);
    }
  });

  it('04: preserves surrounding groups and parameter order', () => {
    assert.deepEqual(
      jsonToSqlFilter(
        [
          { field: 'age', operator: 'greaterThanOrEqual', value: 18 },
          [
            { field: 'name', operator: 'equal', value: ['Anna', 'Ben'] },
            { field: 'city', operator: 'equal', value: 'Vienna' },
          ],
        ],
        allowedFields,
      ),
      {
        clause: '("age" >= ? AND (("name" = ? OR "name" = ?) OR "city" = ?))',
        params: [18, 'Anna', 'Ben', 'Vienna'],
      },
    );
  });

  it('05: keeps native array operands for overlap and containment operators', () => {
    for (const [operator, sqlOperator] of /** @type {const} */ ([
      ['some', '&&'],
      ['every', '@>'],
    ])) {
      assert.deepEqual(
        jsonToSqlFilter(
          [{ field: 'tags', operator, value: ['first', 'second'] }],
          new Set(['tags']),
        ),
        { clause: `"tags" ${sqlOperator} ?`, params: [['first', 'second']] },
      );
    }
  });

  it('06: still validates fields and operators before handling selections', () => {
    assert.throws(
      () => jsonToSqlFilter([{ field: 'unknown', operator: 'equal', value: [] }], allowedFields),
      /Disallowed field unknown/,
    );
    assert.throws(
      () => jsonToSqlFilter([{ field: 'name', operator: 'notIncludes', value: [] }], allowedFields),
      /Unsupported operator: notIncludes/,
    );
    assert.deepEqual(
      jsonToSqlFilter(
        [{ field: 'name', operator: 'equal', value: ['Anna', 'Ben'], enabled: false }],
        allowedFields,
      ),
      { clause: '1=1', params: [] },
    );
  });
});

describe('jsonToSqlFilter', () => {
  it('builds simple equality filter', () => {
    const { clause, params } = jsonToSqlFilter(
      [{ field: 'age', operator: 'equal', value: 18 }],
      allowedFields,
    );

    assert.equal(clause, '"age" = ?');
    assert.deepEqual(params, [18]);
  });

  it('ignores global search field', () => {
    const { clause, params } = jsonToSqlFilter(
      [
        { field: 'age', operator: 'equal', value: 18 },
        { field: '::globalField::', operator: 'equal', value: 18 },
      ],
      allowedFields,
    );

    assert.equal(clause, '"age" = ?');
    assert.deepEqual(params, [18]);
  });

  it('combines top-level filters with AND', () => {
    const { clause, params } = jsonToSqlFilter(
      [
        { field: 'age', operator: 'greaterThan', value: 18 },
        { field: 'name', operator: 'equal', value: 'John' },
      ],
      allowedFields,
    );

    assert.equal(clause, '("age" > ? AND "name" = ?)');
    assert.deepEqual(params, [18, 'John']);
  });

  it('nested arrays become OR at depth 1', () => {
    const { clause, params } = jsonToSqlFilter(
      [
        [
          { field: 'name', operator: 'equal', value: 'A' },
          { field: 'name', operator: 'equal', value: 'B' },
        ],
      ],
      allowedFields,
    );

    assert.equal(clause, '("name" = ? OR "name" = ?)');
    assert.deepEqual(params, ['A', 'B']);
  });

  it('handles complex nested AND/OR structure', () => {
    const { clause, params } = jsonToSqlFilter(
      [
        { field: 'age', operator: 'equal', value: 10 },
        [
          { field: 'name', operator: 'equal', value: 'A' },
          { field: 'name', operator: 'equal', value: 'B' },
          [
            { field: 'city', operator: 'equal', value: 'Vienna' },
            { field: 'city', operator: 'equal', value: 'Berlin' },
          ],
        ],
        { field: 'age', operator: 'equal', value: 99 },
      ],
      allowedFields,
    );

    assert.equal(
      clause,
      '("age" = ? AND ("name" = ? OR "name" = ? OR ("city" = ? AND "city" = ?)) AND "age" = ?)',
    );

    assert.deepEqual(params, [10, 'A', 'B', 'Vienna', 'Berlin', 99]);
  });

  it('negates filters correctly', () => {
    const { clause, params } = jsonToSqlFilter(
      [
        {
          field: 'name',
          operator: 'equal',
          value: 'John',
          negated: true,
        },
      ],
      allowedFields,
    );

    assert.equal(clause, 'NOT ("name" = ?)');
    assert.deepEqual(params, ['John']);
  });

  it('ignores disabled filters', () => {
    const { clause, params } = jsonToSqlFilter(
      [
        {
          field: 'age',
          operator: 'equal',
          value: 10,
          enabled: false,
        },
        {
          field: 'name',
          operator: 'equal',
          value: 'John',
        },
      ],
      allowedFields,
    );

    assert.equal(clause, '"name" = ?');
    assert.deepEqual(params, ['John']);
  });

  it('throws on invalid field', () => {
    assert.throws(() => {
      jsonToSqlFilter([{ field: 'DROP TABLE users', operator: 'equal', value: 1 }], allowedFields);
    });
  });

  it('throws on operators without SQL support', () => {
    /** @type {import('./filter.type.js').operator[]} */
    const inMemoryOnlyOperators = [
      'notIncludes',
      'equalNoYear',
      'notEqualNoYear',
      'greaterEqualNoYear',
      'lessEqualNoYear',
      'betweenNoYear',
    ];

    for (const operator of inMemoryOnlyOperators) {
      assert.throws(
        () => {
          jsonToSqlFilter([{ field: 'name', operator, value: 'John' }], allowedFields);
        },
        new Error(`Unsupported operator: ${operator}`),
        `expected operator "${operator}" to be rejected`,
      );
    }
  });

  it('preserves parameter order across nested structure', () => {
    const { params } = jsonToSqlFilter(
      [
        { field: 'age', operator: 'equal', value: 1 },
        [
          { field: 'name', operator: 'equal', value: 'A' },
          { field: 'name', operator: 'equal', value: 'B' },
        ],
        { field: 'city', operator: 'equal', value: 'Vienna' },
      ],
      allowedFields,
    );

    assert.deepEqual(params, [1, 'A', 'B', 'Vienna']);
  });
});
