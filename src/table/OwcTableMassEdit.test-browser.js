import { fixture, html, expect } from '@open-wc/testing';
import { OwcTableMassEdit } from './OwcTableMassEdit.js';

customElements.define('owc-table-mass-edit', OwcTableMassEdit);

const columns = [
  { field: 'name', label: 'Name', editableOptions: { massEdit: true } },
  { field: 'notes', label: 'Notes', editableOptions: { massEdit: true, type: 'textarea' } },
  { field: 'active', label: 'Active', editableOptions: { massEdit: true, type: 'checkbox' } },
  { field: 'internal', label: 'Internal' },
];

function makeTableStub() {
  const stub = {
    visibleColumns: columns.slice(0, 1),
    overrides: { visibility: {} },
    requestUpdate() {},
    compareOverrides: undefined,
    _renderType: 'html',
    /** @type {any[]} */
    updates: [],
  };
  stub.handleUpdate = (/** @type {any} */ update) => stub.updates.push(update);
  return stub;
}

/**
 * @param {{ table?: object, data?: object[], allData?: object[] }} [overrides]
 */
async function massEditFixture({ table = makeTableStub(), data = [], allData = [] } = {}) {
  const el = await fixture(
    html`<owc-table-mass-edit
      .columns=${columns}
      .table=${table}
      .data=${data}
      .allData=${allData}
    ></owc-table-mass-edit>`,
  );
  return el;
}

describe('owc-table-mass-edit', () => {
  it('offers only columns with editableOptions.massEdit', async () => {
    const el = await massEditFixture();
    const picker = el.shadowRoot.querySelector('owc-autocomplete');
    expect(picker.data.map(option => option.label)).to.deep.equal(['Name', 'Notes', 'Active']);
  });

  it('renders the form for the selected column, per editable type', async () => {
    const el = await massEditFixture();

    el.setColumn('name');
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('wa-input')).to.exist;

    el.setColumn('notes');
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('wa-textarea')).to.exist;

    el.setColumn('active');
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('wa-checkbox')).to.exist;
  });

  it('registers its form elements itself (regression)', () => {
    // used standalone, wa-textarea/wa-checkbox previously relied on other
    // components having imported them
    expect(customElements.get('wa-textarea')).to.exist;
    expect(customElements.get('wa-checkbox')).to.exist;
  });

  it('makes an invisible column visible while editing and restores it afterwards', async () => {
    const table = makeTableStub();
    const el = await massEditFixture({ table });

    el.setColumn('notes');
    expect(table.overrides.visibility.notes).to.equal('always');

    el.resetColumn();
    expect(table.overrides.visibility.notes).to.equal(undefined);
    expect(el.column).to.equal(undefined);
  });

  it('previews changes as compare overrides for the selected rows only', async () => {
    const table = makeTableStub();
    const selected = { id: 1, name: 'old' };
    const other = { id: 2, name: 'other' };
    const el = await massEditFixture({ table, data: [selected], allData: [selected, other] });

    el.setColumn('name');
    el.value = 'new';
    el.preview = true;
    await el.updateComplete;

    expect(table._renderType).to.equal('compare');
    expect(table.compareOverrides).to.deep.equal({ 1: { name: 'new' } });

    el.preview = false;
    await el.updateComplete;
    expect(table._renderType).to.equal('html');
    expect(table.compareOverrides).to.equal(undefined);
  });

  it('executes the edit via the table handleUpdate for every selected row', async () => {
    const table = makeTableStub();
    const rows = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ];
    const el = await massEditFixture({ table, data: rows, allData: rows });

    el.setColumn('name');
    el.value = 'bulk';
    el.preview = true;
    el.executeEdit(new MouseEvent('click'));

    expect(table.updates.length).to.equal(2);
    expect(table.updates[0].field).to.equal('name');
    expect(table.updates[0].value).to.equal('bulk');

    // autoSetData still applies the value when called after executeEdit
    // returned, e.g. after an async save (regression - it used to read the
    // already-reset live value)
    table.updates[0].autoSetData();
    expect(rows[0].name).to.equal('bulk');

    // the edit round is reset afterwards
    expect(el.preview).to.equal(false);
    expect(el.value).to.equal('');
  });
});
