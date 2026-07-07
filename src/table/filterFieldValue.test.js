import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { filterFieldValue } from './filterFieldValue.js';

const data = {
  className: '1A',
  teacher: { id: '001', name: 'Donald' },
  studentList: [
    { name: 'John', overallGrade: 'A', favoriteSubject: 'art' },
    { name: 'Davis', overallGrade: 'A+', favoriteSubject: 'sport' },
    { name: 'Eric', overallGrade: 'B', favoriteSubject: 'sport' },
  ],
  school: {
    name: 'Cambridge School',
    subjectList: [
      { name: 'art', difficulty: 'hard' },
      { name: 'sport', difficulty: 'easy' },
    ],
  },
};
/** @type {import('./filter.type.js').NestedJsonFilters} */
const jsonFilters = [
  { field: 'className', operator: 'includes', value: '' },
  {
    field: 'studentList',
    operator: 'some',
    value: [{ field: 'favoriteSubject', operator: 'equal', value: 'sport' }],
  },
];
/** @type {import('./OwcTable.types.js').JsonSorter[]} */
const jsonSorters = [
  { field: 'studentList[].name', order: 'asc' },
  { field: 'school.subjectList[].name', order: 'desc' },
];

describe('filterFieldValue ', () => {
  it('01: direct string value', async () => {
    assert.deepEqual(
      filterFieldValue(data, 'className', 'className', jsonFilters, jsonSorters),
      [],
    );
  });
  it('02: array filter', () => {
    assert.deepEqual(
      filterFieldValue(data, 'studentList[].name', 'studentList[]', jsonFilters, jsonSorters),
      [data.studentList[1], data.studentList[2]],
    );
  });
});
