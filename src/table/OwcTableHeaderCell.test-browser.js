import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
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

  it('keeps its sort button out of the accessibility tree and out of the Tab order', async () => {
    const wrapper = await fixture(html`
      <div>
        <button id="before">before</button>
        <owc-table-header-cell field="firstName">Name</owc-table-header-cell>
        <button id="after">after</button>
      </div>
    `);
    const el = wrapper.querySelector('owc-table-header-cell');
    const button = el.shadowRoot.querySelector('button');
    expect(button.getAttribute('aria-hidden')).to.equal('true');
    await expect(el).to.be.accessible();

    wrapper.querySelector('#before').focus();
    await sendKeys({ press: 'Tab' });
    expect(document.activeElement.id).to.equal('after');
  });

  it('sorts when its sort button is clicked', async () => {
    const el = await fixture(
      html`<owc-table-header-cell field="firstName">Name</owc-table-header-cell>`,
    );
    const rect = el.shadowRoot.querySelector('button').getBoundingClientRect();
    setTimeout(() =>
      sendMouse({
        type: 'click',
        position: [Math.round(rect.left + rect.width / 2), Math.round(rect.top + rect.height / 2)],
      }),
    );
    await oneEvent(el, 'sort-changed');
    expect(el.order).to.equal('asc');
  });

  it('cycles its sort with cycleSort(), as a click does', async () => {
    const el = await fixture(
      html`<owc-table-header-cell field="firstName">Name</owc-table-header-cell>`,
    );
    const orders = [];
    el.addEventListener('sort-changed', () => orders.push(el.sorters[0].order));
    el.cycleSort();
    el.shadowRoot.querySelector('#wrapper').click();
    el.cycleSort();
    el.cycleSort();
    expect(orders).to.deep.equal(['asc', 'desc', undefined, 'asc']);
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
