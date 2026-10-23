import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { GroupHeader, OthersGroupHeader, groupedList } from './groupedList.js';

/** @typedef {{ name: string, team: string }} Row */
/** @typedef {import('./groupedList.js').Group} Group */

/**
 * Rows named after their team and a number, e.g. `red 1`.
 *
 * @param {string[]} names
 * @returns {Row[]}
 */
function rows(...names) {
  return names.map(name => ({ name, team: name.split(' ')[0] }));
}

/**
 * Lays rows out by team, with one header per group, like the table does.
 *
 * @param {Row[]} data
 * @param {Group[]} groups
 * @param {{ othersActive?: boolean, headers?: Map<Group, GroupHeader> }} [options]
 */
function layOut(data, groups, { othersActive = false, headers = new Map() } = {}) {
  return groupedList(data, {
    groups,
    groupOf: row => row.team,
    headerFor: group => {
      const header = headers.get(group) ?? new GroupHeader(group);
      headers.set(group, header);
      return header;
    },
    others: new OthersGroupHeader({
      label: () => 'Others',
      isActive: () => othersActive,
      setActive: () => {},
    }),
  });
}

/**
 * The laid out list as text: a header as `# <label> (<row count>)`, a row as its name.
 *
 * @param {{ items: Array<Row | GroupHeader> }} list
 */
function entries({ items }) {
  return items.map(item =>
    item instanceof GroupHeader ? `# ${item.label} (${item.count})` : item.name,
  );
}

describe('groupedList', () => {
  it('orders the groups by priority, highest first, and groups of the same priority as defined', () => {
    const list = layOut(rows('red 1', 'green 1', 'blue 1', 'gray 1'), [
      { key: 'red', label: 'Red', priority: 1, active: true },
      { key: 'green', label: 'Green', priority: 3, active: true },
      { key: 'blue', label: 'Blue', active: true },
      { key: 'gray', label: 'Gray', priority: 1, active: true },
    ]);

    assert.deepEqual(entries(list), [
      '# Green (1)',
      'green 1',
      '# Red (1)',
      'red 1',
      '# Gray (1)',
      'gray 1',
      '# Blue (1)',
      'blue 1',
    ]);
  });

  it('keeps the order of the rows within each group', () => {
    const list = layOut(rows('red 3', 'blue 1', 'red 1', 'blue 2', 'red 2'), [
      { key: 'red', label: 'Red', active: true },
      { key: 'blue', label: 'Blue', active: true },
    ]);

    assert.deepEqual(entries(list), [
      '# Red (3)',
      'red 3',
      'red 1',
      'red 2',
      '# Blue (2)',
      'blue 1',
      'blue 2',
    ]);
  });

  it('lists only the header of a collapsed group, and of a group without rows', () => {
    const list = layOut(rows('red 1', 'red 2', 'blue 1'), [
      { key: 'red', label: 'Red', active: false },
      { key: 'green', label: 'Green', active: true },
      { key: 'blue', label: 'Blue', active: true },
    ]);

    assert.deepEqual(entries(list), ['# Red (2)', '# Green (0)', '# Blue (1)', 'blue 1']);
  });

  it('collects the rows of no group in a last group, which is expanded with othersActive', () => {
    const data = rows('purple 1', 'red 1', 'gray 1');
    const groups = [{ key: 'red', label: 'Red', active: true }];

    assert.deepEqual(entries(layOut(data, groups)), ['# Red (1)', 'red 1', '# Others (2)']);
    assert.deepEqual(entries(layOut(data, groups, { othersActive: true })), [
      '# Red (1)',
      'red 1',
      '# Others (2)',
      'purple 1',
      'gray 1',
    ]);
  });

  it('has no group for the rows of no group when every row has a group', () => {
    const list = layOut(rows('red 1'), [{ key: 'red', label: 'Red', active: true }], {
      othersActive: true,
    });

    assert.deepEqual(entries(list), ['# Red (1)', 'red 1']);
  });

  it('marks the header of the last group', () => {
    const groups = [
      { key: 'red', label: 'Red', active: true },
      { key: 'blue', label: 'Blue', active: true },
    ];
    const lastHeaders = (/** @type {Row[]} */ data) =>
      layOut(data, groups)
        .items.filter(item => item instanceof GroupHeader && item.last)
        .map(header => /** @type {GroupHeader} */ (header).label);

    assert.deepEqual(lastHeaders(rows('red 1', 'blue 1')), ['Blue']);
    assert.deepEqual(lastHeaders(rows('red 1', 'blue 1', 'gray 1')), ['Others']);
  });

  it('numbers the rows within their group, and the headers with -1', () => {
    const list = layOut(
      rows('red 1', 'blue 1', 'red 2', 'gray 1'),
      [
        { key: 'red', label: 'Red', active: true },
        { key: 'blue', label: 'Blue', active: true },
      ],
      { othersActive: true },
    );

    // # Red, red 1, red 2, # Blue, blue 1, # Others, gray 1
    assert.deepEqual([...list.positions], [-1, 0, 1, -1, 0, -1, 0]);
  });

  it('shows the new row counts on the headers it reuses', () => {
    const groups = [
      { key: 'red', label: 'Red', active: true },
      { key: 'blue', label: 'Blue', active: true },
    ];
    /** @type {Map<Group, GroupHeader>} */
    const headers = new Map();
    const before = layOut(rows('red 1', 'red 2', 'blue 1'), groups, { headers });

    const after = layOut(rows('red 1', 'blue 2', 'blue 1'), groups, { headers });

    assert.equal(after.items[0], before.items[0], 'the same header for the same group');
    assert.deepEqual(entries(after), ['# Red (1)', 'red 1', '# Blue (2)', 'blue 2', 'blue 1']);
  });
});

