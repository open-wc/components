import { render } from 'lit';
import { fixture, html, expect, nextFrame, oneEvent } from '@open-wc/testing';
import { OwcLayoutSidebar } from '@open-wc/components/OwcLayoutSidebar.js';
import { OwcTableMassEdit } from '@open-wc/components/OwcTableMassEdit.js';
import { OwcTable } from './OwcTable.js';
import {
  expectItemsCover,
  scrollInSameFrame,
  scrollTo,
  untilStable,
  visibleArea,
} from '../virtualizer/virtualList.test-browser.helpers.js';

customElements.define('owc-table', OwcTable);
customElements.define('owc-layout-sidebar', OwcLayoutSidebar);
customElements.define('owc-table-mass-edit', OwcTableMassEdit);

/** @typedef {OwcTable<{ id: string, firstName: string, age: number, team?: string }>} Table */

const columns = [
  { label: 'First Name', field: 'firstName' },
  { label: 'Age', field: 'age', formatter: 'number' },
];

/** @param {number} count */
function rows(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    firstName: `Person ${index}`,
    age: index,
  }));
}

/**
 * Rows whose teams take turns, so the rows of every group are interleaved in the data.
 *
 * @param {number} count
 * @param {string[]} [teams]
 */
function teamRows(count, teams = ['red', 'green', 'blue']) {
  return rows(count).map((row, index) => ({ ...row, team: teams[index % teams.length] }));
}

/**
 * New group definitions for every table, since toggling a group changes its definition.
 * They show in the order green, red, blue (by priority), and green starts collapsed.
 *
 * @param {{ red?: boolean, green?: boolean, blue?: boolean }} [active]
 */
function teamGroups({ red = true, green = false, blue = true } = {}) {
  return [
    { key: 'red', label: 'Red team', priority: 1, active: red },
    {
      key: 'green',
      label: 'Green team',
      priority: 3,
      active: green,
      backgroundColor: 'rgb(0, 128, 0)',
      textColor: 'rgb(255, 255, 255)',
    },
    { key: 'blue', label: 'Blue team', active: blue },
  ];
}

/** @param {{ team?: string }} row */
const byTeam = row => String(row.team);

/** @param {Table} el */
function rowContainers(el) {
  return /** @type {HTMLElement[]} */ ([
    ...(el.shadowRoot?.querySelectorAll('#data-table .table-body .row-container') ?? []),
  ]);
}

/** @param {Table} el */
function groupHeaders(el) {
  return /** @type {HTMLElement[]} */ ([
    ...(el.shadowRoot?.querySelectorAll('#data-table .table-body .group-label-container') ?? []),
  ]);
}

/**
 * The rendered items of the table body in display order: the rows, and in
 * grouped tables the group headers.
 *
 * @param {Table} el
 */
function listItems(el) {
  return /** @type {HTMLElement[]} */ ([
    ...(el.shadowRoot?.querySelectorAll(
      '#data-table .table-body .row-container, #data-table .table-body .group-label-container',
    ) ?? []),
  ]);
}

/**
 * Indexes of the rendered rows in the table's display order.
 *
 * @param {Table} el
 */
function renderedIndexes(el) {
  return rowContainers(el).map(container =>
    Number(/** @type {HTMLElement} */ (container.querySelector('.row')).dataset.index),
  );
}

/** @param {Table} el */
function tableBody(el) {
  return /** @type {HTMLElement} */ (el.shadowRoot?.querySelector('#data-table .table-body'));
}

/** @param {HTMLElement} container */
function nameIn(container) {
  return container.querySelector('.row .cell .cell-text')?.textContent?.trim();
}

/**
 * @param {Table} el
 * @param {string} label
 */
function groupHeader(el, label) {
  const header = groupHeaders(el).find(element =>
    element.querySelector('.group-label')?.textContent?.trim().startsWith(label),
  );
  if (!header) {
    throw new Error(`no group header ${label}`);
  }
  return header;
}

/**
 * The rendered items of the table body in display order: a group header as
 * `# <label> <row count> <chevron>`, a row as its first name.
 *
 * @param {Table} el
 */
function bodyEntries(el) {
  return listItems(el).map(element => {
    if (!element.classList.contains('group-label-container')) {
      return nameIn(element);
    }
    const label = element.querySelector('.group-label')?.textContent?.replace(/\s+/g, ' ').trim();
    return `# ${label} ${element.querySelector('wa-icon')?.getAttribute('name')}`;
  });
}

class TestDisplayContentsScrollBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host { display: block; }
        #scroller { height: 300px; overflow: auto; }
        slot { display: contents; overflow: hidden; }
      </style>
      <div id="scroller"><slot></slot></div>
    `;
  }

  get scroller() {
    return /** @type {HTMLElement} */ (this.shadowRoot?.querySelector('#scroller'));
  }
}

customElements.define('test-display-contents-scroll-box', TestDisplayContentsScrollBox);

/**
 * A scroll area whose scroll box sits in a closed shadow root. A closed root
 * doesn't reveal the slot its children are assigned to, so the table can't
 * detect the scroll box from inside.
 */
class TestClosedScrollArea extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'closed' });
    root.innerHTML = `
      <style>
        :host { display: block; }
        #scroller { height: 300px; overflow: auto; }
      </style>
      <div id="scroller"><slot></slot></div>
    `;
    /** The scroll box, which only the element itself can hand out. */
    this.scroller = /** @type {HTMLElement} */ (root.querySelector('#scroller'));
  }
}

customElements.define('test-closed-scroll-area', TestClosedScrollArea);

/**
 * Renders a table in a scroll container.
 *
 * @typedef {(table: import('lit').TemplateResult) => Promise<{ el: Table, scroller: Element }>} ContainerFixture
 * @type {Record<string, ContainerFixture>}
 */
const containers = {
  'the document': async table => {
    const el = /** @type {Table} */ (await fixture(table));
    return { el, scroller: /** @type {Element} */ (document.scrollingElement) };
  },
  'a consumer scroll box': async table => {
    const box = await fixture(html`<div style="height: 300px; overflow: auto">${table}</div>`);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await el.updateComplete;
    return { el, scroller: box };
  },
  'a scroll box with a display: contents slot': async table => {
    const box = /** @type {TestDisplayContentsScrollBox} */ (
      await fixture(
        html`<test-display-contents-scroll-box>${table}</test-display-contents-scroll-box>`,
      )
    );
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await el.updateComplete;
    return { el, scroller: box.scroller };
  },
  'the owc-layout-sidebar content area': async table => {
    const sidebar = await fixture(html`<owc-layout-sidebar>${table}</owc-layout-sidebar>`);
    const el = /** @type {Table} */ (sidebar.querySelector('owc-table'));
    await el.updateComplete;
    return { el, scroller: /** @type {Element} */ (sidebar.shadowRoot?.querySelector('#content')) };
  },
};

/**
 * Waits until the rendered rows stay the same for a few frames.
 *
 * @param {Table} el
 */
function settle(el) {
  return untilStable(el, () => bodyEntries(el).join());
}

/**
 * Asserts that the rendered rows, and group headers, cover the visible part of the table body.
 *
 * @param {Table} el
 * @param {Element} scroller
 */
function expectCovered(el, scroller) {
  expectItemsCover(scroller, tableBody(el), listItems(el));
}

/** Deterministic scroll positions spread over a scroll container, so failures reproduce. */
function jumpPositions(max, jumps = 5) {
  let seed = 7;
  return Array.from({ length: jumps }, () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return Math.round((seed / 2_147_483_648) * max);
  });
}

/**
 * @param {number} count
 * @param {Record<string, unknown>} [attributes]
 */
async function tableInBox(count, { mode = 'auto' } = {}) {
  const box = await fixture(html`
    <div style="height: 300px; overflow: auto">
      <owc-table virtualizer-mode=${mode} .columns=${columns} .data=${rows(count)}></owc-table>
    </div>
  `);
  const el = /** @type {Table} */ (box.querySelector('owc-table'));
  await settle(el);
  return { box, el };
}

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table virtualization', () => {
  it('renders the first rows in its first update', async () => {
    const el = /** @type {Table} */ (document.createElement('owc-table'));
    el.columns = columns;
    el.data = rows(1_000);
    /** @type {number[]} */
    const renderedPerUpdate = [];
    el.addController({ hostUpdated: () => renderedPerUpdate.push(rowContainers(el).length) });
    const wrapper = await fixture(html`<div></div>`);
    wrapper.append(el);
    await el.updateComplete;

    expect(renderedPerUpdate[0]).to.be.within(1, 100);
  });

  for (const [mode, count, virtualized] of /** @type {const} */ ([
    ['auto', 299, false],
    ['auto', 300, true],
    ['always', 50, true],
    ['never', 1_000, false],
  ])) {
    it(`${virtualized ? 'virtualizes' : 'renders every row of'} ${count} Data Rows in ${mode} mode`, async () => {
      const { el } = await tableInBox(count, { mode });

      if (virtualized) {
        expect(rowContainers(el).length).to.be.below(count);
      } else {
        expect(rowContainers(el).length).to.equal(count);
      }
    });
  }

  it('does not count insert rows toward the automatic threshold', async () => {
    const { el } = await tableInBox(299);
    el.insertData = [
      { id: 'new-1', firstName: 'New 1', age: 1 },
      { id: 'new-2', firstName: 'New 2', age: 2 },
    ];
    await settle(el);

    expect(rowContainers(el).length).to.equal(301);
  });

  it('leaves no stale sizing behind when crossing the threshold or changing the amount of data', async () => {
    const { box, el } = await tableInBox(299);
    await scrollTo(box, 3_000);

    for (const count of [300, 301, 299, 10_000, 3, 10_000]) {
      el.data = rows(count);
      await settle(el);
      expectCovered(el, box);
      const containers = rowContainers(el);
      const rowHeight = containers[0].getBoundingClientRect().height;
      const bodyHeight = tableBody(el).getBoundingClientRect().height;
      if (containers.length === count) {
        const renderedHeight = containers.reduce(
          (sum, container) => sum + container.getBoundingClientRect().height,
          0,
        );
        expect(bodyHeight, `body height for ${count} rows`).to.be.closeTo(renderedHeight, 1);
      } else {
        expect(bodyHeight, `body height for ${count} rows`).to.be.closeTo(count * rowHeight, 1);
      }
    }
  });

  for (const [name, render] of Object.entries(containers)) {
    for (const grouped of [false, true]) {
      it(`covers the visible area ${grouped ? 'of a grouped table ' : ''}in ${name} at the top, the middle, the end and after jumps`, async () => {
        const { el, scroller } = await render(
          grouped
            ? html`<owc-table
                .columns=${columns}
                .groupList=${teamGroups({ green: true })}
                .groupSelector=${byTeam}
                .data=${teamRows(10_000)}
              ></owc-table>`
            : html`<owc-table .columns=${columns} .data=${rows(10_000)}></owc-table>`,
        );
        await settle(el);
        expectCovered(el, scroller);

        const max = scroller.scrollHeight - scroller.clientHeight;
        for (const top of [max / 2, max, 0, ...jumpPositions(max)]) {
          await scrollTo(scroller, top);
          await settle(el);
          expectCovered(el, scroller);
        }
      });
    }
  }

  it('shows the last row of a grouped table with 100k Data Rows at the end and keeps the rendered rows bounded', async () => {
    const { box, el } = await groupedTableInBox(100_000);

    await scrollTo(box, box.scrollHeight);
    await settle(el);
    const items = listItems(el);
    // blue is the last group and holds every third row, starting at the third
    expect(nameIn(items[items.length - 1])).to.equal('Person 99998');
    expect(items.at(-1)?.getBoundingClientRect().bottom).to.be.closeTo(
      box.getBoundingClientRect().bottom,
      1,
    );

    const itemHeight = items[0].getBoundingClientRect().height;
    const bound = Math.ceil((3 * 300) / itemHeight) + 2;
    for (const top of [0, 2_000_000, 4_000_000]) {
      await scrollTo(box, top);
      await settle(el);
      expect(listItems(el).length, `rendered items at ${top}px`).to.be.at.most(bound);
    }
  });

  it('shows the last of 100k Data Rows at the end and keeps the rendered rows bounded', async () => {
    const { box, el } = await tableInBox(100_000);

    await scrollTo(box, box.scrollHeight);
    await settle(el);
    const containers = rowContainers(el);
    expect(renderedIndexes(el).at(-1)).to.equal(99_999);
    expect(nameIn(containers[containers.length - 1])).to.equal('Person 99999');
    expect(containers.at(-1)?.getBoundingClientRect().bottom).to.be.closeTo(
      box.getBoundingClientRect().bottom,
      1,
    );

    // at most the visible 300px and a buffer of the same size on both sides
    const rowHeight = containers[0].getBoundingClientRect().height;
    const bound = Math.ceil((3 * 300) / rowHeight) + 2;
    for (const top of [0, 2_000_000, 4_000_000]) {
      await scrollTo(box, top);
      await settle(el);
      expect(rowContainers(el).length, `rendered rows at ${top}px`).to.be.at.most(bound);
    }
  });

  it('sets visibleData to the rendered Data Rows in the same update that renders them', async () => {
    const { box, el } = await tableInBox(10_000);
    let updates = 0;
    el.addController({ hostUpdated: () => updates++ });

    // scroll from a task of its own, so only the scroll event can update the table
    await new Promise(resolve => setTimeout(resolve));
    const scrolled = new Promise(resolve =>
      box.addEventListener('scroll', resolve, { once: true }),
    );
    box.scrollTop = 200_000;
    await scrolled;
    await el.updateComplete;

    expect(updates).to.equal(1);
    const indexes = renderedIndexes(el);
    expect(indexes[0]).to.be.above(0);
    expect(el.visibleData).to.deep.equal(indexes.map(index => el.processedData[index]));
  });

  it('shows the right rows after sorting, filtering and replacing data while scrolled down', async () => {
    const { box, el } = await tableInBox(10_000);
    await scrollTo(box, 150_000);
    await settle(el);

    const expectRowsInDisplayOrder = () => {
      const indexes = renderedIndexes(el);
      expect(indexes.length).to.be.above(0);
      indexes.forEach((index, position) => {
        expect(index, 'consecutive indexes').to.equal(indexes[0] + position);
      });
      const names = rowContainers(el).map(nameIn);
      expect(names).to.deep.equal(indexes.map(index => el.processedData[index].firstName));
      expect(new Set(names).size, 'unique rows').to.equal(names.length);
      expect(el.visibleData).to.deep.equal(indexes.map(index => el.processedData[index]));
      expectCovered(el, box);
    };

    el.jsonSorters = [{ field: 'age', order: 'desc' }];
    await settle(el);
    expectRowsInDisplayOrder();
    expect(el.processedData[0].age).to.equal(9_999);

    el.jsonFilters = [{ field: 'age', operator: 'lessThan', value: 5_000 }];
    await settle(el);
    expectRowsInDisplayOrder();

    el.data = rows(20_000).reverse();
    await settle(el);
    expectRowsInDisplayOrder();
  });

  it('covers the visible area once a hidden table is shown', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto; display: none">
        <owc-table .columns=${columns} .data=${rows(10_000)}></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);

    /** @type {HTMLElement} */ (box).style.display = 'block';
    await settle(el);
    expectCovered(el, box);
    await scrollTo(box, 100_000);
    await settle(el);
    expectCovered(el, box);
  });

  it('covers the visible area after being reconnected while scrolled down', async () => {
    const { box, el } = await tableInBox(10_000);
    await scrollTo(box, 150_000);
    await settle(el);

    el.remove();
    await nextFrame();
    box.append(el);
    await settle(el);
    expectCovered(el, box);
    await scrollTo(box, 250_000);
    await settle(el);
    expectCovered(el, box);
  });
});

/**
 * Clicks a group header like a user does.
 *
 * @param {Table} el
 * @param {string} label
 */
async function toggleGroup(el, label) {
  /** @type {HTMLElement} */ (groupHeader(el, label).querySelector('.row-click')).click();
  await settle(el);
}

/**
 * A grouped table in a 300px scroll box, with every group expanded.
 *
 * @param {number} count
 * @param {{ mode?: string }} [options]
 */
async function groupedTableInBox(count, { mode = 'auto' } = {}) {
  const box = await fixture(html`
    <div style="height: 300px; overflow: auto">
      <owc-table
        virtualizer-mode=${mode}
        .columns=${columns}
        .groupList=${teamGroups({ green: true })}
        .groupSelector=${byTeam}
        .data=${teamRows(count)}
      ></owc-table>
    </div>
  `);
  const el = /** @type {Table} */ (box.querySelector('owc-table'));
  await settle(el);
  return { box, el };
}

describe('owc-table groups', () => {
  for (const [mode, count, virtualized] of /** @type {const} */ ([
    ['auto', 299, false],
    ['auto', 300, true],
    ['always', 50, true],
    ['never', 1_000, false],
  ])) {
    it(`${virtualized ? 'virtualizes' : 'renders every row of'} a grouped table with ${count} Data Rows in ${mode} mode`, async () => {
      const { el } = await groupedTableInBox(count, { mode });

      if (virtualized) {
        expect(rowContainers(el).length).to.be.below(count);
      } else {
        expect(rowContainers(el).length).to.equal(count);
      }
      expect(groupHeaders(el).length, 'group headers').to.be.within(1, 3);
    });
  }

  it('does not count group headers and insert rows toward the automatic threshold', async () => {
    const { el } = await groupedTableInBox(299);
    el.insertData = [
      { id: 'new-1', firstName: 'New 1', age: 1, team: 'red' },
      { id: 'new-2', firstName: 'New 2', age: 2, team: 'blue' },
    ];
    await settle(el);

    expect(rowContainers(el).length).to.equal(301);
  });

  it('shows group headers by priority with their colors, row counts and chevrons, and the remaining rows under Others', async () => {
    const el = /** @type {Table} */ (
      await fixture(html`
        <owc-table
          .columns=${columns}
          .groupList=${teamGroups()}
          .groupSelector=${byTeam}
          .data=${teamRows(8, ['red', 'green', 'blue', 'purple'])}
        ></owc-table>
      `)
    );
    await settle(el);

    expect(bodyEntries(el)).to.deep.equal([
      '# Green team 2 chevron-right',
      '# Red team 2 chevron-down',
      'Person 0',
      'Person 4',
      '# Blue team 2 chevron-down',
      'Person 2',
      'Person 6',
      '# Others 2 chevron-right',
    ]);
    const green = groupHeader(el, 'Green team');
    expect(getComputedStyle(green).backgroundColor).to.equal('rgb(0, 128, 0)');
    expect(
      getComputedStyle(/** @type {Element} */ (green.querySelector('.group-label'))).color,
    ).to.equal('rgb(255, 255, 255)');
    expect(green.querySelector('wa-badge')?.textContent?.trim()).to.equal('2');
    // only the last list entry gets the rounded bottom corners
    expect(groupHeader(el, 'Others').classList.contains('last-row')).to.equal(true);
    expect(groupHeader(el, 'Blue team').classList.contains('last-row')).to.equal(false);

    await toggleGroup(el, 'Others');
    expect(bodyEntries(el).slice(-3)).to.deep.equal([
      '# Others 2 chevron-down',
      'Person 3',
      'Person 7',
    ]);
    expect(groupHeader(el, 'Others').classList.contains('last-row')).to.equal(false);
    expect(rowContainers(el).at(-1)?.classList.contains('last-row')).to.equal(true);
  });

  it('groups and ungroups its rows when the groups are set after the first render', async () => {
    const el = /** @type {Table} */ (
      await fixture(html`
        <owc-table .columns=${columns} .data=${teamRows(6, ['red', 'green', 'purple'])}></owc-table>
      `)
    );
    await settle(el);
    expect(groupHeaders(el)).to.be.empty;

    el.groupSelector = byTeam;
    el.groupList = teamGroups();
    await settle(el);
    expect(bodyEntries(el)).to.deep.equal([
      '# Green team 2 chevron-right',
      '# Red team 2 chevron-down',
      'Person 0',
      'Person 3',
      '# Blue team 0 chevron-down',
      '# Others 2 chevron-right',
    ]);

    el.othersGroupActive = true;
    await settle(el);
    expect(bodyEntries(el).slice(-3)).to.deep.equal([
      '# Others 2 chevron-down',
      'Person 2',
      'Person 5',
    ]);

    el.groupList = [];
    await settle(el);
    expect(bodyEntries(el)).to.deep.equal([
      'Person 0',
      'Person 1',
      'Person 2',
      'Person 3',
      'Person 4',
      'Person 5',
    ]);
  });

  it('numbers rows within their group', async () => {
    const el = /** @type {Table} */ (
      await fixture(html`
        <owc-table
          .columns=${[{ label: 'Nr.', formatter: 'rownum' }, ...columns]}
          .groupList=${teamGroups({ green: true })}
          .groupSelector=${byTeam}
          .data=${teamRows(6)}
        ></owc-table>
      `)
    );
    await settle(el);

    const numbers = rowContainers(el).map(container =>
      container.querySelector('.row > .cell')?.textContent?.trim(),
    );
    expect(numbers).to.deep.equal(['1', '2', '1', '2', '1', '2']);
  });

  it('resolves row clicks and selection to the clicked row in every group', async () => {
    const el = /** @type {Table} */ (
      await fixture(html`
        <owc-table
          selectable
          .columns=${columns}
          .groupList=${teamGroups({ green: true })}
          .groupSelector=${byTeam}
          .data=${teamRows(9)}
        ></owc-table>
      `)
    );
    await settle(el);
    /** @param {HTMLElement} container */
    const cells = container =>
      /** @type {HTMLElement[]} */ ([...container.querySelectorAll('.row > .cell')]);
    const rowNamed = (/** @type {string} */ name) => {
      const container = rowContainers(el).find(row => cells(row)[1].textContent?.trim() === name);
      if (!container) {
        throw new Error(`no row ${name}`);
      }
      return container;
    };

    /** @type {string[]} */
    const clicked = [];
    el.addEventListener('rowClick', event =>
      clicked.push(/** @type {import('./RowClickEvent.js').RowClickEvent} */ (event).row.firstName),
    );
    for (const container of rowContainers(el)) {
      cells(container)[1].click();
    }
    expect(clicked).to.deep.equal([
      'Person 1',
      'Person 4',
      'Person 7',
      'Person 0',
      'Person 3',
      'Person 6',
      'Person 2',
      'Person 5',
      'Person 8',
    ]);

    cells(rowNamed('Person 4'))[0].click();
    cells(rowNamed('Person 5'))[0].click();
    await settle(el);
    expect(el.selectedData.map(row => row.firstName)).to.deep.equal(['Person 4', 'Person 5']);
    const checked = rowContainers(el)
      .filter(
        container =>
          /** @type {HTMLInputElement} */ (container.querySelector('wa-checkbox')).checked,
      )
      .map(container => cells(container)[1].textContent?.trim());
    expect(checked).to.deep.equal(['Person 4', 'Person 5']);
  });

  it('removes and adds the rows of a group when it collapses and expands while scrolled down', async () => {
    const { box, el } = await groupedTableInBox(3_000);
    // the red team's header follows the green team's 1,000 rows
    const averageHeight = tableBody(el).getBoundingClientRect().height / 3_003;
    await scrollTo(box, 1_001 * averageHeight - 100);
    await settle(el);
    const header = () => groupHeader(el, 'Red team');
    await scrollTo(
      box,
      box.scrollTop + header().getBoundingClientRect().top - box.getBoundingClientRect().top - 120,
    );
    await settle(el);
    const top = header().getBoundingClientRect().top;
    /** The entries from the red team's header on. */
    const fromRedHeader = () => {
      const entries = bodyEntries(el);
      return entries.slice(entries.findIndex(entry => entry?.startsWith('# Red team')));
    };

    await toggleGroup(el, 'Red team');
    expect(fromRedHeader().slice(0, 4)).to.deep.equal([
      '# Red team 1000 chevron-right',
      '# Blue team 1000 chevron-down',
      'Person 2',
      'Person 5',
    ]);
    expect(header().getBoundingClientRect().top, 'header position').to.be.closeTo(top, 1);
    expectCovered(el, box);

    await toggleGroup(el, 'Red team');
    expect(fromRedHeader().slice(0, 3)).to.deep.equal([
      '# Red team 1000 chevron-down',
      'Person 0',
      'Person 3',
    ]);
    expect(header().getBoundingClientRect().top, 'header position').to.be.closeTo(top, 1);
    expectCovered(el, box);
  });

  /** Resolves once the `handleUpdate` below has saved the latest edit. */
  let saved = Promise.resolve();
  for (const [name, handleUpdate] of /** @type {const} */ ([
    ['', undefined],
    [
      ' once handleUpdate saved it',
      (/** @type {{ autoSetData: () => void }} */ { autoSetData }) => {
        saved = new Promise(resolve => setTimeout(resolve)).then(autoSetData);
        return saved;
      },
    ],
  ])) {
    it(`moves a row to its new group, and updates the row counts, when a cell edit changes its group${name}`, async () => {
      const el = /** @type {Table} */ (
        await fixture(html`
          <owc-table
            .columns=${[...columns, { label: 'Team', field: 'team', type: 'editable' }]}
            .groupList=${teamGroups()}
            .groupSelector=${byTeam}
            .data=${teamRows(6)}
            .handleUpdate=${handleUpdate}
          ></owc-table>
        `)
      );
      await settle(el);
      expect(bodyEntries(el).slice(1)).to.deep.equal([
        '# Red team 2 chevron-down',
        'Person 0',
        'Person 3',
        '# Blue team 2 chevron-down',
        'Person 2',
        'Person 5',
      ]);

      // edit the team of Person 0 like a user: double-click, type, Enter
      const row = /** @type {HTMLElement} */ (
        rowContainers(el).find(container => nameIn(container) === 'Person 0')
      );
      const team = /** @type {import('../click-editable/OwcClickEditable.js').OwcClickEditable} */ (
        row.querySelector('owc-click-editable-input')
      );
      team.shadowRoot?.querySelector('.display')?.dispatchEvent(new Event('dblclick'));
      await team.updateComplete;
      team.inputElement.value = 'blue';
      const submitted = oneEvent(team, 'submit');
      team.inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await submitted;
      await saved;
      await settle(el);

      expect(bodyEntries(el).slice(1)).to.deep.equal([
        '# Red team 1 chevron-down',
        'Person 3',
        '# Blue team 3 chevron-down',
        'Person 0',
        'Person 2',
        'Person 5',
      ]);
    });
  }

  it('moves rows to their new group, and updates the row counts, in one update when a mass edit changes their group', async () => {
    const teamColumn = { label: 'Team', field: 'team', editableOptions: { massEdit: true } };
    const el = /** @type {Table} */ (
      await fixture(html`
        <owc-table
          .columns=${[...columns, teamColumn]}
          .groupList=${teamGroups()}
          .groupSelector=${byTeam}
          .data=${teamRows(6)}
          .handleUpdate=${(/** @type {{ autoSetData: () => void }} */ { autoSetData }) =>
            autoSetData()}
        ></owc-table>
      `)
    );
    await settle(el);
    const red = el.data.filter(row => row.team === 'red');
    // a mass edit of the red team's rows, used standalone with the table
    const massEdit = /** @type {OwcTableMassEdit<any>} */ (
      await fixture(html`
        <owc-table-mass-edit
          .table=${el}
          .columns=${el.columns}
          .data=${red}
          .allData=${el.processedData}
        ></owc-table-mass-edit>
      `)
    );
    let updates = 0;
    el.addController({ hostUpdated: () => updates++ });

    massEdit.setColumn('team');
    massEdit.value = 'blue';
    massEdit.executeEdit(new MouseEvent('click'));
    await settle(el);

    expect(bodyEntries(el).slice(1)).to.deep.equal([
      '# Red team 0 chevron-down',
      '# Blue team 4 chevron-down',
      'Person 0',
      'Person 2',
      'Person 3',
      'Person 5',
    ]);
    expect(updates, 'table updates').to.equal(1);
  });

  it('sets visibleData to the rendered Data Rows in display order, without group headers and insert rows', async () => {
    const el = /** @type {Table} */ (
      await fixture(html`
        <owc-table
          .columns=${columns}
          .groupList=${teamGroups()}
          .groupSelector=${byTeam}
          .data=${teamRows(6)}
          .insertData=${[{ id: 'new', firstName: 'New', age: 0, team: 'red' }]}
        ></owc-table>
      `)
    );
    await settle(el);
    expect(bodyEntries(el)).to.deep.equal([
      '# Green team 2 chevron-right',
      '# Red team 3 chevron-down',
      'Person 0',
      'Person 3',
      'New',
      '# Blue team 2 chevron-down',
      'Person 2',
      'Person 5',
    ]);
    expect(el.visibleData.map(row => row.firstName)).to.deep.equal([
      'Person 0',
      'Person 3',
      'Person 2',
      'Person 5',
    ]);
  });

  it('shows the right rows of every group after sorting, filtering and replacing data while scrolled down', async () => {
    const { box, el } = await groupedTableInBox(10_000);
    await scrollTo(box, 200_000);
    await settle(el);

    /**
     * Rows are assigned to teams by their index modulo 3, so sorted by age
     * (their index), descending, the next row of a group is 3 younger.
     */
    const expectRowsInDisplayOrder = () => {
      const entries = bodyEntries(el);
      const names = entries.filter(entry => !entry?.startsWith('#'));
      expect(names.length).to.be.above(0);
      expect(new Set(names).size, 'unique rows').to.equal(names.length);
      expect(el.visibleData.map(row => row.firstName)).to.deep.equal(names);
      entries.forEach((entry, position) => {
        const previous = entries[position - 1];
        if (position > 0 && !entry?.startsWith('#') && !previous?.startsWith('#')) {
          const age = (/** @type {string} */ name) => Number(name.replace('Person ', ''));
          expect(age(/** @type {string} */ (entry)), `row after ${previous}`).to.equal(
            age(/** @type {string} */ (previous)) - 3,
          );
        }
      });
      expectCovered(el, box);
    };

    el.jsonSorters = [{ field: 'age', order: 'desc' }];
    await settle(el);
    expectRowsInDisplayOrder();

    el.jsonFilters = [{ field: 'age', operator: 'lessThan', value: 5_000 }];
    await settle(el);
    expectRowsInDisplayOrder();

    el.data = teamRows(20_000).reverse();
    await settle(el);
    expectRowsInDisplayOrder();
  });

  it('covers the visible area of a virtualized grouped table with an open detail', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table
          render-mode="detailDeferred"
          .columns=${columns}
          .groupList=${teamGroups({ green: true })}
          .groupSelector=${byTeam}
          .data=${teamRows(3_000)}
          .openDetails=${['1']}
          .renderDetail=${(/** @type {{ firstName: string }} */ row) =>
            html`<p class="detail">Detail of ${row.firstName}</p>`}
        ></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    expect(el.shadowRoot?.querySelector('.detail')?.textContent).to.equal('Detail of Person 1');
    expectCovered(el, box);

    for (const top of [box.scrollHeight / 2, box.scrollHeight, 0]) {
      await scrollTo(box, top);
      await settle(el);
      expectCovered(el, box);
    }
  });

  it('sets visibleData of a virtualized grouped table in the same update that renders its rows', async () => {
    const { box, el } = await groupedTableInBox(10_000);
    let updates = 0;
    el.addController({ hostUpdated: () => updates++ });

    // scroll from a task of its own, so only the scroll event can update the table
    await new Promise(resolve => setTimeout(resolve));
    const scrolled = new Promise(resolve =>
      box.addEventListener('scroll', resolve, { once: true }),
    );
    box.scrollTop = 200_000;
    await scrolled;
    await el.updateComplete;

    expect(updates).to.equal(1);
    const names = rowContainers(el).map(nameIn);
    expect(names.length).to.be.above(0);
    expect(names).to.not.include('Person 1');
    expect(el.visibleData.map(row => row.firstName)).to.deep.equal(names);
  });
});

describe('owc-table inserting rows', () => {
  /** The first editable column is the second one, after the row number. */
  const editableColumns = [
    { label: 'Nr.', formatter: 'rownum' },
    { label: 'First Name', field: 'firstName', type: 'editable' },
    { label: 'Age', field: 'age', type: 'editable' },
  ];

  let inserted = 0;
  const handleInsert = () => ({ id: `new-${++inserted}`, firstName: '', age: 0 });

  /**
   * Clicks the table's insert button and resolves once focus has moved to an
   * element of the table and the rendered rows have settled.
   *
   * @param {Table} el
   */
  async function insertRow(el) {
    const root = /** @type {ShadowRoot} */ (el.shadowRoot);
    const button = /** @type {HTMLElement} */ (root.querySelector('#info-wrapper wa-button'));
    // Listen in the shadow root: focus moving between two of its elements
    // doesn't dispatch `focusin` beyond it.
    const focused = oneEvent(root, 'focusin');
    button.click();
    await focused;
    await settle(el);
  }

  /**
   * The rendered row container of the row at an index of the table's rows.
   *
   * @param {Table} el
   * @param {number} index
   */
  function rowContainerAt(el, index) {
    return rowContainers(el).find(
      container =>
        /** @type {HTMLElement} */ (container.querySelector('.row')).dataset.index === `${index}`,
    );
  }

  /**
   * Asserts that the row container is rendered, fully visible in the scroll
   * container, and that its first editable field, First Name, has focus.
   *
   * @param {Table} el
   * @param {Element} scroller
   * @param {number} index
   */
  function expectRevealedAndFocused(el, scroller, index) {
    const container = rowContainerAt(el, index);
    expect(container, `row container ${index}`).to.exist;
    const rect = /** @type {HTMLElement} */ (container).getBoundingClientRect();
    const area = visibleArea(scroller);
    expect(rect.top, `top of row ${index}`).to.be.at.least(area.top - 0.5);
    expect(rect.bottom, `bottom of row ${index}`).to.be.at.most(area.bottom + 0.5);

    const firstNameCell = /** @type {HTMLElement} */ (container).querySelectorAll(
      '.row > .cell',
    )[1];
    const firstNameField = firstNameCell.querySelector('owc-click-editable-input');
    // compare identities: a failing chai equality on DOM elements hangs the test runner
    expect(el.shadowRoot?.activeElement === firstNameField, 'First Name field focused').to.equal(
      true,
    );
  }

  for (const [name, render] of Object.entries(containers)) {
    it(`scrolls a virtualized table in ${name} from the top to each inserted row and focuses its first editable field`, async () => {
      const { el, scroller } = await render(
        html`<owc-table
          .columns=${editableColumns}
          .data=${rows(10_000)}
          .handleInsert=${handleInsert}
        ></owc-table>`,
      );
      await settle(el);
      expect(scroller.scrollTop, 'scrolled to the top').to.equal(0);

      await insertRow(el);
      expectRevealedAndFocused(el, scroller, 10_000);
      expectCovered(el, scroller);

      await insertRow(el);
      expectRevealedAndFocused(el, scroller, 10_001);
      expectCovered(el, scroller);
    });
  }

  it('scrolls a table without virtualization to each inserted row and focuses its first editable field', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table
          .columns=${editableColumns}
          .data=${rows(20)}
          .handleInsert=${handleInsert}
        ></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    expect(rowContainers(el).length, 'every row rendered').to.equal(20);

    await insertRow(el);
    expectRevealedAndFocused(el, box, 20);

    await insertRow(el);
    expectRevealedAndFocused(el, box, 21);
  });

  it('focuses the first editable field of a row inserted into a grouped table', async () => {
    const el = /** @type {Table} */ (
      await fixture(
        html`<owc-table
          .columns=${editableColumns}
          .data=${rows(5)}
          .groupList=${[{ label: 'Everyone', key: 'everyone', active: true }]}
          .groupSelector=${() => 'everyone'}
          .handleInsert=${handleInsert}
        ></owc-table>`,
      )
    );
    await settle(el);

    await insertRow(el);

    // indexes count the group header too
    expectRevealedAndFocused(el, /** @type {Element} */ (document.scrollingElement), 6);
  });

  it('scrolls a virtualized grouped table from the top to each row inserted into a group and focuses its first editable field', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table
          .columns=${editableColumns}
          .groupList=${teamGroups({ green: true })}
          .groupSelector=${byTeam}
          .data=${teamRows(10_000)}
          .handleInsert=${() => ({ ...handleInsert(), team: 'red' })}
        ></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    expect(box.scrollTop, 'scrolled to the top').to.equal(0);

    // the green header and its 3,333 rows, then the red header and its 3,334 rows
    await insertRow(el);
    expectRevealedAndFocused(el, box, 6_669);
    expectCovered(el, box);

    await insertRow(el);
    expectRevealedAndFocused(el, box, 6_670);
    expectCovered(el, box);
  });

  it('expands the collapsed group of an inserted row to reveal and focus it', async () => {
    const el = /** @type {Table} */ (
      await fixture(
        html`<owc-table
          .columns=${editableColumns}
          .groupList=${teamGroups()}
          .groupSelector=${byTeam}
          .data=${teamRows(6)}
          .handleInsert=${() => ({ ...handleInsert(), team: 'purple' })}
        ></owc-table>`,
      )
    );
    await settle(el);
    expect(groupHeaders(el).length, 'no Others group yet').to.equal(3);

    await insertRow(el);

    // green and its rows are collapsed: green, red and 2 rows, blue and 2 rows, Others
    expectRevealedAndFocused(el, /** @type {Element} */ (document.scrollingElement), 8);
    expect(el.othersGroupActive).to.equal(true);
  });
});

describe('owc-table scrollTarget', () => {
  it('renders the rows that scroll into view of an explicit scroll target inside a closed shadow root', async () => {
    const area = /** @type {TestClosedScrollArea} */ (
      await fixture(html`<test-closed-scroll-area></test-closed-scroll-area>`)
    );
    // passed before the table's first render
    render(
      html`<owc-table
        .scrollTarget=${area.scroller}
        .columns=${columns}
        .data=${rows(10_000)}
      ></owc-table>`,
      area,
    );
    const el = /** @type {Table} */ (area.querySelector('owc-table'));
    await settle(el);
    expectCovered(el, area.scroller);

    for (const top of [150_000, 150_600, 20_000]) {
      await scrollInSameFrame(el, area.scroller, top);
      expectCovered(el, area.scroller);
    }
  });

  it('renders the rows that scroll into view of an explicit scroll target that clips and is scrolled by script', async () => {
    // users can't scroll an `overflow: hidden` box, so detection skips it
    const box = await fixture(html`
      <div style="height: 300px; overflow: hidden">
        <owc-table .columns=${columns} .data=${rows(10_000)}></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    el.scrollTarget = box;
    await settle(el);

    for (const top of [150_000, 150_600, 20_000]) {
      await scrollInSameFrame(el, box, top);
      expectCovered(el, box);
    }
  });

  it('detects the scroll container again once scrollTarget is cleared', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table .columns=${columns} .data=${rows(10_000)}></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    el.scrollTarget = document.documentElement;
    await settle(el);

    el.scrollTarget = undefined;
    await settle(el);
    await scrollInSameFrame(el, box, 150_000);
    expectCovered(el, box);

    el.scrollTarget = document.documentElement;
    await settle(el);
    el.scrollTarget = null;
    await settle(el);
    await scrollInSameFrame(el, box, 20_000);
    expectCovered(el, box);
  });
});
