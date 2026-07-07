import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { testRows } from './filterList.test.js';
import { jsonToFilter } from './jsonToFilter.js';

/** @typedef {import('./filter.test.type.js').TestNestedFilters} TestNestedFilters */

describe('resolveNestedFilters ', () => {
  it('01: executes a single filter', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([{ field: 'age', operator: 'greaterThan', value: 20 }]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Max and Sandra
  });

  it('02: executes a flat AND', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'age', operator: 'greaterThan', value: 20 },
      { field: 'employee', operator: 'equal', value: true },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // Sandra
  });

  it('03: executes an OR if it is on the 2nd level', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      [
        { field: 'age', operator: 'greaterThan', value: 20 },
        { field: 'employee', operator: 'equal', value: true },
      ],
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 3); // Sandra
  });

  it('04: combination of AND and OR', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'employee', operator: 'equal', value: true },
      [
        { field: 'age', operator: 'greaterThan', value: 30 },
        { field: 'name', operator: 'equal', value: 'Peter' },
      ],
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Sandra (employee + age > 30) and Peter (employee + name === 'Peter')
  });

  it('05: combination of AND and OR and AND', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'employee', operator: 'equal', value: true },
      [
        { field: 'age', operator: 'greaterThan', value: 30 },
        [
          { field: 'name', operator: 'equal', value: 'Peter' },
          { field: 'age', operator: 'greaterThan', value: 10 },
        ],
      ],
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Sandra (employee + age > 30) and Peter (employee + name === 'Peter' + age > 10)

    /** @type {TestNestedFilters} */
    const filter2 = jsonToFilter([
      { field: 'employee', operator: 'equal', value: true },
      [
        { field: 'age', operator: 'greaterThan', value: 30 },
        [
          { field: 'name', operator: 'equal', value: 'Peter' },
          { field: 'age', operator: 'greaterThan', value: 20 },
        ],
      ],
    ]);
    const result2 = testRows.filter(filter2);
    assert.equal(result2.length, 1); // Sandra (employee + age > 30)
  });

  it('05: combination of AND and OR', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'employee', operator: 'equal', value: true },
      [
        { field: 'age', operator: 'greaterThan', value: 30 },
        { field: 'name', operator: 'equal', value: 'Peter' },
      ],
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Sandra (employee + age > 30) and Peter (employee + name === 'Peter')
  });

  it('06: can filter a sub property', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'address.country', operator: 'equal', value: 'Austria' },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter + Sandra
  });

  it('07a: can filter an array property', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'contractList[].jbp', operator: 'greaterThan', value: 100 },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter and Max

    /** @type {TestNestedFilters} */
    const filter2 = jsonToFilter([
      { field: 'contractList[].jbp', operator: 'greaterThan', value: 130 },
    ]);
    const result2 = testRows.filter(filter2);
    assert.equal(result2.length, 1); // Max
  });

  it('07b: can filter an array property sub property to Haushalt', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'contractList[].product.category', operator: 'equal', value: 'Haushalt' },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter and Max
  });

  it('07c: can filter an array property sub property to Unfallversicherung', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'contractList[].product.category', operator: 'equal', value: 'Unfallversicherung' },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // Max
  });

  it('07d: can filter an AND for multiple array properties', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'contractList[].product.category', operator: 'equal', value: 'Haushalt' },
      { field: 'contractList[].paymentAmount', operator: 'greaterThan', value: 50 },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter and Max
  });

  it('07e: can filter an OR + AND for multiple array properties', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      {
        field: 'contractList[].product.category',
        operator: 'equal',
        value: ['Haushalt', 'Lebensversicherung'],
      },
      { field: 'contractList[].paymentAmount', operator: 'greaterThan', value: 50 },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 3); // Peter, Max and Sandra
  });

  it('07d: still supports ORs when nesting', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      [
        {
          field: 'contractList[].product.category',
          operator: 'equal',
          value: 'Lebensversicherung',
        },
        { field: 'contractList[].jbp', operator: 'greaterThan', value: 100 },
      ],
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 3); // Peter, Max and Sandra
  });

  it('08a: can filter array.property.array.property', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([{ field: 'double[].locations[].x', operator: 'equal', value: 1 }]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter and Max
  });
  it('08b: can filter array.property.array.property with AND for last property', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'double[].locations[].x', operator: 'equal', value: 1 },
      { field: 'double[].locations[].y', operator: 'equal', value: 1 },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // Peter
  });

  it('09: ignores filters where enabled: false', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'age', operator: 'greaterThan', value: 20, enabled: false },
      { field: 'employee', operator: 'equal', value: true },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter and Sandra
  });

  it('10: can do multiple filters including arrays', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      [
        {
          field: 'name',
          operator: 'includes',
          value: 'UNIQA',
        },
        {
          field: 'contractList[].product.name',
          operator: 'includes',
          value: 'UNIQA',
        },
      ],
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // 1 uniqa contract
  });

  it('51: can filter multiple values', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([{ field: 'name', operator: 'equal', value: ['Peter', 'Max'] }]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter and Max
  });

  it('52: can filter the array of child element', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'child.stockList[].id', operator: 'equal', value: ['isin3'] },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // Peter and Max
  });

  it('60: executes a single filter for array of child property', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'child.stockList[].value', operator: 'greaterThan', value: 49 },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // Max and Sandra
  });
  it('61: executes an AND filter for array of child property and basic property', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'child.stockList[].value', operator: 'greaterThan', value: 20 },
      { field: 'name', operator: 'equal', value: 'Max' },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // Max and Sandra
  });
  it('62: executes an AND filter for array of child property and nested property', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      { field: 'child.stockList[].value', operator: 'greaterThan', value: 40 },
      { field: 'address.city', operator: 'equal', value: 'Vienna' },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // Max and Sandra
  });
  it('63: executes an OR filter for array of child property and nested property', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      [
        { field: 'child.stockList[].value', operator: 'greaterThan', value: 40 },
        { field: 'address.city', operator: 'equal', value: 'Vienna' },
      ],
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Max and Sandra
  });

  it('11: can do array "some" type filters', async () => {
    /** @type {TestNestedFilters} */
    const filter = jsonToFilter([
      {
        field: 'contractList',
        operator: 'some',
        value: [
          { field: 'product.category', operator: 'equal', value: 'Haushalt' },
          { field: 'paymentAmount', operator: 'greaterThan', value: 50 },
        ],
      },
    ]);
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // 1 uniqa contract
  });
});
