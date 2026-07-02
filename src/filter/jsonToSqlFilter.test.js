import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { jsonToSqlFilter } from './jsonToSqlFilter.js';

const allowedFields = new Set(['age', 'name', 'city']);

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
