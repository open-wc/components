/**
 * Which row of the table's grid the roving focus is on, as something that
 * outlives the row's element and the row's object: the table renders only
 * part of its rows, and consumers replace their rows with new objects. Pure:
 * it knows the list the body renders, nothing of the DOM.
 */

import { GroupHeader } from './groupedList.js';

/**
 * What identifies a row of the grid.
 *
 * - `row`: a Data Row, by what `getRowId` returns for it.
 * - `object`: a row by its object, for a row that has no id to go by:
 *   `getRowId` returns `undefined`, `null` or `''` for it, as for an insert
 *   row that isn't saved yet. Once the object has an id, the row is found by
 *   that id too, so a saved row that comes back as a new object keeps it.
 * - `group`: a group header, by its group's key; the Others group has
 *   `OTHERS_GROUP_KEY`.
 * - `detail` marks the open detail of a Data Row instead of the row itself. A
 *   detail isn't an item of the list, so it is found where its Data Row is.
 *
 * @typedef {object} RowIdentity
 * @property {'row' | 'object' | 'group'} kind
 * @property {unknown} key
 * @property {true} [detail]
 */

/**
 * @template T
 * @typedef {(row: T) => unknown} GetRowId
 */

/**
 * Whether what `getRowId` returned is an id to go by.
 *
 * @param {unknown} id
 */
function isId(id) {
  return id !== undefined && id !== null && id !== '';
}

/**
 * The id of a row, `undefined` for a row `getRowId` throws for, as the
 * table's default does for a row without an id.
 *
 * @template T
 * @param {T} row
 * @param {GetRowId<T>} getRowId
 */
function idOf(row, getRowId) {
  try {
    return getRowId(row);
  } catch {
    return undefined;
  }
}

/**
 * The identity of an item of the list the body renders: Data Rows and insert
 * rows alike go by their id, and by their object until they have one.
 *
 * @template T
 * @param {T | GroupHeader} item
 * @param {object} options
 * @param {GetRowId<T>} options.getRowId the table's `getRowId`; never asked about group headers
 * @returns {RowIdentity}
 */
export function rowIdentity(item, { getRowId }) {
  if (item instanceof GroupHeader) {
    return { kind: 'group', key: item.key };
  }
  const id = idOf(item, getRowId);
  return isId(id) ? { kind: 'row', key: id } : { kind: 'object', key: item };
}

/**
 * The identity of the open detail of the Data Row with an id.
 *
 * @param {unknown} id what `getRowId` returns for the Data Row
 * @returns {RowIdentity}
 */
export function detailIdentity(id) {
  return { kind: 'row', key: id, detail: true };
}

/**
 * Whether two rows of the grid are the same row. A detail and its Data Row
 * are two rows. What stands for a row that isn't an item of the list, like
 * the header row, is a symbol, and the same row only as the same symbol.
 *
 * @param {RowIdentity | symbol | undefined} a
 * @param {RowIdentity | symbol | undefined} b
 */
export function isSameRow(a, b) {
  if (a === undefined || b === undefined) {
    return false;
  }
  if (typeof a === 'symbol' || typeof b === 'symbol') {
    return a === b;
  }
  return a.kind === b.kind && a.key === b.key && Boolean(a.detail) === Boolean(b.detail);
}

/**
 * The index of the row with an identity in the list, -1 if it isn't there.
 * It asks `getRowId` about every row before the one it finds, so call it when
 * the list changed, not on every render.
 *
 * @template T
 * @param {ReadonlyArray<T | GroupHeader>} items the list the body renders
 * @param {RowIdentity} identity
 * @param {GetRowId<T>} getRowId
 */
export function indexOfRow(items, { kind, key }, getRowId) {
  switch (kind) {
    case 'group':
      return items.findIndex(item => item instanceof GroupHeader && item.key === key);
    case 'row':
      return findById(items, key, getRowId);
    default: {
      const found = items.findIndex(item => item === key);
      // a row without an id when it was remembered, which may have one now
      const id = found < 0 ? idOf(/** @type {T} */ (key), getRowId) : undefined;
      return isId(id) ? findById(items, id, getRowId) : found;
    }
  }
}

/**
 * @template T
 * @param {ReadonlyArray<T | GroupHeader>} items
 * @param {unknown} id
 * @param {GetRowId<T>} getRowId
 */
function findById(items, id, getRowId) {
  return items.findIndex(item => !(item instanceof GroupHeader) && idOf(item, getRowId) === id);
}
