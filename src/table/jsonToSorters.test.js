import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { jsonToSorters } from './jsonToSorters.js';

const rows = [
  { name: 'banana', price: 2, meta: { added: new Date('2024-03-01T00:00:00.000Z') } },
  { name: 'Apple', price: 3, meta: { added: new Date('2023-06-01T00:00:00.000Z') } },
  { name: 'cherry', price: 1, meta: { added: new Date('2024-01-01T00:00:00.000Z') } },
];

describe('jsonToSorters', () => {
  it('01: sorts strings case-insensitively ascending', () => {
    const sorted = [...rows].sort(jsonToSorters({ field: 'name', order: 'asc' }));
    assert.deepEqual(
      sorted.map(r => r.name),
      ['Apple', 'banana', 'cherry'],
    );
  });

  it('02: sorts strings descending', () => {
    const sorted = [...rows].sort(jsonToSorters({ field: 'name', order: 'desc' }));
    assert.deepEqual(
      sorted.map(r => r.name),
      ['cherry', 'banana', 'Apple'],
    );
  });

  it('03: sorts numbers ascending and descending', () => {
    const asc = [...rows].sort(jsonToSorters({ field: 'price', order: 'asc' }));
    assert.deepEqual(
      asc.map(r => r.price),
      [1, 2, 3],
    );

    const desc = [...rows].sort(jsonToSorters({ field: 'price', order: 'desc' }));
    assert.deepEqual(
      desc.map(r => r.price),
      [3, 2, 1],
    );
  });

  it('04: sorts dates via nested field paths', () => {
    const sorted = [...rows].sort(jsonToSorters({ field: 'meta.added', order: 'asc' }));
    assert.deepEqual(
      sorted.map(r => r.name),
      ['Apple', 'cherry', 'banana'],
    );
  });

  it('05: sortType dateNoYear compares month/day only', () => {
    const birthdays = [
      { name: 'december-elder', day: new Date('1960-12-24T00:00:00.000Z') },
      { name: 'january-younger', day: new Date('1990-01-02T00:00:00.000Z') },
    ];
    const sorted = [...birthdays].sort(
      jsonToSorters({ field: 'day', order: 'asc', sortType: 'dateNoYear' }),
    );
    // ignoring the year, January 2nd comes before December 24th
    assert.deepEqual(
      sorted.map(r => r.name),
      ['january-younger', 'december-elder'],
    );
  });

  it('06: sortType dateNoYear does not modify the original dates', () => {
    const original = new Date('1960-12-24T00:00:00.000Z');
    const a = { day: original };
    const b = { day: new Date('1990-01-02T00:00:00.000Z') };
    jsonToSorters({ field: 'day', order: 'asc', sortType: 'dateNoYear' })(a, b);
    assert.equal(original.getFullYear(), 1960);
  });

  it('07: sorts by the first entry of a nested array via "[]." paths', () => {
    const classes = [
      { room: '1A', studentList: [{ name: 'Zoe' }, { name: 'Mia' }] },
      { room: '1B', studentList: [{ name: 'Anna' }, { name: 'Yara' }] },
    ];
    const sorted = [...classes].sort(jsonToSorters({ field: 'studentList[].name', order: 'asc' }));
    // 1B wins because its alphabetically first student (Anna) beats 1A's (Mia)
    assert.deepEqual(
      sorted.map(r => r.room),
      ['1B', '1A'],
    );
  });

  it('08: array sorting puts rows with empty arrays last', () => {
    const classes = [
      { room: '1A', studentList: [] },
      { room: '1B', studentList: [{ name: 'Anna' }] },
    ];
    const sorted = [...classes].sort(jsonToSorters({ field: 'studentList[].name', order: 'asc' }));
    assert.deepEqual(
      sorted.map(r => r.room),
      ['1B', '1A'],
    );
  });

  it('09: array sorting does not reorder the nested arrays of the rows', () => {
    const classes = [
      { room: '1A', studentList: [{ name: 'Zoe' }, { name: 'Mia' }] },
      { room: '1B', studentList: [{ name: 'Anna' }] },
    ];
    [...classes].sort(jsonToSorters({ field: 'studentList[].name', order: 'asc' }));
    assert.deepEqual(
      classes[0].studentList.map(s => s.name),
      ['Zoe', 'Mia'],
    );
  });
});
