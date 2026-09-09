import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

/** @typedef {import('./filter.test.type.js').TestRow} TestRow */
/** @typedef {import('./filter.test.type.js').TestNestedFilters} TestNestedFilters */

/** @type {TestRow[]} */
export const testRows = [
  {
    name: 'Peter',
    age: 20,
    employee: true,
    address: { city: 'Vienna', country: 'Austria' },
    contractList: [
      {
        paymentAmount: 10,
        paymentInterval: 'monthly',
        jbp: 120,
        product: { name: 'VAV Haushalt', category: 'Haushalt', provider: { name: 'VAV' } },
      },
      {
        paymentAmount: 100,
        paymentInterval: 'yearly',
        jbp: 100,
        product: {
          name: 'Standard Life Airbag',
          category: 'Lebensversicherung',
          provider: { name: 'Standard Life' },
        },
      },
    ],
    double: [{ locations: [{ x: 1, y: 1 }] }],
    child: { stockList: [{ id: 'isin1', value: 50 }] },
  },
  {
    name: 'Max',
    age: 30,
    employee: false,
    address: { city: 'Berlin', country: 'Germany' },
    contractList: [
      {
        paymentAmount: 150,
        paymentInterval: 'yearly',
        jbp: 150,
        product: { name: 'VAV Haushalt', category: 'Haushalt', provider: { name: 'VAV' } },
      },
      {
        paymentAmount: 100,
        paymentInterval: 'yearly',
        jbp: 100,
        product: {
          name: 'UNIQA Unfall',
          category: 'Unfallversicherung',
          provider: { name: 'UNIQA' },
        },
      },
    ],
    double: [{ locations: [{ x: 1, y: 2 }] }],
    child: {
      stockList: [
        { id: 'isin1', value: 30 },
        { id: 'isin2', value: 40 },
      ],
    },
  },
  {
    name: 'Sandra',
    age: 40,
    employee: true,
    address: { city: 'Vienna', country: 'Austria' },
    contractList: [
      {
        paymentAmount: 10000,
        paymentInterval: 'oneTime',
        jbp: 0,
        product: {
          name: 'Standard Life Park Allee',
          category: 'Lebensversicherung',
          provider: { name: 'Standard Life' },
        },
      },
    ],
    double: [{ locations: [{ x: 2, y: 2 }] }],
    child: { stockList: [{ id: 'isin3', value: 10 }] },
  },
  {
    name: 'Nobody',
    age: 0,
    employee: false,
    address: { city: 'Kinshasa', country: 'Kongo' },
    contractList: [
      {
        paymentAmount: 10000,
        paymentInterval: 'oneTime',
        jbp: 0,
        product: undefined,
      },
    ],
    double: [{ locations: [{ x: 0, y: 0 }] }],
    child: { stockList: [{ id: 'isin1', value: 5 }] },
  },
];
describe('resolveNestedFilters ', () => {
  it('01: executes a single filter', async () => {
    /** @type {TestNestedFilters} */
    const filter = row => row.age > 20;
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Max and Sandra
  });

  it('02: executes a flat AND', async () => {
    /** @type {TestNestedFilters} */
    const filter = row => row.age > 20 && row.employee === true;
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // Sandra
  });

  it('03: executes an OR', async () => {
    /** @type {TestNestedFilters} */
    const filter = row => row.age > 20 || row.employee === true;
    const result = testRows.filter(filter);
    assert.equal(result.length, 3); // Sandra
  });

  it('04: combination of AND and OR', async () => {
    /** @type {TestNestedFilters} */
    const filter = row => row.employee === true && (row.age > 30 || row.name === 'Peter');
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Sandra (employee + age > 30) and Peter (employee + name === 'Peter')
  });

  it('05: combination of AND and OR and AND', async () => {
    /** @type {TestNestedFilters} */
    const filter = row =>
      row.employee === true && (row.age > 30 || (row.name === 'Peter' && row.age > 10));
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Sandra (employee + age > 30) and Peter (employee + name === 'Peter' + age > 10)

    /** @type {TestNestedFilters} */
    const filter2 = row =>
      row.employee === true && (row.age > 30 || (row.name === 'Peter' && row.age > 20));
    const result2 = testRows.filter(filter2);
    assert.equal(result2.length, 1); // Sandra (employee + age > 30)
  });

  it('05: combination of AND and OR', async () => {
    /** @type {TestNestedFilters} */
    const filter = row => row.employee === true && (row.age > 3 || row.name === 'Peter');
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Sandra (employee + age > 30) and Peter (employee + name === 'Peter')
  });

  it('06: can filter a sub property', async () => {
    /** @type {TestNestedFilters} */
    const filter = row => row.address.country === 'Austria';
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter + Sandra
  });

  it('07a: can filter an array property', async () => {
    /** @type {TestNestedFilters} */
    const filter = row => row.contractList.some(contract => contract.jbp > 100);
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter and Max

    /** @type {TestNestedFilters} */
    const filter2 = row => row.contractList.some(contract => contract.jbp > 130);
    const result2 = testRows.filter(filter2);
    assert.equal(result2.length, 1); // Max
  });

  it('07b: can filter an array property sub property to Haushalt', async () => {
    /** @type {TestNestedFilters} */
    const filter = row =>
      row.contractList.some(contract => contract.product?.category === 'Haushalt');
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter and Max
  });

  it('07c: can filter an array property sub property to Unfallversicherung', async () => {
    /** @type {TestNestedFilters} */
    const filter = row =>
      row.contractList.some(contract => contract.product?.category === 'Unfallversicherung');
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // Max
  });

  it('07d: can filter an AND for multiple array properties', async () => {
    /** @type {TestNestedFilters} */
    const filter = row =>
      row.contractList.some(
        contract => contract.product?.category === 'Haushalt' && contract.paymentAmount > 50,
      );
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // Max
  });

  it('07e: can filter an OR + AND for multiple array properties', async () => {
    /** @type {TestNestedFilters} */
    const filter = row =>
      row.contractList.some(
        contract =>
          (contract.product?.category === 'Haushalt' ||
            contract.product?.category === 'Lebensversicherung') &&
          contract.paymentAmount > 50,
      );
    const result = testRows.filter(filter);
    assert.equal(result.length, 3); // Peter, Max and Sandra
  });

  it('08a: can filter array.property.array.property', async () => {
    /** @type {TestNestedFilters} */
    const filter = row => row.double.some(entry => entry.locations.some(sub => sub.x === 1));
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter and Max
  });

  it('08b: can filter array.property.array.property with AND for last property', async () => {
    /** @type {TestNestedFilters} */
    const filter = row =>
      row.double.some(entry => entry.locations.some(sub => sub.x === 1 && sub.y === 1));
    const result = testRows.filter(filter);
    assert.equal(result.length, 1); // Peter
  });

  it('50: can filter multiple fields', async () => {
    /** @type {TestNestedFilters} */
    const filter = row => row.name.includes('an') || row.address.country.includes('an');
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Sandra and Max (country = Germany)
  });

  it('51: can filter multiple values', async () => {
    /** @type {TestNestedFilters} */
    const filter = row => row.name === 'Peter' || row.name === 'Max';
    const result = testRows.filter(filter);
    assert.equal(result.length, 2); // Peter and Max
  });

  it('52: can filter the array of child property', async () => {
    /** @type {TestNestedFilters} */
    const filter = row => row.child.stockList.some(el => el.id === 'isin1');
    const result = testRows.filter(filter);
    assert.equal(result.length, 3); // Peter and Max
  });
});
