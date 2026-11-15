import { html, expect, waitUntil } from '@open-wc/testing';
import { nothing } from 'lit';
import '@awesome.me/webawesome/dist/components/details/details.js';
import { untilStable } from '../virtualizer/virtualList.test-browser.helpers.js';
import { expectAccessible } from '../a11y/axe.test-browser.helpers.js';
import { bodyRows, rows, settle, tableFixture } from './OwcTable.test-browser.helpers.js';

// axe over every configuration of the table that the keyboard accessibility
// spec lists (C2). `expectAccessible` ignores only findings in Web Awesome's
// markup, each with its reason.

/** @typedef {import('./OwcTable.test-browser.helpers.js').Table} Table */

const columns = [
  { label: 'First Name', field: 'firstName' },
  { label: 'Age', field: 'age', formatter: 'number' },
  { label: 'City', field: 'city' },
];

const data = [
  { id: '1', firstName: 'Robert', age: 34, city: 'Vienna' },
  { id: '2', firstName: 'Sarah', age: 65, city: 'Graz' },
  { id: '3', firstName: 'Grace', age: 25, city: 'Vienna' },
  { id: '4', firstName: 'Linus', age: 54, city: 'Helsinki' },
];

/**
 * A table whose rows and animations have settled.
 *
 * @param {import('lit').TemplateResult} template
 */
const axeFixture = template => tableFixture(template, { animations: true });

const renderDetail = (/** @type {Record<string, unknown>} */ row) =>
  html`<p>About ${row.firstName}</p>
    <button>Call ${row.firstName}</button>`;

const getRowLinkSettings = (/** @type {Record<string, unknown>} */ row) => ({
  href: `#row-${row.id}`,
});

