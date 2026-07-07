import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcTableFilterBuilder } from './OwcTableFilterBuilder.js';
import { globalSearchField } from './jsonToFilter.js';

customElements.define('owc-table-filter-builder', OwcTableFilterBuilder);

const columns = [
  { label: 'First Name', field: 'firstName', filterable: true },
  { label: 'Last Name', field: 'lastName', filterable: true },
];

describe('owc-table-filter-builder', () => {
  it('renders an empty "add filter" entry by default', async () => {
    const el = await fixture(
      html`<owc-table-filter-builder .columns=${columns}></owc-table-filter-builder>`,
    );
    expect(el.value).to.deep.equal([]);
    expect(el.shadowRoot.querySelector('owc-table-filter')).to.exist;
  });

  it('does not mutate the assigned value array', async () => {
    const assigned = [{ field: 'firstName', operator: 'includes', value: 'Ada' }];
    const el = await fixture(
      html`<owc-table-filter-builder
        .columns=${columns}
        .value=${assigned}
      ></owc-table-filter-builder>`,
    );

    // add a second filter through the trailing "new AND" entry
    const newFilter = el.shadowRoot.querySelector('.renderNewAnd owc-table-filter');
    newFilter.value = { field: 'lastName', operator: 'includes', value: 'L' };
    setTimeout(() => newFilter.dispatchEvent(new Event('change')));
    await oneEvent(el, 'change');

    expect(el.value).to.have.length(2);
    expect(assigned).to.have.length(1);
  });

  it('updates its value and re-fires change when an existing filter changes', async () => {
    const el = await fixture(
      html`<owc-table-filter-builder
        .columns=${columns}
        .value=${[{ field: 'firstName', operator: 'includes', value: 'Ada' }]}
      ></owc-table-filter-builder>`,
    );

    const filters = [...el.shadowRoot.querySelectorAll('owc-table-filter')];
    const existing = filters.find(f => f.value.field === 'firstName');
    existing.value = { field: 'firstName', operator: 'includes', value: 'Grace' };
    setTimeout(() => existing.dispatchEvent(new Event('change')));
    await oneEvent(el, 'change');

    expect(el.value[0].value).to.equal('Grace');
  });

  it('removes a filter when its delete event fires', async () => {
    const el = await fixture(
      html`<owc-table-filter-builder
        .columns=${columns}
        .value=${[{ field: 'firstName', operator: 'includes', value: 'Ada' }]}
      ></owc-table-filter-builder>`,
    );

    const filters = [...el.shadowRoot.querySelectorAll('owc-table-filter')];
    const existing = filters.find(f => f.value.field === 'firstName');
    setTimeout(() => existing.dispatchEvent(new Event('delete')));
    await oneEvent(el, 'change');

    expect(el.value).to.deep.equal([]);
  });

  describe('global search', () => {
    it('prepends a disabled global-search filter and renders a search input', async () => {
      const el = await fixture(
        html`<owc-table-filter-builder
          global-search
          .columns=${columns}
        ></owc-table-filter-builder>`,
      );
      expect(el.value[0].field).to.equal(globalSearchField);
      expect(el.value[0].enabled).to.be.false;
      expect(el.shadowRoot.querySelector('wa-input.global-search')).to.exist;
    });

    it('enables the global-search filter when typing into the search input', async () => {
      const el = await fixture(
        html`<owc-table-filter-builder
          global-search
          .columns=${columns}
        ></owc-table-filter-builder>`,
      );

      const search = el.shadowRoot.querySelector('wa-input.global-search');
      search.value = 'Ada';
      setTimeout(() => search.dispatchEvent(new Event('input', { bubbles: true })));
      await oneEvent(el, 'change');

      expect(el.value[0].value).to.equal('Ada');
      expect(el.value[0].enabled).to.be.true;
    });

    it('hides the manual filter entries with global-search-only', async () => {
      const el = await fixture(
        html`<owc-table-filter-builder
          global-search
          global-search-only
          .columns=${columns}
        ></owc-table-filter-builder>`,
      );
      expect(el.shadowRoot.querySelector('wa-input.global-search')).to.exist;
      expect(el.shadowRoot.querySelector('owc-table-filter')).to.not.exist;
    });
  });
});
