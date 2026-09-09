import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { renderSubListAsString } from '@open-wc/components/table/subListHelpers.js';
import { convertToExcel } from './excel.js';

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

describe('convertToExcel ', () => {
  it('01: direct string value', async () => {
    assert.equal(
      convertToExcel(data, { visibleColumns: [{ label: 'First Name', field: 'firstName' }] }),
      [
        //
        '"Id"\t"First Name"',
        '"1"\t"Max"',
        '"2"\t"Susi"',
      ].join('\n'),
    );
  });
  it('02: can render sub lists', async () => {
    assert.equal(
      convertToExcel(data, {
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
      }),
      [
        //
        '"Id"\t"First Name"	"Children Age"',
        '"1"\t"Max"	"child1: 12,child2: 35"',
        '"2"\t"Susi"	""',
      ].join('\n'),
    );
  });
});
