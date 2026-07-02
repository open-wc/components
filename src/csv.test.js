import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { convertToCsv } from './csv.js';
import { renderSubListAsString } from '@finum/data-table/subListHelpers.js';

const data = [
  {
    id: 1,
    firstName: 'Max',
    lastName: 'Mustermann',
    dateOfBirth: '2000-01-01',
    children: [
      { name: 'child1', age: 12 },
      { name: 'child2', age: 35 },
    ],
  },
  {
    id: 2,
    firstName: 'Susi',
    lastName: 'Musterfrau',
    dateOfBirth: '2010-01-01',
    children: [],
  },
];

describe('convertToCsv ', () => {
  it('01: direct string value', async () => {
    assert.equal(
      convertToCsv(data, { visibleColumns: [{ label: 'First Name', field: 'firstName' }] }),
      [
        //
        'Id;First Name',
        '1;Max',
        '2;Susi',
      ].join('\n'),
    );
  });
  it('02: can render sub lists', async () => {
    assert.equal(
      convertToCsv(data, {
        visibleColumns: [
          { label: 'First Name', field: 'firstName' },
          {
            label: 'Children',
            filterable: true,
            excludeGlobalSearch: true,
            field: 'children',
            filterType: 'array',
            visible: 'never',
            align: 'start',
            includeInExport: false,
          },
          {
            label: 'Children Age',
            field: 'children[].age',
            fieldFilteredReturn: 'children[]',
            formatterString: (row, { fieldValueFiltered }) =>
              renderSubListAsString(fieldValueFiltered, [child => child.name, child => child.age]),
          },
        ],
      }),
      [
        //
        'Id;First Name;Children Age',
        '1;Max;child1: 12,child2: 35',
        '2;Susi;',
      ].join('\n'),
    );
  });
  it('02b: can filter render sub lists', async () => {
    assert.equal(
      convertToCsv(data, {
        visibleColumns: [
          { label: 'First Name', field: 'firstName' },
          {
            label: 'Children Age',
            field: 'children[].age',
            fieldFilteredReturn: 'children[]',
            formatterString: (row, { fieldValueFiltered }) =>
              renderSubListAsString(fieldValueFiltered, [child => child.name, child => child.age]),
          },
        ],
        jsonFilters: [
          {
            field: 'children',
            operator: 'some',
            value: [{ field: 'age', operator: 'greaterThanOrEqual', value: 15 }],
          },
        ],
      }),
      [
        //
        'Id;First Name;Children Age',
        '1;Max;child2: 35',
        '2;Susi;',
      ].join('\n'),
    );
  });
});
