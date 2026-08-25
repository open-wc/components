import { aTimeout, fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcTable } from './OwcTable.js';

customElements.define('owc-table', OwcTable);

// Chromium reports this benign limitation while the virtualizer and table
// column measurements settle; without suppression the runner treats it as an
// uncaught application error.
window.addEventListener('error', ev => {
  if (ev.message?.includes('ResizeObserver loop completed')) {
    ev.stopImmediatePropagation();
    ev.preventDefault();
  }
});

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

class TableDisplayContentsHost extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { display: block; }
        #scroller { height: 300px; overflow: auto; }
        slot { display: contents; overflow: hidden; }
      </style>
      <div id="scroller"><slot></slot></div>
    `;
  }

  get scroller() {
    return this.shadowRoot.querySelector('#scroller');
  }
}

customElements.define('table-display-contents-host', TableDisplayContentsHost);

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

  it('shrinks after filtering below the automatic virtualization threshold', async () => {
    const el = await tableFixture(
      html`<owc-table .columns=${columns} .data=${rows(301)}></owc-table>`,
    );
    await aTimeout(100);
    await el.updateComplete;

    const virtualizedHost = el.virtualizerHost;
    const virtualizedHeight = virtualizedHost.getBoundingClientRect().height;
    expect(virtualizedHost.style.minHeight).to.not.equal('');

    el.jsonFilters = [{ field: 'age', operator: 'lessThan', value: 3 }];
    await el.updateComplete;
    await aTimeout(100);
    await el.updateComplete;

    const filteredHost = el.virtualizerHost;
    expect(el.processedData).to.have.length(3);
    expect(dataRows(el)).to.have.length(3);
    expect(filteredHost).to.not.equal(virtualizedHost);
    expect(filteredHost.style.minHeight).to.equal('');
    expect(filteredHost.getBoundingClientRect().height).to.be.lessThan(virtualizedHeight);
  });

  it('updates rendered rows when a boxless slot sits inside the scroll container', async () => {
    const host = await fixture(html`
      <table-display-contents-host>
        <owc-table virtualizer-mode="always" .columns=${columns} .data=${rows(301)}></owc-table>
      </table-display-contents-host>
    `);
    const el = host.querySelector('owc-table');
    await aTimeout(100);
    await el.updateComplete;

    const initialIndexes = dataRows(el).map(row => Number(row.dataset.index));
    expect(initialIndexes).to.include(0);

    host.scroller.scrollTop = 2_000;
    host.scroller.dispatchEvent(new Event('scroll'));
    await aTimeout(100);
    await el.updateComplete;

    const scrolledIndexes = dataRows(el).map(row => Number(row.dataset.index));
    expect(Math.min(...scrolledIndexes)).to.be.greaterThan(0);
  });

  it('grows columns after becoming visible in a full-width container', async () => {
    const growColumns = columns.map(column => ({ ...column }));
    const wrapper = await fixture(html`
      <div style="width: 600px">
        <owc-table
          style="display: none"
          grow-full-width
          .columns=${growColumns}
          .data=${data}
        ></owc-table>
      </div>
    `);
    const el = wrapper.querySelector('owc-table');
    await el.updateComplete;

    el.style.display = 'block';
    await aTimeout(100);
    await el.updateComplete;

    const totalWidth = growColumns.reduce(
      (sum, column) => sum + (column.width ?? column._calculatedWidth ?? 0),
      0,
    );
    expect(totalWidth).to.equal(600);
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
});
