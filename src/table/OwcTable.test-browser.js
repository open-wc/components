import { aTimeout, fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcTable } from './OwcTable.js';

customElements.define('owc-table', OwcTable);

const columns = [
  { label: 'First Name', field: 'firstName', filterable: true },
  { label: 'Age', field: 'age', filterable: true, filterType: 'number', formatter: 'number' },
];

const data = [
  { id: '1', firstName: 'Robert', age: 34 },
  { id: '2', firstName: 'Sarah', age: 65 },
  { id: '3', firstName: 'Grace', age: 25 },
];

/**
 * @param {import('lit').TemplateResult} template
 */
async function tableFixture(template) {
  /** @type {OwcTable<Record<string, unknown>>} */
  const el = await fixture(template);
  await el.updateComplete;
  return el;
}

/**
 * @param {OwcTable<Record<string, unknown>>} el
 */
function dataRows(el) {
  return [...el.shadowRoot.querySelectorAll('#data-table .table-body .row')];
}

function rows(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    firstName: `Person ${index}`,
    age: index,
  }));
}

class TableShadowHost extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.scrollTarget = document.createElement('div');
    this.scrollTarget.style.cssText = 'height: 300px; overflow: auto';
    this.table = document.createElement('owc-table');
    this.scrollTarget.append(this.table);
    this.shadowRoot.append(this.scrollTarget);
  }
}

customElements.define('table-shadow-host', TableShadowHost);

/** @param {OwcTable<Record<string, unknown>>} el */
async function settleVirtualizer(el) {
  await el.updateComplete;
  await aTimeout(100);
  await el.updateComplete;
}

