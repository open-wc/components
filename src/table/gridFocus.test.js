import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { GroupHeader, OthersGroupHeader, OTHERS_GROUP_KEY } from './groupedList.js';
import { detailIdentity, indexOfRow, isSameRow, rowIdentity } from './gridFocus.js';

/** @typedef {{ id?: string | number | null, name?: string }} Row */

/** @param {Row} row */
const getRowId = row => row.id ?? undefined;

function identify() {
  return { getRowId };
}

const others = new OthersGroupHeader({
  label: () => 'Others',
  isActive: () => true,
  setActive() {},
});

describe('rowIdentity', () => {
  it('identifies a Data Row by its id, not by its object', () => {
    const row = { id: '7', name: 'Ada' };
    assert.deepEqual(rowIdentity(row, identify()), { kind: 'row', key: '7' });
    assert.deepEqual(rowIdentity({ ...row }, identify()), rowIdentity(row, identify()));
    assert.notDeepEqual(rowIdentity({ id: '8' }, identify()), rowIdentity(row, identify()));
  });

  it('keeps the type of the id, so 7 and "7" are different rows', () => {
    assert.notDeepEqual(rowIdentity({ id: 7 }, identify()), rowIdentity({ id: '7' }, identify()));
    assert.deepEqual(rowIdentity({ id: 0 }, identify()), { kind: 'row', key: 0 });
  });

  it('identifies a row without an id by its object', () => {
    for (const id of [undefined, null, '']) {
      const row = { id };
      assert.deepEqual(rowIdentity(row, identify()), { kind: 'object', key: row });
      assert.equal(rowIdentity(row, identify()).key, row);
    }
  });

  it('identifies an insert row by its object until it has an id, then by its id', () => {
    const insertRow = { id: '' };
    const identity = rowIdentity(insertRow, identify());
    assert.equal(identity.kind, 'object');
    assert.equal(identity.key, insertRow);
    const withId = { id: 'new-1' };
    assert.deepEqual(rowIdentity(withId, identify()), { kind: 'row', key: 'new-1' });
  });

  it("identifies a row by its object when getRowId throws for it, as the table's default does for a row without an id", () => {
    const throwing = (/** @type {Row} */ row) => {
      if (row.id === undefined) {
        throw new Error('no id');
      }
      return row.id;
    };
    const insertRow = { name: 'Dan' };
    assert.deepEqual(rowIdentity(insertRow, { getRowId: throwing }), {
      kind: 'object',
      key: insertRow,
    });
    const identity = rowIdentity(insertRow, { getRowId: throwing });
    assert.equal(indexOfRow([{ id: '1' }, insertRow], identity, throwing), 1);
    assert.equal(indexOfRow([{ id: '1' }, { name: 'Dan' }], identity, throwing), -1);
  });

  it('identifies a group header by the key of its group', () => {
    const header = new GroupHeader({ key: 'vienna', label: 'Vienna' });
    assert.deepEqual(rowIdentity(header, identify()), { kind: 'group', key: 'vienna' });
    // the same group with another header object
    assert.deepEqual(
      rowIdentity(new GroupHeader({ key: 'vienna', label: 'Wien' }), identify()),
      rowIdentity(header, identify()),
    );
  });

  it('gives the Others group a key that no group definition has', () => {
    assert.deepEqual(rowIdentity(others, identify()), { kind: 'group', key: OTHERS_GROUP_KEY });
    assert.equal(typeof OTHERS_GROUP_KEY, 'symbol');
  });
});

describe('detailIdentity', () => {
  it("identifies a detail row by its Data Row's id", () => {
    assert.deepEqual(detailIdentity('7'), { kind: 'row', key: '7', detail: true });
    assert.notDeepEqual(detailIdentity('7'), rowIdentity({ id: '7' }, identify()));
  });
});

