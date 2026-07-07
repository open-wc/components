import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcTableHeaderCell } from './OwcTableHeaderCell.js';

customElements.define('owc-table-header-cell', OwcTableHeaderCell);

describe('owc-table-header-cell', () => {
  it('renders its label via the default slot', async () => {
    const el = await fixture(html`<owc-table-header-cell>First Name</owc-table-header-cell>`);
    expect(el.textContent).to.equal('First Name');
    expect(el.shadowRoot.querySelector('button')).to.exist;
  });

  it('hides the sort button when not sortable', async () => {
    const el = await fixture(
      html`<owc-table-header-cell .sortable=${false}>Name</owc-table-header-cell>`,
    );
    expect(el.shadowRoot.querySelector('button')).to.not.exist;
  });

  it('toggles order asc -> desc on click and fires sort-changed', async () => {
    const el = await fixture(
      html`<owc-table-header-cell field="firstName">Name</owc-table-header-cell>`,
    );
    const wrapper = el.shadowRoot.querySelector('#wrapper');

    setTimeout(() => wrapper.click());
    await oneEvent(el, 'sort-changed');
    expect(el.order).to.equal('asc');
    expect(el.sorters).to.deep.equal([{ field: 'firstName', order: 'asc' }]);

    setTimeout(() => wrapper.click());
    await oneEvent(el, 'sort-changed');
    expect(el.order).to.equal('desc');
    expect(el.sorters).to.deep.equal([{ field: 'firstName', order: 'desc' }]);
  });

  it('uses customSorters when provided', async () => {
    const customSorters = [{ field: 'meta.added', sortType: 'dateNoYear' }];
    const el = await fixture(
      html`<owc-table-header-cell field="added" .customSorters=${customSorters}>
        Added
      </owc-table-header-cell>`,
    );

    setTimeout(() => el.shadowRoot.querySelector('#wrapper').click());
    await oneEvent(el, 'sort-changed');
    expect(el.sorters).to.deep.equal([
      { field: 'meta.added', order: 'asc', sortType: 'dateNoYear' },
    ]);
  });

  it('does not sort when sortable is false', async () => {
    const el = await fixture(
      html`<owc-table-header-cell .sortable=${false} field="firstName"
        >Name</owc-table-header-cell
      >`,
    );
    let fired = false;
    el.addEventListener('sort-changed', () => {
      fired = true;
    });
    el.shadowRoot.querySelector('#wrapper').click();
    expect(fired).to.be.false;
    expect(el.order).to.equal(null);
  });
});