describe('owc-table', () => {
  it('renders a header cell per column and a row per data entry', async () => {
    const el = await tableFixture(html`<owc-table .columns=${columns} .data=${data}></owc-table>`);

    const headerCells = [...el.shadowRoot.querySelectorAll('#data-table owc-table-header-cell')];
    expect(headerCells.map(cell => cell.textContent.trim())).to.deep.equal(['First Name', 'Age']);
    expect(dataRows(el)).to.have.length(3);
    expect(el.shadowRoot.querySelector('#data-table').textContent).to.include('Robert');
  });

  it('shows the empty message when there is no data', async () => {
    const el = await tableFixture(html`<owc-table .columns=${columns} .data=${[]}></owc-table>`);
    const emptyMessage = el.shadowRoot.querySelector('#data-table #empty-message-wrapper');
    expect(emptyMessage).to.exist;
    expect(emptyMessage.textContent).to.include('No data available');
  });

  it('fires owc-table-data-ready after data is assigned', async () => {
    /** @type {OwcTable<Record<string, unknown>>} */
    const el = await fixture(html`<owc-table .columns=${columns}></owc-table>`);
    setTimeout(() => {
      el.data = data;
    });
    await oneEvent(el, 'owc-table-data-ready');
  });

  it('fires rowClick with the clicked row', async () => {
    const el = await tableFixture(html`<owc-table .columns=${columns} .data=${data}></owc-table>`);

    setTimeout(() => dataRows(el)[1].querySelector('.cell').click());
    const event = await oneEvent(el, 'rowClick');
    expect(event.row).to.deep.equal(data[1]);
  });

  it('sorts rows via jsonSorters', async () => {
    const el = await tableFixture(
      html`<owc-table
        .columns=${columns}
        .data=${data}
        .jsonSorters=${[{ field: 'age', order: 'asc' }]}
      ></owc-table>`,
    );

    expect(el.processedData.map(row => row.age)).to.deep.equal([25, 34, 65]);
  });

  it('filters rows via jsonFilters', async () => {
    const el = await tableFixture(
      html`<owc-table
        .columns=${columns}
        .data=${data}
        .jsonFilters=${[{ field: 'firstName', operator: 'includes', value: 'ra' }]}
      ></owc-table>`,
    );

    // "Grace" and "Sarah" contain "ra"
    expect(el.processedData.map(row => row.firstName)).to.have.members(['Sarah', 'Grace']);
    expect(dataRows(el)).to.have.length(2);
  });

  it('adds a selectable column and tracks selectedData', async () => {
    const el = await tableFixture(
      html`<owc-table selectable .columns=${columns} .data=${data}></owc-table>`,
    );

    const checkbox = dataRows(el)[0].querySelector('wa-checkbox, input[type="checkbox"]');
    expect(checkbox).to.exist;
    expect(el.selectedData).to.deep.equal([]);
  });

  it('renders the filter builder when filter-mode is not hidden', async () => {
    const el = await tableFixture(
      html`<owc-table
        filter-mode="global-search-with-builder"
        .columns=${columns}
        .data=${data}
      ></owc-table>`,
    );
    expect(el.shadowRoot.querySelector('owc-table-filter-builder')).to.exist;
  });

  it('renders no filter builder by default', async () => {
    const el = await tableFixture(html`<owc-table .columns=${columns} .data=${data}></owc-table>`);
    expect(el.shadowRoot.querySelector('owc-table-filter-builder')).to.not.exist;
  });

  it('keeps the 300-row automatic virtualization threshold', async () => {
    const belowThreshold = await tableFixture(
      html`<owc-table .columns=${columns} .data=${rows(299)}></owc-table>`,
    );
    expect(dataRows(belowThreshold)).to.have.length(299);

    const atThreshold = await tableFixture(
      html`<owc-table .columns=${columns} .data=${rows(300)}></owc-table>`,
    );
    await settleVirtualizer(atThreshold);
    expect(atThreshold.shadowRoot.querySelectorAll('.virtual-item').length).to.be.lessThan(300);
    expect(atThreshold.shadowRoot.querySelector('#data-table').textContent).to.include('Person 0');

    const aboveThreshold = await tableFixture(
      html`<owc-table .columns=${columns} .data=${rows(301)}></owc-table>`,
    );
    await settleVirtualizer(aboveThreshold);
    expect(aboveThreshold.shadowRoot.querySelectorAll('.virtual-item').length).to.be.lessThan(301);
    expect(aboveThreshold.shadowRoot.querySelector('#data-table').textContent).to.include(
      'Person 0',
    );
  });

  it('allows an explicit element to own virtualized table scrolling', async () => {
    const host = await fixture(html`<table-shadow-host></table-shadow-host>`);
    const el = host.table;
    el.columns = columns;
    el.data = rows(301);
    el.scrollTarget = host.scrollTarget;
    await settleVirtualizer(el);

    expect(el.scrollTarget).to.equal(host.scrollTarget);
    expect(el.shadowRoot.querySelectorAll('.virtual-item').length).to.be.lessThan(301);
    host.remove();
  });

  it('keeps sorting, filtering, and replacement data consistent while virtualized', async () => {
    const largeData = rows(301).reverse();
    const el = await tableFixture(
      html`<owc-table
        virtualizer-mode="always"
        .columns=${columns}
        .data=${largeData}
        .jsonSorters=${[{ field: 'age', order: 'asc' }]}
      ></owc-table>`,
    );
    await settleVirtualizer(el);

    expect(el.allData.map(row => row.age)).to.deep.equal(rows(301).map(row => row.age));

    el.jsonFilters = [{ field: 'age', operator: 'lessThan', value: 10 }];
    await settleVirtualizer(el);
    expect(el.allData.map(row => row.age)).to.deep.equal([...Array(10).keys()]);
    expect(dataRows(el)).to.have.length(10);

    el.jsonFilters = [];
    await settleVirtualizer(el);
    expect(el.allData).to.have.length(301);

    el.data = rows(301).map(row => ({ ...row, firstName: `Replacement ${row.id}` }));
    await settleVirtualizer(el);
    expect(el.allData[0].firstName).to.equal('Replacement 0');
    expect(el.shadowRoot.querySelector('#data-table').textContent).to.include('Replacement 0');
  });

  it('keeps row click interactions consistent with and without virtualization', async () => {
    for (const virtualizerMode of ['always', 'never']) {
      const el = await tableFixture(
        html`<owc-table
          .virtualizerMode=${virtualizerMode}
          .columns=${columns}
          .data=${rows(301)}
        ></owc-table>`,
      );
      await settleVirtualizer(el);

      setTimeout(() => dataRows(el)[0].querySelector('.cell').click());
      const event = await oneEvent(el, 'rowClick');
      expect(event.row.id).to.equal('0');
    }
  });

  it('reports the overscanned rendered range in sorted render order', async () => {
    const el = await tableFixture(
      html`<owc-table
        virtualizer-mode="always"
        .columns=${columns}
        .data=${rows(301).reverse()}
        .jsonSorters=${[{ field: 'age', order: 'asc' }]}
      ></owc-table>`,
    );
    await settleVirtualizer(el);

    const renderedIndexes = [...el.shadowRoot.querySelectorAll('.virtual-item')].map(item =>
      Number(item.getAttribute('data-index')),
    );
    expect(el.visibleData).to.deep.equal(renderedIndexes.map(index => el.allData[index]));
    expect(el.visibleData.map(row => row.age)).to.deep.equal(
      [...el.visibleData].map(row => row.age).sort((left, right) => left - right),
    );
  });

  it('restores virtualized rendering after disconnecting and reconnecting', async () => {
    const el = await tableFixture(
      html`<owc-table
        virtualizer-mode="always"
        .columns=${columns}
        .data=${rows(301)}
      ></owc-table>`,
    );
    await settleVirtualizer(el);

    const parent = el.parentElement;
    el.remove();
    parent.append(el);
    await settleVirtualizer(el);

    expect(el.shadowRoot.querySelectorAll('.virtual-item').length).to.be.lessThan(301);
    expect(el.shadowRoot.querySelector('#data-table').textContent).to.include('Person 0');
  });

  it('keeps annotation and detail interactions stable as virtual row content changes', async () => {
    const detailHeight = 40;
    const el = await tableFixture(
      html`<owc-table
        virtualizer-mode="always"
        render-mode="detailDeferred"
        .columns=${columns}
        .data=${rows(301)}
        .renderAnnotation=${row =>
          row.id === '0' ? html`<div style="height: 60px">Annotation</div>` : html``}
        .renderDetail=${row =>
          row.id === '0'
            ? html`<div class="async-detail" style=${`height: ${detailHeight}px`}>Detail</div>`
            : html``}
      ></owc-table>`,
    );
    await settleVirtualizer(el);

    const firstRow = dataRows(el)[0];
    expect(firstRow.parentElement.querySelector('.row-annotation')).to.exist;
    firstRow.querySelector('.row-click').click();
    await settleVirtualizer(el);

    const detail = dataRows(el)[0].parentElement.querySelector('.async-detail');
    expect(detail.textContent).to.equal('Detail');

    detail.style.height = '180px';
    await aTimeout(150);
    expect(dataRows(el)[1].textContent).to.include('Person 1');

    dataRows(el)[0].querySelector('.row-click').click();
    await settleVirtualizer(el);
    expect(el.openDetails).to.deep.equal([]);
  });

  it('keeps virtual ranges private to active grouped lists', async () => {
    const groupedRows = Array.from({ length: 602 }, (_, index) => ({
      id: String(index),
      firstName: `Person ${index}`,
      age: index,
      group: index < 301 ? 'first' : 'second',
    }));
    const groupList = [
      { key: 'first', label: 'First', active: true },
      { key: 'second', label: 'Second', active: true },
    ];
    const host = await fixture(html`<table-shadow-host></table-shadow-host>`);
    const el = host.table;
    el.virtualizerMode = 'always';
    el.scrollTarget = host.scrollTarget;
    el.selectable = true;
    el.columns = columns;
    el.data = groupedRows;
    el.groupList = groupList;
    el.groupSelector = row => row.group;
    await settleVirtualizer(el);

    const firstList = el.shadowRoot.querySelector(
      '[data-group-key="first"] + .group-rows-container .group-virtual-list',
    );
    const secondList = el.shadowRoot.querySelector(
      '[data-group-key="second"] + .group-rows-container .group-virtual-list',
    );
    expect(firstList).to.exist;
    expect(secondList).to.exist;
    expect(firstList).to.not.equal(secondList);
    expect(firstList.querySelectorAll('.virtual-item').length).to.be.lessThan(301);
    expect(secondList.querySelectorAll('.virtual-item').length).to.be.lessThan(301);

    host.scrollTarget.scrollTop +=
      secondList.getBoundingClientRect().top - host.scrollTarget.getBoundingClientRect().top;
    host.scrollTarget.dispatchEvent(new Event('scroll'));
    await settleVirtualizer(el);
    const secondRenderedIndexes = [...secondList.querySelectorAll('.virtual-item')].map(item =>
      Number(item.dataset.index),
    );
    expect(secondRenderedIndexes).to.include(0);

    el.shadowRoot.querySelector('[data-group-key="first"] .row-click').click();
    await settleVirtualizer(el);
    expect(
      el.shadowRoot.querySelector(
        '[data-group-key="first"] + .group-rows-container .group-virtual-list',
      ),
    ).to.not.exist;
    expect(
      el.shadowRoot.querySelector(
        '[data-group-key="second"] + .group-rows-container .group-virtual-list',
      ),
    ).to.exist;

    el.shadowRoot.querySelector('[data-group-key="first"] .row-click').click();
    await settleVirtualizer(el);
    expect(
      el.shadowRoot.querySelector(
        '[data-group-key="first"] + .group-rows-container .group-virtual-list',
      ),
    ).to.exist;

    el.jsonSorters = [{ field: 'age', order: 'desc' }];
    await settleVirtualizer(el);
    expect(el.allData[0].age).to.equal(601);

    host.scrollTarget.scrollTop = 0;
    host.scrollTarget.dispatchEvent(new Event('scroll'));
    await settleVirtualizer(el);

    const firstGroupCheckbox = el.shadowRoot.querySelector(
      '[data-group-key="first"] + .group-rows-container .owc-selectable-checkbox',
    );
    firstGroupCheckbox.click();
    await settleVirtualizer(el);
    const rowClick = oneEvent(el, 'rowClick');
    el.shadowRoot
      .querySelector(
        '[data-group-key="first"] + .group-rows-container .row .cell:not(.cell-selector)',
      )
      .click();
    expect((await rowClick).row.id).to.equal('300');
    expect(el.selectedData.map(row => row.id)).to.deep.equal(['300']);

    el.jsonFilters = [{ field: 'firstName', operator: 'includes', value: 'Person 2' }];
    await settleVirtualizer(el);
    expect(el.allData).to.have.length(111);
    el.data = groupedRows.map(row => ({ ...row, firstName: `Replacement ${row.id}` }));
    el.jsonFilters = [];
    await settleVirtualizer(el);
    expect(el.shadowRoot.querySelector('#data-table').textContent).to.include('Replacement 601');

    const parent = el.parentElement;
    el.remove();
    parent.append(el);
    await settleVirtualizer(el);
    expect(el.shadowRoot.querySelectorAll('.group-virtual-list')).to.have.length(2);
    host.remove();
  });

  it('remeasures wrapped virtual rows after repeated column resizing without resetting the table', async () => {
    const longRows = rows(301).map(row => ({
      ...row,
      firstName: `A deliberately long name that wraps after the column becomes narrow ${row.id}`,
    }));
    const el = await tableFixture(
      html`<owc-table virtualizer-mode="always" .columns=${columns} .data=${longRows}></owc-table>`,
    );
    await settleVirtualizer(el);

    const resizeHandle = el.shadowRoot.querySelector('.cell-resize[data-visible-column-index="0"]');
    resizeHandle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 300 }));
    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 80 }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 80 }));
    await settleVirtualizer(el);

    expect(columns[0].width).to.equal(50);
    resizeHandle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 80 }));
    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 160 }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 160 }));
    await settleVirtualizer(el);

    expect(columns[0].width).to.equal(130);
    expect(el.shadowRoot.querySelector('#data-table').textContent).to.include(
      'deliberately long name',
    );
  });
});