describe('owc-table passes axe', () => {
  afterEach(() => {
    window.scrollTo(0, 0);
  });

  it('with simple rows', async () => {
    const el = await axeFixture(html`<owc-table .columns=${columns} .data=${data}></owc-table>`);
    await expectAccessible(el);
  });

  it('with link rows', async () => {
    const el = await axeFixture(
      html`<owc-table
        render-mode="link"
        .columns=${columns}
        .data=${data}
        .getRowLinkSettings=${getRowLinkSettings}
      ></owc-table>`,
    );
    await expectAccessible(el);
  });

  for (const renderMode of ['detail', 'detailDeferred', 'linkWithDetail']) {
    it(`with ${renderMode} rows, one of them open`, async () => {
      const el = await axeFixture(
        html`<owc-table
          render-mode=${renderMode}
          .columns=${columns}
          .data=${data}
          .getRowLinkSettings=${getRowLinkSettings}
          .renderDetail=${renderDetail}
          .openDetails=${['2']}
        ></owc-table>`,
      );
      await expectAccessible(el);
    });
  }

  it('with several details open', async () => {
    const el = await axeFixture(
      html`<owc-table
        render-mode="detail"
        .columns=${columns}
        .data=${data}
        .renderDetail=${renderDetail}
        .openDetails=${['1', '3']}
      ></owc-table>`,
    );
    await expectAccessible(el);
  });

  it('when selectable, with a row selected', async () => {
    const el = await axeFixture(
      html`<owc-table selectable .columns=${columns} .data=${data}></owc-table>`,
    );
    /** @type {HTMLElement} */ (bodyRows(el)[1].querySelector('wa-checkbox')).click();
    await settle(el, { animations: true });
    expect(bodyRows(el)[1].getAttribute('aria-selected')).to.equal('true');
    await expectAccessible(el);
  });

  it('when selectable, with details and links', async () => {
    const el = await axeFixture(
      html`<owc-table
        selectable
        render-mode="linkWithDetail"
        .columns=${columns}
        .data=${data}
        .getRowLinkSettings=${getRowLinkSettings}
        .renderDetail=${renderDetail}
        .openDetails=${['1']}
      ></owc-table>`,
    );
    await expectAccessible(el);
  });

  it('when editable, with an insert row', async () => {
    const el = await axeFixture(
      html`<owc-table
        .columns=${[
          { label: 'First Name', field: 'firstName', type: 'editable' },
          {
            label: 'Notes',
            field: 'notes',
            type: 'editable',
            editableOptions: { type: 'textarea' },
          },
          {
            label: 'Profession',
            field: 'profession',
            type: 'editable',
            editableOptions: {
              type: 'autocomplete',
              data: [
                { value: 'teacher', label: 'Teacher' },
                { value: 'lawyer', label: 'Lawyer' },
              ],
            },
          },
          {
            label: 'Active',
            field: 'active',
            type: 'editable',
            editableOptions: { type: 'checkbox' },
          },
          { label: 'Age', field: 'age', formatter: 'number' },
        ]}
        .data=${data.map(row => ({ ...row, notes: 'Note', profession: 'teacher', active: true }))}
        .insertData=${[{ id: '', firstName: '', notes: '', profession: '', active: false }]}
      ></owc-table>`,
    );
    await expectAccessible(el);
  });

  it('when grouped, with the Others group', async () => {
    const el = await axeFixture(
      html`<owc-table
        .columns=${columns}
        .data=${data}
        .groupSelector=${row => row.city}
        .groupList=${[
          { key: 'Vienna', label: 'Vienna', active: true },
          { key: 'Graz', label: 'Graz', active: false },
        ]}
        .othersGroupActive=${true}
      ></owc-table>`,
    );
    await expectAccessible(el);
  });

  it('when virtualized and scrolled to the middle', async () => {
    const el = await axeFixture(
      html`<owc-table
        virtualizer-mode="always"
        .columns=${columns}
        .data=${rows(2000)}
      ></owc-table>`,
    );
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + el.offsetHeight / 2);
    await settle(el, { animations: true });
    expect(Number(bodyRows(el)[0].getAttribute('data-index'))).to.be.greaterThan(500);
    await expectAccessible(el);
  });

  it('with a sticky header, scrolled', async () => {
    const el = await axeFixture(
      html`<owc-table sticky-header .columns=${columns} .data=${rows(100)}></owc-table>`,
    );
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 500);
    await settle(el, { animations: true });
    await expectAccessible(el);
  });

  it('when empty', async () => {
    const el = await axeFixture(html`<owc-table .columns=${columns} .data=${[]}></owc-table>`);
    await expectAccessible(el);
  });

  it('while loading', async () => {
    const el = await axeFixture(
      html`<owc-table loading .columns=${columns} .data=${[]}></owc-table>`,
    );
    await expectAccessible(el);
  });

  it('with annotations and an open detail', async () => {
    const el = await axeFixture(
      html`<owc-table
        render-mode="detail"
        .columns=${columns}
        .data=${data}
        .renderDetail=${renderDetail}
        .openDetails=${['2']}
        .renderAnnotation=${row =>
          row.id === '2' ? html`<strong>Overdue:</strong> invoice open` : nothing}
      ></owc-table>`,
    );
    await expectAccessible(el);
  });

  describe('with the column settings open', () => {
    afterEach(() => {
      localStorage.removeItem('axe-settings-override-settings');
      const url = new URL(location.href);
      url.searchParams.delete('axe-settings-overrides');
      url.searchParams.delete('axe-settings-action-tab-active');
      history.replaceState({}, '', url);
    });

    /**
     * Opens the dropdown of the settings tab, and waits for it to settle.
     *
     * @param {Table} el
     */
    async function openSettings(el) {
      /** @type {any} */
      let settings;
      await waitUntil(() => {
        settings = el.shadowRoot
          .querySelector('owc-table-info')
          ?.shadowRoot?.querySelector('owc-tabs')
          ?.shadowRoot?.querySelector('owc-table-settings');
        return settings;
      }, 'the settings tab is open');
      settings.open = true;
      await settings.updateComplete;
      await waitUntil(
        () => settings.shadowRoot.activeElement === settings.search,
        'the search gets the focus',
      );
      await untilStable(settings, () => settings.shadowRoot.innerHTML.length, {
        animations: true,
      });
      return settings;
    }

    const settingsTable = html`<owc-table
      store-name-prefix="axe-settings"
      .columns=${[...columns, { label: 'Notes', field: 'notes', visible: 'ifFiltered' }]}
      .data=${data}
      .actionTabs=${{ settings: { visible: true } }}
      .actionTabActive=${'settings'}
    ></owc-table>`;

    it('with every column', async () => {
      const el = await axeFixture(settingsTable);
      await openSettings(el);
      await expectAccessible(el);
    });

    it('with the legend shown and a search', async () => {
      const el = await axeFixture(settingsTable);
      const settings = await openSettings(el);
      /** @type {HTMLElement} */ (
        settings.shadowRoot.querySelector('#footer-actions wa-button')
      ).click();
      settings.search.value = 'Name';
      settings.search.dispatchEvent(new Event('input'));
      await settings.updateComplete;
      await untilStable(settings, () => settings.shadowRoot.innerHTML.length);
      expect(settings.shadowRoot.querySelectorAll('#rows > .row')).to.have.length(1);
      await expectAccessible(el);
    });
  });
});
