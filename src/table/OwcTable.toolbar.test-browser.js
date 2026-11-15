import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { OwcTable } from './OwcTable.js';
import { deepActiveElement } from '../a11y/controls.js';
import { expectAccessible } from '../a11y/axe.test-browser.helpers.js';
import { untilStable } from '../virtualizer/virtualList.test-browser.helpers.js';

customElements.define('owc-table', OwcTable);

// The parts of the table around the grid that the keyboard accessibility spec
// leaves out of scope (C4): the filter builder, the info block's action tabs,
// mass edit and the add-row button. Each gets axe and one keyboard smoke test:
// it is reached with Tab and works with Enter or Space. What is missing
// beyond that is in follow-up tickets of the spec.

/** @typedef {OwcTable<Record<string, unknown>>} Table */

const columns = [
  {
    label: 'First Name',
    field: 'firstName',
    filterable: true,
    type: 'editable',
    editableOptions: { massEdit: true },
  },
  { label: 'Age', field: 'age', formatter: 'number', filterable: true, filterType: 'number' },
  { label: 'City', field: 'city', filterable: true },
];

const data = () => [
  { id: '1', firstName: 'Robert', age: 34, city: 'Vienna' },
  { id: '2', firstName: 'Sarah', age: 65, city: 'Graz' },
  { id: '3', firstName: 'Grace', age: 25, city: 'Linz' },
];

/** The built-in action tabs, all shown. */
const actionTabs = {
  calculateSums: { visible: true },
  export: { visible: true },
  massEdit: { visible: true },
  settings: { visible: true },
};

/**
 * A table between two buttons, so tests can Tab into it.
 *
 * @param {import('lit').TemplateResult} template
 */
async function toolbarFixture(template) {
  const wrapper = await fixture(
    html`<div>
      <button id="before">before</button>
      ${template}
    </div>`,
  );
  const el = /** @type {Table} */ (wrapper.querySelector('owc-table'));
  await el.updateComplete;
  await untilStable(el, () => el.shadowRoot.innerHTML.length, { animations: true });
  return { el, before: /** @type {HTMLElement} */ (wrapper.querySelector('#before')) };
}

/**
 * Selects rows with their checkboxes.
 *
 * @param {Table} el
 * @param {number[]} indices
 */
async function select(el, indices) {
  for (const index of indices) {
    /** @type {HTMLElement} */ (
      el.shadowRoot.querySelector(`.row[data-index="${index}"] wa-checkbox`)
    ).click();
    await el.updateComplete;
  }
  expect(el.selectedData).to.have.length(indices.length);
}

/** @param {Table} el */
function info(el) {
  return /** @type {HTMLElement & { actionTabActive: string }} */ (
    el.shadowRoot.querySelector('owc-table-info')
  );
}

/**
 * Presses Tab until `isThere()` holds, at most 40 times.
 *
 * @param {() => boolean} isThere
 * @param {string} what
 */
async function tabTo(isThere, what) {
  for (let presses = 0; presses < 40 && !isThere(); presses++) {
    await sendKeys({ press: 'Tab' });
  }
  expect(isThere(), `Tab reaches ${what}`).to.be.true;
}

/**
 * The element with the focus, and its text.
 *
 * @param {Element | null} element
 */