describe('GroupHeader', () => {
  it('shows the label and the colors of its group', () => {
    /** @type {Group} */
    const group = {
      key: 'red',
      label: 'Red',
      backgroundColor: 'rgb(255, 0, 0)',
      textColor: 'rgb(255, 255, 255)',
    };
    const header = new GroupHeader(group);

    assert.deepEqual(
      [header.label, header.backgroundColor, header.textColor],
      ['Red', 'rgb(255, 0, 0)', 'rgb(255, 255, 255)'],
    );
  });

  it('expands and collapses its group through the group definition', () => {
    /** @type {Group} */
    const group = { key: 'red', label: 'Red' };
    const header = new GroupHeader(group);
    assert.equal(header.active, false, 'collapsed without active');

    header.toggle();
    assert.equal(group.active, true, 'expanded');
    assert.equal(header.active, true);

    header.toggle();
    assert.equal(group.active, false, 'collapsed again');

    header.active = true;
    assert.equal(group.active, true, 'expanded by setting active');
  });
});

describe('OthersGroupHeader', () => {
  it('takes its label and whether it is expanded from callbacks, and has no colors', () => {
    let language = 'en';
    let active = false;
    const header = new OthersGroupHeader({
      label: () => (language === 'en' ? 'Others' : 'Andere'),
      isActive: () => active,
      setActive: value => {
        active = value;
      },
    });
    assert.deepEqual([header.label, header.active], ['Others', false]);
    assert.deepEqual([header.backgroundColor, header.textColor], [undefined, undefined]);

    language = 'de';
    active = true;
    assert.deepEqual([header.label, header.active], ['Andere', true], 'follows the callbacks');
  });

  it('expands and collapses through its callback', () => {
    let active = false;
    const header = new OthersGroupHeader({
      label: () => 'Others',
      isActive: () => active,
      setActive: value => {
        active = value;
      },
    });

    header.toggle();
    assert.equal(active, true, 'expanded');
    header.active = false;
    assert.equal(active, false, 'collapsed by setting active');
  });
});
