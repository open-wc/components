import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcTableHeaderCell } from './OwcTableHeaderCell.js';

customElements.define('owc-table-header-cell', OwcTableHeaderCell);

describe('owc-table-header-cell', () => {
  it('uses German terms after the German translation is registered', async () => {
    const originalLanguage = document.documentElement.lang;
    await import('@open-wc/components/register/de.js');
    document.documentElement.lang = 'de-AT';

    const el = await fixture(html`<owc-table-header-cell>Name</owc-table-header-cell>`);
    expect(el.shadowRoot.querySelector('button').getAttribute('aria-label')).to.equal('Sortieren');

    document.documentElement.lang = originalLanguage;
  });

  it('falls back to English for an unsupported locale', async () => {
    const originalLanguage = document.documentElement.lang;
    await import('@open-wc/components/register/en.js');
    document.documentElement.lang = 'fr-CA';

    const el = await fixture(html`<owc-table-header-cell>Name</owc-table-header-cell>`);
    expect(el.shadowRoot.querySelector('button').getAttribute('aria-label')).to.equal('Sort');

    document.documentElement.lang = originalLanguage;
  });

  it('uses the parent host language when the child host has no explicit lang', async () => {
    const originalLanguage = document.documentElement.lang;
    document.documentElement.lang = 'de-AT';

    const el = await fixture(html`
      <div lang="en">
        <owc-table-header-cell>Name</owc-table-header-cell>
      </div>
    `);
    const headerCell = el.querySelector('owc-table-header-cell');
    expect(headerCell.shadowRoot.querySelector('button').getAttribute('aria-label')).to.equal(
      'Sort',
    );

    document.documentElement.lang = originalLanguage;
  });

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
    expect(el.order).to.equal(undefined);
  });
});