describe('isSameRow', () => {
  it('is true for the same Data Row, whatever objects stand for it', () => {
    assert.equal(isSameRow(rowIdentity({ id: '7' }, identify()), { kind: 'row', key: '7' }), true);
    assert.equal(isSameRow({ kind: 'row', key: '7' }, { kind: 'row', key: '8' }), false);
    assert.equal(isSameRow({ kind: 'row', key: '7' }, { kind: 'row', key: 7 }), false);
  });

  it('tells a detail from its Data Row, which are two rows', () => {
    assert.equal(isSameRow(detailIdentity('7'), { kind: 'row', key: '7' }), false);
    assert.equal(isSameRow(detailIdentity('7'), detailIdentity('7')), true);
  });

  it('tells a group header from a Data Row with the same key', () => {
    assert.equal(isSameRow({ kind: 'group', key: 'a' }, { kind: 'row', key: 'a' }), false);
    assert.equal(isSameRow({ kind: 'group', key: 'a' }, { kind: 'group', key: 'a' }), true);
  });

  it('compares what stands for the header row and for the empty message by itself', () => {
    const header = Symbol('header row');
    assert.equal(isSameRow(header, header), true);
    assert.equal(isSameRow(header, Symbol('header row')), false);
    assert.equal(isSameRow(header, { kind: 'row', key: '7' }), false);
  });

  it('is false while there is no row to compare with', () => {
    assert.equal(isSameRow(undefined, { kind: 'row', key: '7' }), false);
    assert.equal(isSameRow(undefined, undefined), false);
  });
});

describe('indexOfRow', () => {
  const ada = { id: '1', name: 'Ada' };
  const bob = { id: '2', name: 'Bob' };
  const cleo = { id: '3', name: 'Cleo' };

  it('finds a Data Row among new objects with the same ids', () => {
    const identity = rowIdentity(bob, identify());
    assert.equal(indexOfRow([ada, bob, cleo], identity, getRowId), 1);
    assert.equal(indexOfRow([{ ...cleo }, { ...ada }, { ...bob }], identity, getRowId), 2);
  });

  it('is -1 for a row that is gone', () => {
    assert.equal(indexOfRow([ada, cleo], rowIdentity(bob, identify()), getRowId), -1);
    assert.equal(indexOfRow([], rowIdentity(bob, identify()), getRowId), -1);
  });

  it('finds a row without an id by its object only', () => {
    const insertRow = { id: '' };
    const identity = rowIdentity(insertRow, identify());
    assert.equal(indexOfRow([ada, bob, insertRow], identity, getRowId), 2);
    assert.equal(indexOfRow([ada, bob, { ...insertRow }], identity, getRowId), -1);
  });

  it('still finds an insert row by its object once it is a Data Row with an id', () => {
    const insertRow = { id: '', name: 'Dan' };
    const identity = rowIdentity(insertRow, identify());
    insertRow.id = '4';
    assert.equal(indexOfRow([ada, insertRow, bob], identity, getRowId), 1);
  });

  it('finds an insert row that got an id by that id, also as a new object', () => {
    const insertRow = { id: '', name: 'Dan' };
    const identity = rowIdentity(insertRow, identify());
    // saved: the row got its id, and comes back as a new object with it
    insertRow.id = '4';
    assert.equal(indexOfRow([ada, { id: '4', name: 'Dan' }, bob], identity, getRowId), 1);
  });

  it('finds an insert row with an id among new objects with the same id', () => {
    const insertRow = { id: 'new-1' };
    const identity = rowIdentity(insertRow, identify());
    assert.equal(indexOfRow([ada, bob, { id: 'new-1' }], identity, getRowId), 2);
  });

  it('finds a group header by the key of its group, and never asks a header for a row id', () => {
    const vienna = new GroupHeader({ key: 'vienna', label: 'Vienna' });
    const graz = new GroupHeader({ key: 'graz', label: 'Graz' });
    const items = [vienna, ada, graz, bob, others, cleo];
    /** @param {Row} item */
    const strictRowId = item => {
      assert.ok(!(item instanceof GroupHeader), 'asked a group header for its row id');
      return item.id ?? undefined;
    };
    const find = (/** @type {Row | GroupHeader} */ item) =>
      indexOfRow(items, rowIdentity(item, { getRowId: strictRowId }), strictRowId);
    assert.equal(find(graz), 2);
    assert.equal(find(new GroupHeader({ key: 'graz', label: 'Graz' })), 2);
    assert.equal(find(others), 4);
    assert.equal(find(bob), 3);
    assert.equal(find(new GroupHeader({ key: 'linz', label: 'Linz' })), -1);
  });

  it("finds a detail row at its Data Row's place", () => {
    assert.equal(indexOfRow([ada, bob, cleo], detailIdentity('3'), getRowId), 2);
  });
});
