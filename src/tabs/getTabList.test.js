import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { getTabList } from './getTabList.js';

/**
 * @param {Array<[string, unknown]>} entries
 */
function keys(entries) {
  return entries.map(([key]) => key);
}

describe('getTabList', () => {
  it('01: returns all tabs when no visibility is configured', () => {
    const tabs = { general: { label: 'General' }, other: { label: 'Other' } };
    assert.deepEqual(keys(getTabList(tabs, {})), ['general', 'other']);
  });

  it('02: filters out tabs with visible false and keeps visible true', () => {
    const tabs = {
      general: { label: 'General', visible: true },
      hidden: { label: 'Hidden', visible: false },
      other: { label: 'Other' },
    };
    assert.deepEqual(keys(getTabList(tabs, {})), ['general', 'other']);
  });

  it('03: evaluates visible functions with the given options', () => {
    const tabs = {
      admin: {
        label: 'Admin',
        visible: (/** @type {{ isAdmin?: boolean }} */ options) => options.isAdmin === true,
      },
      user: { label: 'User' },
    };
    assert.deepEqual(keys(getTabList(tabs, { isAdmin: true })), ['admin', 'user']);
    assert.deepEqual(keys(getTabList(tabs, { isAdmin: false })), ['user']);
  });

  it('04: sorts by order', () => {
    const tabs = {
      last: { label: 'Last', order: 100 },
      first: { label: 'First', order: -10 },
      middle: { label: 'Middle', order: 50 },
    };
    assert.deepEqual(keys(getTabList(tabs, {})), ['first', 'middle', 'last']);
  });

  it('05: treats missing order as 0 and keeps insertion order for ties', () => {
    const tabs = {
      a: { label: 'A' },
      b: { label: 'B', order: 0 },
      c: { label: 'C' },
      before: { label: 'Before', order: -1 },
    };
    assert.deepEqual(keys(getTabList(tabs, {})), ['before', 'a', 'b', 'c']);
  });

  it('06: returns an empty list for empty or missing tabs', () => {
    assert.deepEqual(getTabList({}, {}), []);
    assert.deepEqual(getTabList(/** @type {any} */ (undefined), {}), []);
  });

  it('07: returns entries as [key, tab] pairs', () => {
    const tab = { label: 'General', order: 1 };
    assert.deepEqual(getTabList({ general: tab }, {}), [['general', tab]]);
  });
});
