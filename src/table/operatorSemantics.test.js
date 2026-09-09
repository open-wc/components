import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { evaluateOperator, getSqlOperator } from './operatorSemantics.js';
import { OPERATORS } from './operators.js';

describe('evaluateOperator', () => {
  it('01: equal/notEqual compare Dates by time, everything else strictly', () => {
    assert.equal(evaluateOperator(new Date(2024, 0, 15), new Date(2024, 0, 15), 'equal'), true);
    assert.equal(evaluateOperator(new Date(2024, 0, 15), new Date(2024, 0, 16), 'equal'), false);
    assert.equal(evaluateOperator('a', 'a', 'equal'), true);
    assert.equal(evaluateOperator(1, '1', 'equal'), false);
    assert.equal(evaluateOperator(new Date(2024, 0, 15), new Date(2024, 0, 16), 'notEqual'), true);
  });

  it('02: includes matches case-insensitively and stringifies numbers', () => {
    assert.equal(evaluateOperator('Standard Life', 'life', 'includes'), true);
    assert.equal(evaluateOperator(12345, '234', 'includes'), true);
    assert.equal(evaluateOperator('Standard', 'life', 'includes'), false);
    assert.equal(evaluateOperator('Standard Life', 'life', 'notIncludes'), false);
  });

  it('03: isEmpty is truthiness-based', () => {
    assert.equal(evaluateOperator('', 'ignored', 'isEmpty'), true);
    assert.equal(evaluateOperator(/** @type {any} */ (null), 'ignored', 'isEmpty'), true);
    assert.equal(evaluateOperator('x', 'ignored', 'isEmpty'), false);
  });

  it('04: the NoYear operators ignore the year', () => {
    const value = new Date(1999, 5, 15);
    assert.equal(evaluateOperator(value, new Date(2024, 5, 15), 'equalNoYear'), true);
    assert.equal(evaluateOperator(value, new Date(2024, 5, 16), 'notEqualNoYear'), true);
    assert.equal(evaluateOperator(value, new Date(2024, 5, 14), 'greaterEqualNoYear'), true);
    assert.equal(evaluateOperator(value, new Date(2024, 5, 16), 'lessEqualNoYear'), true);
  });

  it('05: between includes its bounds; betweenNoYear wraps across new year', () => {
    const search = { from: new Date(2024, 0, 10), to: new Date(2024, 0, 20) };
    assert.equal(evaluateOperator(new Date(2024, 0, 10), search, 'between'), true);
    assert.equal(evaluateOperator(new Date(2024, 0, 21), search, 'between'), false);

    // December → February, from > to: wraps around the turn of the year
    const wrapped = { from: new Date(2024, 11, 1), to: new Date(2024, 1, 28) };
    assert.equal(evaluateOperator(new Date(1999, 0, 15), wrapped, 'betweenNoYear'), true);
    assert.equal(evaluateOperator(new Date(1999, 5, 15), wrapped, 'betweenNoYear'), false);
  });

  it('06: an array search matches when any entry matches', () => {
    assert.equal(evaluateOperator('b', ['a', 'b'], 'equal'), true);
    assert.equal(evaluateOperator('c', ['a', 'b'], 'equal'), false);
  });

  it('07: an array row value matches when it contains the search', () => {
    assert.equal(evaluateOperator(['a', 'b'], 'b', 'equal'), true);
    assert.equal(evaluateOperator(['a', 'b'], 'c', 'equal'), false);
  });

  it('08: operators without an in-memory evaluation return false', () => {
    // some/every take nested filters, resolved by the Filter Function adapter
    assert.equal(evaluateOperator('a', 'a', 'some'), false);
    assert.equal(evaluateOperator('a', 'a', 'every'), false);
  });
});

describe('getSqlOperator', () => {
  it('01: builds parameterized clauses', () => {
    const params = /** @type {import('./filter.type.js').SqlPrimitive[]} */ ([]);
    const equalToSql = getSqlOperator('equal');
    const includesToSql = getSqlOperator('includes');
    assert.ok(equalToSql);
    assert.ok(includesToSql);
    assert.equal(equalToSql('state', 200, params), '"state" = ?');
    assert.equal(includesToSql('name', 'li', params), '"name" LIKE ?');
    assert.deepEqual(params, [200, '%li%']);
  });

  it('02: between pushes both bounds and rejects malformed values', () => {
    const params = /** @type {import('./filter.type.js').SqlPrimitive[]} */ ([]);
    const toSql = getSqlOperator('between');
    assert.ok(toSql);
    assert.equal(
      toSql('day', /** @type {any} */ ({ from: 1, to: 2 }), params),
      '"day" BETWEEN ? AND ?',
    );
    assert.deepEqual(params, [1, 2]);
    assert.throws(() => toSql('day', 5, params));
  });

  it('03: operators without SQL support return undefined on purpose', () => {
    const noSql = /** @type {import('./filter.type.js').operator[]} */ ([
      'notIncludes',
      'betweenNoYear',
      'equalNoYear',
      'notEqualNoYear',
      'greaterEqualNoYear',
      'lessEqualNoYear',
    ]);
    for (const operator of noSql) {
      assert.equal(getSqlOperator(operator), undefined, `${operator} should have no SQL support`);
    }
  });
});

describe('operator registry consistency', () => {
  const NO_EVALUATE = new Set(['some', 'every']); // nested filters, adapter recurses
  const NO_SQL = new Set([
    'notIncludes',
    'betweenNoYear',
    'equalNoYear',
    'notEqualNoYear',
    'greaterEqualNoYear',
    'lessEqualNoYear',
  ]);

  it('01: every labeled operator has semantics (evaluate or a documented gap)', () => {
    const operators = /** @type {import('./filter.type.js').operator[]} */ (Object.keys(OPERATORS));
    for (const operator of operators) {
      const hasSql = getSqlOperator(operator) !== undefined;
      if (NO_SQL.has(operator)) {
        assert.equal(hasSql, false, `${operator} unexpectedly gained SQL support`);
      } else {
        assert.equal(hasSql, true, `${operator} lost its SQL support`);
      }
      if (!NO_EVALUATE.has(operator)) {
        // must evaluate without throwing and return a boolean
        assert.equal(typeof evaluateOperator('x', 'x', operator), 'boolean');
      }
    }
  });
});
