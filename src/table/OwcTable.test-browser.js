import { aTimeout, fixture, html, expect, oneEvent } from '@open-wc/testing';
import { setupIgnoreWindowResizeObserverLoopErrors } from '@lit-labs/virtualizer/support/resize-observer-errors.js';
import { OwcTable } from './OwcTable.js';
import '@awesome.me/webawesome/dist/components/details/details.js';

customElements.define('owc-table', OwcTable);

setupIgnoreWindowResizeObserverLoopErrors(beforeEach, afterEach);

let originalConsoleError;
beforeEach(() => {
  // eslint-disable-next-line no-console
  originalConsoleError = console.error;
  // eslint-disable-next-line no-console
  console.error = (...args) => {
    if (args.length !== 1 || args[0] !== null) {
      originalConsoleError(...args);
    }
  };
});
afterEach(() => {
  // eslint-disable-next-line no-console
  console.error = originalConsoleError;
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

  it('aligns header labels with their columns', async () => {
    const alignedColumns = [{ label: 'Age', field: 'age', align: 'end' }];
    const el = await tableFixture(
      html`<owc-table .columns=${alignedColumns} .data=${data}></owc-table>`,
    );
    const header = el.shadowRoot.querySelector('owc-table-header-cell');
    const slotWrapper = header.shadowRoot.querySelector('#slot-wrapper');

    expect(getComputedStyle(slotWrapper).justifyContent).to.equal('end');
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

  it('measures formatted content after virtualized rows become available', async () => {
    const measuredColumns = [
      {
        label: 'Short',
        field: 'firstName',
        formatter: row => html`
          <span style="display: inline-block; width: 180px">${row.firstName}</span>
        `,
      },
    ];
    const el = await tableFixture(html`
      <owc-table .columns=${measuredColumns} .data=${rows(301)}></owc-table>
    `);

    await aTimeout(100);
    await el.updateComplete;

    expect(el.visibleData).to.not.be.empty;
    expect(el.visibleColumns[0]._calculatedWidth).to.be.at.least(216);
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

    const totalWidth = el.visibleColumns.reduce(
      (sum, column) => sum + (column.width ?? column._calculatedWidth ?? 0),
      0,
    );
    expect(totalWidth).to.equal(600);
  });

  it('refills after data changes while hidden and the original width returns', async () => {
    const el = await tableFixture(html`
      <owc-table
        style="width: 600px"
        grow-full-width
        virtualizer-mode="never"
        .columns=${columns.map(column => ({ ...column }))}
        .data=${data}
      ></owc-table>
    `);
    await aTimeout(100);
    expect(dataRows(el)[0].getBoundingClientRect().width).to.equal(600);

    el.style.display = 'none';
    await aTimeout(100);
    el.data = [{ id: 'updated', firstName: 'Updated while hidden', age: 40 }];
    await aTimeout(100);
    await el.updateComplete;

    el.style.display = 'block';
    await aTimeout(100);
    await el.updateComplete;
    expect(dataRows(el)[0].getBoundingClientRect().width).to.equal(600);
    expect(el.scrollWidth).to.equal(600);
  });

  it('keeps widths local when tables share column definitions', async () => {
    const sharedColumns = columns.map(column => ({ ...column }));
    const wrapper = await fixture(html`
      <div>
        ${[400, 600].map(
          width => html`
            <owc-table
              style=${`width: ${width}px`}
              grow-full-width
              virtualizer-mode="never"
              .columns=${sharedColumns}
              .data=${data}
            ></owc-table>
          `,
        )}
      </div>
    `);
    const [narrow, wide] = wrapper.querySelectorAll('owc-table');
    await aTimeout(100);

    await wide.recalculateColumnWidths();
    await wide.updateComplete;
    narrow.requestUpdate();
    await narrow.updateComplete;
    expect(narrow.scrollWidth).to.equal(400);
    expect(dataRows(narrow)[0].getBoundingClientRect().width).to.equal(400);
    expect(wide.scrollWidth).to.equal(600);
    expect(dataRows(wide)[0].getBoundingClientRect().width).to.equal(600);
    expect(sharedColumns).to.deep.equal(columns);
  });

  it('fits automatic columns when the container shrinks and grows repeatedly', async () => {
    const growColumns = columns.map(column => ({ ...column }));
    const wrapper = await fixture(html`
      <div style="width: 1200px">
        <owc-table
          grow-full-width
          virtualizer-mode="never"
          .columns=${growColumns}
          .data=${data}
        ></owc-table>
      </div>
    `);
    const el = wrapper.querySelector('owc-table');
    for (const width of [1200, 500, 150, 901, 500]) {
      wrapper.style.width = `${width}px`;
      await aTimeout(100);
      await el.updateComplete;
      // The delayed window resize handler must not undo the container observer's sizing.
      window.dispatchEvent(new Event('resize'));
      await aTimeout(100);
      await el.updateComplete;
      expect(el.scrollWidth).to.equal(width);
      expect(dataRows(el)[0].getBoundingClientRect().width).to.equal(width);
      expect(growColumns.every(column => column.width == null)).to.equal(true);
      expect(el.visibleColumns.every(column => column._calculatedWidth >= 50)).to.equal(true);
    }

    el.data = [{ id: 'long', firstName: 'A much longer name than before', age: 34 }];
    await aTimeout(100);
    await el.updateComplete;
    expect(el.scrollWidth).to.equal(500);
    expect(dataRows(el)[0].getBoundingClientRect().width).to.equal(500);
  });

  it('shrinks inside a details card in a grid', async () => {
    const wrapper = await fixture(html`
      <div style="width: 1200px; display: grid; min-width: 0">
        <wa-details open>
          <div style="display: flex; flex-direction: column; min-width: 0; max-width: 100%">
            <div style="min-width: 0; max-width: 100%">
              <owc-table
                grow-full-width
                virtualizer-mode="never"
                .columns=${columns.map(column => ({ ...column }))}
                .data=${data}
              ></owc-table>
            </div>
          </div>
        </wa-details>
      </div>
    `);
    const el = wrapper.querySelector('owc-table');
    await aTimeout(100);
    wrapper.style.width = '400px';
    await aTimeout(100);
    await el.updateComplete;
    expect(wrapper.scrollWidth).to.equal(400);
    expect(el.scrollWidth).to.be.at.most(400);
  });

  it('preserves configured and dragged widths while fitting the remaining columns', async () => {
    const growColumns = [
      { field: 'firstName', label: 'Name', width: 180 },
      { field: 'age', label: 'Age' },
      { field: 'id', label: 'ID' },
    ];
    const wrapper = await fixture(html`
      <div style="width: 900px">
        <owc-table
          grow-full-width
          virtualizer-mode="never"
          .columns=${growColumns}
          .data=${data}
        ></owc-table>
      </div>
    `);
    const el = wrapper.querySelector('owc-table');
    await aTimeout(100);
    const handle = el.shadowRoot.querySelector('.cell-resize[data-visible-column-index="1"]');
    const initialWidth = el.visibleColumns[1]._calculatedWidth;
    handle.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, composed: true, clientX: 100 }),
    );
    el.dispatchEvent(new MouseEvent('mousemove', { clientX: 120 }));
    el.dispatchEvent(new MouseEvent('mouseup', { clientX: 140 }));
    const draggedWidth = el.visibleColumns[1].width;
    expect(draggedWidth).to.equal(initialWidth + 40);

    for (const width of [800, 1000]) {
      wrapper.style.width = `${width}px`;
      await aTimeout(100);
      await el.updateComplete;
      expect(el.visibleColumns[0].width).to.equal(180);
      expect(el.visibleColumns[1].width).to.equal(draggedWidth);
      expect(el.scrollWidth).to.equal(width);
    }

    wrapper.style.width = '100px';
    await aTimeout(100);
    await el.updateComplete;
    expect(el.visibleColumns[2]._calculatedWidth).to.equal(50);
    expect(el.scrollWidth).to.equal(180 + draggedWidth + 50);
  });

  it('does not persist automatic widths as user preferences', async () => {
    const originalUrl = window.location.href;
    const prefix = 'responsive-table-test';
    try {
      const el = await tableFixture(html`
        <owc-table
          style="width: 900px"
          grow-full-width
          save-state-to-url
          store-name-prefix=${prefix}
          .columns=${columns.map(column => ({ ...column }))}
          .data=${data}
        ></owc-table>
      `);
      await aTimeout(100);
      await el.updateComplete;
      expect(new URL(window.location.href).searchParams.has(`${prefix}-columns`)).to.equal(false);

      const url = new URL(window.location.href);
      url.searchParams.set(`${prefix}-columns`, JSON.stringify({ firstName: 200 }));
      history.replaceState({}, '', url);
      el.loadStateFromUrl();
      await aTimeout(100);
      el.style.width = '400px';
      await aTimeout(100);
      await el.updateComplete;
      expect(el.visibleColumns[0].width).to.equal(200);
      expect(el.scrollWidth).to.equal(400);
      expect(
        JSON.parse(new URL(window.location.href).searchParams.get(`${prefix}-columns`)),
      ).to.deep.equal({ firstName: 200 });
    } finally {
      history.replaceState({}, '', originalUrl);
    }
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

  it('renders synchronous row details without a loading spinner', async () => {
    const el = await tableFixture(html`
      <owc-table
        render-mode="detail"
        .columns=${columns}
        .data=${data.slice(0, 1)}
        .renderDetail=${row => html`<p class="sync-detail">${row.firstName}</p>`}
      ></owc-table>
    `);

    expect(el.shadowRoot.querySelector('.sync-detail')?.textContent).to.equal('Robert');
    expect(el.shadowRoot.querySelector('wa-details wa-spinner')).to.not.exist;
  });

  it('shows a loading spinner while asynchronous row details resolve', async () => {
    let resolveDetail;
    const detailPromise = new Promise(resolve => {
      resolveDetail = resolve;
    });
    const el = await tableFixture(html`
      <owc-table
        render-mode="detail"
        .columns=${columns}
        .data=${data.slice(0, 1)}
        .renderDetail=${() => detailPromise}
      ></owc-table>
    `);

    expect(el.shadowRoot.querySelector('wa-details wa-spinner')).to.exist;

    resolveDetail(html`<p class="async-detail">Loaded</p>`);
    await aTimeout(0);

    expect(el.shadowRoot.querySelector('.async-detail')?.textContent).to.equal('Loaded');
    expect(el.shadowRoot.querySelector('wa-details wa-spinner')).to.not.exist;
  });
});
