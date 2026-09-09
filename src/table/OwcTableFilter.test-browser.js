import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcTableFilter } from './OwcTableFilter.js';

customElements.define('owc-table-filter', OwcTableFilter);

const columns = [
  { label: 'First Name', field: 'firstName', filterable: true },
  { label: 'Age', field: 'age', filterable: true, filterType: 'number' },
];

/**
 * @param {import('./filter.type.js').JsonFilter} [value]
 */
async function filterFixture(value) {
  /** @type {OwcTableFilter<Record<string, unknown>>} */
  const el = await fixture(html`<owc-table-filter .columns=${columns}></owc-table-filter>`);
  if (value) {
    el.value = value;
    await el.updateComplete;
  }
  return el;
}

describe('owc-table-filter', () => {
  it('starts as an "add filter" button', async () => {
    const el = await filterFixture();
    expect(el.onlyButton).to.be.true;
    expect(el.shadowRoot.querySelector('button')).to.exist;
    expect(el.shadowRoot.querySelector('.field-selector')).to.not.exist;
  });

  it('shows the field selector after clicking the add button', async () => {
    const el = await filterFixture();
    el.addClickHandler();
    await el.updateComplete;
    expect(el.onlyButton).to.be.false;
    expect(el.shadowRoot.querySelector('.field-selector')).to.exist;
  });

  it('renders operator select and filter input for a text filter value', async () => {
    const el = await filterFixture({ field: 'firstName', operator: 'includes', value: 'Ada' });
    expect(el.selectedIndex).to.equal(0);
    expect(el.column).to.equal(columns[0]);
    expect(el.shadowRoot.querySelector('wa-select.operator')).to.exist;
    expect(el.shadowRoot.querySelector('wa-input.field-filter')).to.exist;
  });

  it('hides the value input for the isEmpty operator', async () => {
    const el = await filterFixture({ field: 'firstName', operator: 'isEmpty', value: '' });
    expect(el.shadowRoot.querySelector('wa-select.operator')).to.exist;
    expect(el.shadowRoot.querySelector('wa-input.field-filter')).to.not.exist;
  });

  it('toggles enabled via the pause/play button and fires change', async () => {
    const el = await filterFixture({ field: 'firstName', operator: 'includes', value: 'Ada' });
    expect(el.enabled).to.be.true;

    const [toggle] = el.shadowRoot.querySelectorAll('.toggle-button');
    setTimeout(() => toggle.click());
    await oneEvent(el, 'change');
    expect(el.enabled).to.be.false;
    expect(el.value.enabled).to.be.false;
  });

  it('toggles negated via the exclamation button and fires change', async () => {
    const el = await filterFixture({ field: 'firstName', operator: 'includes', value: 'Ada' });
    expect(el.negated).to.be.false;

    const [, negate] = el.shadowRoot.querySelectorAll('.toggle-button');
    setTimeout(() => negate.click());
    await oneEvent(el, 'change');
    expect(el.negated).to.be.true;
    expect(el.value.negated).to.be.true;
  });

  it('resets to the add button and fires delete when deleted', async () => {
    const el = await filterFixture({ field: 'firstName', operator: 'includes', value: 'Ada' });

    setTimeout(() => el.shadowRoot.querySelector('.delete-button').click());
    await oneEvent(el, 'delete');
    await el.updateComplete;
    expect(el.value.field).to.equal('OwcTableFilterButton');
    expect(el.onlyButton).to.be.true;
    expect(el.shadowRoot.querySelector('button')).to.exist;
  });

  it('reset() returns to the add button state', async () => {
    const el = await filterFixture({ field: 'firstName', operator: 'includes', value: 'Ada' });
    el.reset();
    await el.updateComplete;
    expect(el.onlyButton).to.be.true;
  });
});
