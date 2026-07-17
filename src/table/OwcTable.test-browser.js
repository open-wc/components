import { fixture, html, expect, oneEvent } from '@open-wc/testing';
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
});