function textOf(element) {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('owc-table toolbar passes axe', () => {
  it('with the info block, its action tabs and the add-row button', async () => {
    const { el } = await toolbarFixture(
      html`<owc-table
        show-info
        selectable
        .columns=${columns}
        .data=${data()}
        .actionTabs=${actionTabs}
        .handleInsert=${() => ({ id: '', firstName: '', age: 0, city: '' })}
      ></owc-table>`,
    );
    await expectAccessible(el);
  });

  it('with the filter builder open', async () => {
    const { el } = await toolbarFixture(
      html`<owc-table
        filter-mode="global-search-with-builder"
        .columns=${columns}
        .data=${data()}
        .jsonFilters=${[{ field: 'city', operator: 'equal', value: 'Vienna' }]}
      ></owc-table>`,
    );
    expect(el.shadowRoot.querySelector('owc-table-filter-builder')).to.exist;
    await expectAccessible(el);
  });

  it('with mass edit open, for a column', async () => {
    const { el } = await toolbarFixture(
      html`<owc-table
        selectable
        .columns=${columns}
        .data=${data()}
        .actionTabs=${actionTabs}
        .actionTabActive=${'massEdit'}
      ></owc-table>`,
    );
    const massEdit = await untilMassEdit(el);
    await expectAccessible(el);
    massEdit.setColumn('firstName');
    await massEdit.updateComplete;
    expect(massEdit.shadowRoot.querySelector('wa-input')).to.exist;
    await expectAccessible(el);
  });
});

/**
 * The mass edit of the open action tab.
 *
 * @param {Table} el
 */
async function untilMassEdit(el) {
  /** @type {any} */
  let massEdit;
  await waitUntil(() => {
    massEdit = tabsOf(el).shadowRoot.querySelector('owc-table-mass-edit');
    return massEdit;
  }, 'mass edit is open');
  await massEdit.updateComplete;
  return massEdit;
}

/** @param {Table} el */
function tabsOf(el) {
  return /** @type {HTMLElement & { active: string }} */ (
    info(el).shadowRoot.querySelector('owc-tabs')
  );
}

/**
 * The tab button of an action tab, e.g. `export`.
 *
 * @param {Table} el
 * @param {string} key
 */
function tabButton(el, key) {
  return /** @type {HTMLElement} */ (
    tabsOf(el).shadowRoot.querySelector(`wa-button[panel="${key}"]`)
  );
}

/** The focused element is in (or is) `element`, through shadow roots. */
function hasFocusIn(/** @type {Element} */ element) {
  for (let active = deepActiveElement(); active;) {
    if (active === element) {
      return true;
    }
    const root = active.getRootNode();
    active = active.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  }
  return false;
}

describe('owc-table toolbar with the keyboard', () => {
  it('reaches the global search and the filter builder with Tab, and adds and deletes a filter with Enter and Space', async () => {
    const { el, before } = await toolbarFixture(
      html`<owc-table
        filter-mode="global-search-with-builder"
        .columns=${columns}
        .data=${data()}
      ></owc-table>`,
    );
    const builder = /** @type {any} */ (el.shadowRoot.querySelector('owc-table-filter-builder'));
    before.focus();
    await tabTo(
      () => hasFocusIn(builder.shadowRoot.querySelector('wa-input.global-search')),
      'the global search',
    );
    await sendKeys({ type: 'Linz' });
    await waitUntil(() => el.visibleData.length === 1, 'the search filters the rows');

    const addButton = () =>
      [...builder.shadowRoot.querySelectorAll('owc-table-filter')]
        .map(filter => filter.shadowRoot.querySelector('button'))
        .find(button => button && textOf(button) === 'Add filter');
    await tabTo(() => deepActiveElement() === addButton(), 'Add filter');
    await sendKeys({ press: 'Enter' });
    const selector = () =>
      [...builder.shadowRoot.querySelectorAll('owc-table-filter')]
        .map(filter => filter.shadowRoot.querySelector('.field-selector'))
        .find(Boolean);
    await waitUntil(
      () => selector() && hasFocusIn(selector()),
      'the new filter asks for its column',
    );

    const deleteButton = () =>
      [...builder.shadowRoot.querySelectorAll('owc-table-filter')]
        .map(filter => filter.shadowRoot.querySelector('.delete-button'))
        .find(Boolean);
    before.focus();
    await tabTo(() => hasFocusIn(deleteButton()), 'Delete filter');
    expect(deleteButton().label).to.equal('Delete filter');
    // the buttons of a filter show while one of them has the focus, not only on hover
    const controls = deleteButton().parentElement;
    await waitUntil(() => getComputedStyle(controls).opacity === '1', 'the buttons show');
    await sendKeys({ press: 'Space' });
    await waitUntil(() => !deleteButton(), 'the filter is deleted');
  });

  it('reaches the action tabs with Tab, and opens and closes them with Enter and Space', async () => {
    const { el, before } = await toolbarFixture(
      html`<owc-table
        show-info
        .columns=${columns}
        .data=${data()}
        .actionTabs=${actionTabs}
      ></owc-table>`,
    );
    before.focus();
    await tabTo(() => hasFocusIn(tabButton(el, 'calculateSums')), 'the first action tab');
    await sendKeys({ press: 'Tab' });
    expect(hasFocusIn(tabButton(el, 'export'))).to.be.true;
    await sendKeys({ press: 'Enter' });
    await waitUntil(() => tabsOf(el).active === 'export', 'Enter opens the tab');
    expect(info(el).actionTabActive).to.equal('export');
    await sendKeys({ press: 'Space' });
    await waitUntil(() => tabsOf(el).active === '', 'Space closes it again');
  });

  it('reaches mass edit with Tab, and edits the selected rows with the keyboard', async () => {
    const rows = data();
    const { el, before } = await toolbarFixture(
      html`<owc-table
        selectable
        .columns=${columns}
        .data=${rows}
        .actionTabs=${actionTabs}
        .handleUpdate=${(/** @type {any} */ { autoSetData }) => autoSetData()}
      ></owc-table>`,
    );
    await select(el, [0, 2]);
    before.focus();
    await tabTo(() => hasFocusIn(tabButton(el, 'massEdit')), 'the Bulk edit tab');
    await sendKeys({ press: 'Enter' });
    const massEdit = await untilMassEdit(el);

    // the column to edit
    const picker = massEdit.shadowRoot.querySelector('owc-autocomplete');
    await tabTo(() => hasFocusIn(picker), 'the column picker');
    await sendKeys({ press: 'Enter' });
    await waitUntil(() => picker.open, 'Enter opens the column picker');
    await sendKeys({ press: 'ArrowDown' });
    await sendKeys({ press: 'Enter' });
    await waitUntil(() => massEdit.column?.field === 'firstName', 'Enter picks the column');

    // its new value, a preview, and applying it
    const input = () => massEdit.shadowRoot.querySelector('wa-input');
    await tabTo(() => hasFocusIn(input()), 'the value');
    await sendKeys({ type: 'Kim' });
    const button = (/** @type {string} */ text) =>
      [...massEdit.shadowRoot.querySelectorAll('wa-button')].find(b => textOf(b).startsWith(text));
    await tabTo(() => hasFocusIn(button('Preview')), 'Preview');
    await sendKeys({ press: 'Enter' });
    await waitUntil(() => button('Apply'), 'Enter shows the preview');
    await tabTo(() => hasFocusIn(button('Apply')), 'Apply');
    await sendKeys({ press: 'Space' });
    await waitUntil(() => rows[0].firstName === 'Kim', 'Space applies the edit');
    expect(rows.map(row => row.firstName)).to.deep.equal(['Kim', 'Sarah', 'Kim']);
  });

  it('reaches the add-row button with Tab, and adds a row with Enter, whose first field gets the focus', async () => {
    const { el, before } = await toolbarFixture(
      html`<owc-table
        .columns=${columns}
        .data=${data()}
        .handleInsert=${() => ({ id: '', firstName: '', age: 0, city: '' })}
      ></owc-table>`,
    );
    const newButton = /** @type {HTMLElement} */ (
      el.shadowRoot.querySelector('#info-wrapper > wa-button')
    );
    before.focus();
    await tabTo(() => hasFocusIn(newButton), 'the add-row button');
    expect(textOf(newButton)).to.equal('New');
    await sendKeys({ press: 'Enter' });
    await waitUntil(() => el.insertData.length === 1, 'Enter adds a row');
    const firstField = () =>
      el.shadowRoot.querySelector('.row[data-index="3"] owc-click-editable-input');
    await waitUntil(
      () => firstField() && el.shadowRoot.activeElement === firstField(),
      'the first field of the new row has the focus',
    );
  });
});
