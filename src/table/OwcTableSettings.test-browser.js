import { fixture, html, expect, nextFrame, oneEvent, waitUntil } from '@open-wc/testing';
import { resetMouse, sendKeys, sendMouse } from '@web/test-runner-commands';
import '@open-wc/components/register/de.js';
import { OwcTable } from './OwcTable.js';
import { OwcTableSettings } from './OwcTableSettings.js';

customElements.define('owc-table-settings', OwcTableSettings);
customElements.define('owc-table', OwcTable);

const columns = [
  { field: 'a', label: 'A', visible: 'always' },
  { field: 'b', label: 'B', visible: 'always' },
];

let prefixCounter = 0;

/**
 * Every test gets its own storage prefix so localStorage/URL state cannot
 * leak between tests.
 */
function nextPrefix() {
  prefixCounter += 1;
  return `settings-test-${prefixCounter}`;
}

/**
 * @param {string} prefix
 */
async function settingsFixture(prefix) {
  return fixture(
    html`<owc-table-settings .columns=${columns} .storeNamePrefix=${prefix}></owc-table-settings>`,
  );
}

/**
 * @param {string} prefix
 */
function cleanup(prefix) {
  localStorage.removeItem(`${prefix}-override-settings`);
  const url = new URL(location.href);
  url.searchParams.delete(`${prefix}-overrides`);
  history.replaceState({}, '', url);
}

describe('owc-table-settings', () => {
  it('shows the localized columns trigger text', async () => {
    const prefix = nextPrefix();
    const el = await settingsFixture(prefix);
    // the old renderComboBox override was never called by the base class
    expect(el.shadowRoot.querySelector('#placeholder').textContent.trim()).to.equal('Columns');
    expect(
      el.shadowRoot.querySelector('.select').classList.contains('placeholder-visible'),
    ).to.equal(true);
    cleanup(prefix);
  });

  it('lists one row per column', async () => {
    const prefix = nextPrefix();
    const el = await settingsFixture(prefix);
    el.open = true;
    await el.updateComplete;
    // the rows render in the update that opens the dropdown
    expect(el.shadowRoot.querySelectorAll('.row').length).to.equal(2);
    expect(el.data.map(column => column.field)).to.deep.equal(['a', 'b']);
    cleanup(prefix);
  });

  it('shows the drag grips until a search filters the columns', async () => {
    const prefix = nextPrefix();
    const el = await settingsFixture(prefix);
    el.open = true;
    await el.updateComplete;
    const hiddenGrips = () => el.shadowRoot.querySelectorAll('.row .grip[hidden]').length;
    expect(hiddenGrips()).to.equal(0);

    el.search.value = 'b';
    el.search.dispatchEvent(new Event('input'));
    await el.updateComplete;
    expect(el.shadowRoot.querySelectorAll('.row').length).to.equal(1);
    expect(hiddenGrips()).to.equal(1);
    cleanup(prefix);
  });

  it('cycles the visibility, persists it, and fires change', async () => {
    const prefix = nextPrefix();
    const el = await settingsFixture(prefix);
    let changes = 0;
    el.addEventListener('change', () => {
      changes += 1;
    });
    const checkbox = document.createElement('input');

    el.cycleVisibility(el.data[0], checkbox);
    expect(el.overrides.visibility.a).to.equal('ifFiltered');
    expect(checkbox.indeterminate).to.equal(true);
    expect(JSON.parse(localStorage.getItem(`${prefix}-override-settings`)).visibility.a).to.equal(
      'ifFiltered',
    );

    el.cycleVisibility(el.data[0], checkbox);
    expect(el.overrides.visibility.a).to.equal('never');
    expect(checkbox.checked).to.equal(false);

    el.cycleVisibility(el.data[0], checkbox);
    expect(el.overrides.visibility.a).to.equal('always');
    expect(changes).to.equal(3);
    cleanup(prefix);
  });

  it('reset clears overrides, storage, and the URL', async () => {
    const prefix = nextPrefix();
    const el = await settingsFixture(prefix);
    el.cycleVisibility(el.data[0], document.createElement('input'));
    expect(localStorage.getItem(`${prefix}-override-settings`)).to.not.equal(null);

    el.reset();
    expect(el.overrides).to.deep.equal({ visibility: {} });
    expect(localStorage.getItem(`${prefix}-override-settings`)).to.equal(null);
    expect(new URL(location.href).searchParams.get(`${prefix}-overrides`)).to.equal(null);
    cleanup(prefix);
  });

  it('recovers from a legacy array in localStorage (regression)', async () => {
    const prefix = nextPrefix();
    localStorage.setItem(`${prefix}-override-settings`, '[]');
    const el = await settingsFixture(prefix);
    expect(el.getOverridesFromLocalStorage()).to.deep.equal({ visibility: {} });
    expect(localStorage.getItem(`${prefix}-override-settings`)).to.equal('{"visibility":{}}');
    cleanup(prefix);
  });

  it('applies overrides from the URL, local ones winning per column', async () => {
    const prefix = nextPrefix();
    localStorage.setItem(
      `${prefix}-override-settings`,
      JSON.stringify({ visibility: { a: 'never' } }),
    );
    const url = new URL(location.href);
    url.searchParams.set(
      `${prefix}-overrides`,
      JSON.stringify({ visibility: { a: 'always', b: 'ifFiltered' } }),
    );
    history.replaceState({}, '', url);

    const el = await settingsFixture(prefix);
    expect(el.overrides.visibility).to.deep.equal({ a: 'never', b: 'ifFiltered' });
    cleanup(prefix);
  });
});

const reorderColumns = [
  { field: 'a', label: 'A', visible: 'always' },
  { field: 'b', label: 'B', visible: 'always' },
  { field: 'c', label: 'C', visible: 'always' },
  { field: 'd', label: 'D', visible: 'always' },
];

describe('owc-table-settings column reordering', () => {
  /** @type {string} */
  let prefix;

  beforeEach(() => {
    prefix = nextPrefix();
  });

  afterEach(() => {
    cleanup(prefix);
    // a table also keeps its open action tab in the URL
    const url = new URL(location.href);
    url.searchParams.delete(`${prefix}-action-tab-active`);
    history.replaceState({}, '', url);
  });

  /**
   * An open settings dropdown, with four columns unless told otherwise.
   * Opening focuses the search field after a moment; waiting for that keeps
   * it from stealing the focus later.
   *
   * @param {{ columns?: object[], lang?: string }} [options]
   */
  async function openSettings({ columns: ofColumns = reorderColumns, lang = 'en' } = {}) {
    const el = await fixture(
      html`<owc-table-settings
        lang=${lang}
        .columns=${ofColumns}
        .storeNamePrefix=${prefix}
      ></owc-table-settings>`,
    );
    el.open = true;
    await el.updateComplete;
    await waitUntil(() => el.shadowRoot.activeElement === el.search, 'the search gets focus');
    return el;
  }

  /** @param {Element} el */
  const grips = el => [...el.shadowRoot.querySelectorAll('.row button.grip')];

  /**
   * The column labels in the order the list shows them.
   *
   * @param {Element} el
   */
  const shownOrder = el =>
    [...el.shadowRoot.querySelectorAll('.row > span')].map(label => label.textContent);

  /**
   * Resolves once focus is on the grip button of a column.
   *
   * @param {Element} el
   * @param {string} label the column's label
   */
  const focusOnGrip = (el, label) =>
    waitUntil(
      () => el.shadowRoot.activeElement?.getAttribute('aria-label') === `Move column: ${label}`,
      `focus is on the grip of ${label}`,
    );

  it('names each grip button after its column', async () => {
    const el = await openSettings();
    expect(grips(el).map(grip => grip.getAttribute('aria-label'))).to.deep.equal([
      'Move column: A',
      'Move column: B',
      'Move column: C',
      'Move column: D',
    ]);
  });

  it('reaches the grip buttons with Tab, and the dropdown stays open', async () => {
    const el = await openSettings();
    await sendKeys({ press: 'Tab' });
    expect(el.open).to.equal(true);
    expect(el.shadowRoot.activeElement === grips(el)[0]).to.equal(true);
  });

  it('shows the theme focus ring on a grip focused by keyboard', async () => {
    const el = await openSettings();
    // the tokens come from the Web Awesome theme, which no test loads
    el.style.setProperty('--wa-focus-ring', 'solid 3px rgb(255, 0, 0)');
    el.style.setProperty('--wa-focus-ring-offset', '1px');
    await sendKeys({ press: 'Tab' });
    await focusOnGrip(el, 'A');

    const { outlineStyle, outlineWidth, outlineColor, outlineOffset } = getComputedStyle(
      grips(el)[0],
    );
    expect({ outlineStyle, outlineWidth, outlineColor, outlineOffset }).to.deep.equal({
      outlineStyle: 'solid',
      outlineWidth: '3px',
      outlineColor: 'rgb(255, 0, 0)',
      outlineOffset: '1px',
    });
  });

  it('moves the focused column with Alt+ArrowDown and Alt+ArrowUp and keeps focus on it', async () => {
    const el = await openSettings();
    await sendKeys({ press: 'Tab' });
    await focusOnGrip(el, 'A');

    await sendKeys({ press: 'Alt+ArrowDown' });
    await focusOnGrip(el, 'A');
    expect(shownOrder(el)).to.deep.equal(['B', 'A', 'C', 'D']);

    await sendKeys({ press: 'Alt+ArrowDown' });
    await focusOnGrip(el, 'A');
    expect(shownOrder(el)).to.deep.equal(['B', 'C', 'A', 'D']);

    await sendKeys({ press: 'Alt+ArrowUp' });
    await focusOnGrip(el, 'A');
    expect(shownOrder(el)).to.deep.equal(['B', 'A', 'C', 'D']);
    expect(el.open).to.equal(true);
  });

  /**
   * What a saved order leaves behind, for the table (`overrides`), in local
   * storage and in the URL.
   *
   * @param {Element} el
   */
  const savedOrders = el => ({
    overrides: el.overrides.order,
    localStorage: JSON.parse(localStorage.getItem(`${prefix}-override-settings`) ?? '{}').order,
    url: JSON.parse(new URL(location.href).searchParams.get(`${prefix}-overrides`) ?? '{}').order,
  });

  it('saves an order changed by keyboard for the table, in local storage and in the URL', async () => {
    const el = await openSettings();
    let changes = 0;
    el.addEventListener('change', () => {
      changes += 1;
    });
    await sendKeys({ press: 'Tab' });
    await sendKeys({ press: 'Alt+ArrowDown' });
    await focusOnGrip(el, 'A');

    const order = ['b', 'a', 'c', 'd'];
    expect(savedOrders(el)).to.deep.equal({ overrides: order, localStorage: order, url: order });
    expect(changes).to.equal(1);
  });

  it('still reorders by dragging a grip, and saves that order the same way', async () => {
    const el = await openSettings();
    let changes = 0;
    el.addEventListener('change', () => {
      changes += 1;
    });
    const grip = grips(el)[0].getBoundingClientRect();
    const target = el.shadowRoot.querySelectorAll('.row')[2].getBoundingClientRect();
    const gripCenter = [Math.round(grip.x + grip.width / 2), Math.round(grip.y + grip.height / 2)];

    await sendMouse({ type: 'move', position: gripCenter });
    await sendMouse({ type: 'down' });
    // an item is only draggable while the pointer is over its grip, so the drag starts there
    await sendMouse({ type: 'move', position: [gripCenter[0] + 8, gripCenter[1]] });
    // the lower half of the third item's own padding: the dragged item goes after it
    const dropPoint = [Math.round(target.x + 3), Math.round(target.bottom - 3)];
    await sendMouse({ type: 'move', position: [dropPoint[0], dropPoint[1] - 2] });
    await sendMouse({ type: 'move', position: dropPoint });
    await sendMouse({ type: 'up' });
    await resetMouse();
    await waitUntil(() => changes > 0, 'the drag saves an order');
    await el.updateComplete;

    const order = ['b', 'c', 'a', 'd'];
    expect(shownOrder(el)).to.deep.equal(['B', 'C', 'A', 'D']);
    // the drag is no click on the grip: no move menu opened
    expect(el.shadowRoot.querySelector('wa-dropdown[open]')).to.equal(null);
    expect(savedOrders(el)).to.deep.equal({ overrides: order, localStorage: order, url: order });
    expect(changes).to.equal(1);
  });

  /**
   * The items of the move menu of a column.
   *
   * @param {Element} el
   * @param {string} label the column's label
   */
  const menuItems = (el, label) => [
    ...el.shadowRoot
      .querySelector(`.grip[aria-label="Move column: ${label}"]`)
      .closest('wa-dropdown')
      .querySelectorAll('wa-dropdown-item'),
  ];

  /**
   * Resolves once focus is on an item of a move menu.
   *
   * @param {Element} el
   * @param {string} text the item's text
   */
  const focusOnMenuItem = (el, text) =>
    waitUntil(() => {
      const active = el.shadowRoot.activeElement;
      return active?.localName === 'wa-dropdown-item' && active.textContent.trim() === text;
    }, `focus is on the menu item ${text}`);

  it('opens a menu with the four moves when the grip is activated by keyboard', async () => {
    const el = await openSettings();
    await sendKeys({ press: 'Tab' });
    await sendKeys({ press: 'Tab' });
    await sendKeys({ press: 'Tab' });
    await focusOnGrip(el, 'B');
    expect(el.shadowRoot.activeElement.getAttribute('aria-haspopup')).to.equal('menu');
    expect(el.shadowRoot.activeElement.getAttribute('aria-expanded')).to.equal('false');

    await sendKeys({ press: 'Enter' });
    await focusOnMenuItem(el, 'Move up');
    expect(menuItems(el, 'B').map(item => item.textContent.trim())).to.deep.equal([
      'Move up',
      'Move down',
      'Move to top',
      'Move to bottom',
    ]);
    expect(grips(el)[1].getAttribute('aria-expanded')).to.equal('true');
    expect(el.open).to.equal(true);
  });

  /**
   * Tabs from the search field to the grip of a column and opens its menu.
   *
   * @param {Element} el
   * @param {string} label the column's label
   */
  async function openMenuByKeyboard(el, label) {
    const index = shownOrder(el).indexOf(label);
    // every item before it has two Tab stops: its grip and its checkbox
    for (let stop = 0; stop <= index * 2; stop += 1) {
      await sendKeys({ press: 'Tab' });
    }
    await focusOnGrip(el, label);
    await sendKeys({ press: 'Enter' });
    await waitUntil(
      () => el.shadowRoot.activeElement?.localName === 'wa-dropdown-item',
      'the menu opens and takes the focus',
    );
  }

  it('moves a column from its menu by keyboard, saves the order and returns focus to its grip', async () => {
    const el = await openSettings();
    await openMenuByKeyboard(el, 'B');
    await focusOnMenuItem(el, 'Move up');
    await sendKeys({ press: 'ArrowDown' });
    await sendKeys({ press: 'ArrowDown' });
    await sendKeys({ press: 'ArrowDown' });
    await focusOnMenuItem(el, 'Move to bottom');

    await sendKeys({ press: 'Enter' });
    await focusOnGrip(el, 'B');
    expect(shownOrder(el)).to.deep.equal(['A', 'C', 'D', 'B']);
    const order = ['a', 'c', 'd', 'b'];
    expect(savedOrders(el)).to.deep.equal({ overrides: order, localStorage: order, url: order });
    expect(el.open).to.equal(true);
  });

  /**
   * A real click in the middle of an element.
   *
   * @param {Element} target
   */
  async function clickOn(target) {
    const rect = target.getBoundingClientRect();
    await sendMouse({
      type: 'click',
      position: [Math.round(rect.x + rect.width / 2), Math.round(rect.y + rect.height / 2)],
    });
  }

  it('moves a column with one click on its grip and one on a menu item, leaving its visibility alone', async () => {
    const el = await openSettings();
    let changes = 0;
    el.addEventListener('change', () => {
      changes += 1;
    });

    await clickOn(grips(el)[2]);
    await focusOnMenuItem(el, 'Move up');
    await clickOn(menuItems(el, 'C')[0]);
    await resetMouse();
    await focusOnGrip(el, 'C');

    expect(shownOrder(el)).to.deep.equal(['A', 'C', 'B', 'D']);
    expect(el.overrides.visibility).to.deep.equal({});
    expect(changes).to.equal(1);
    expect(el.open).to.equal(true);
  });

  /**
   * The texts of the disabled items of a column's move menu.
   *
   * @param {Element} el
   * @param {string} label the column's label
   */
  const disabledMoves = (el, label) =>
    menuItems(el, label)
      .filter(item => item.getAttribute('aria-disabled') === 'true')
      .map(item => item.textContent.trim());

  it('disables the moves the first and the last column cannot make', async () => {
    const el = await openSettings();
    await Promise.all(menuItems(el, 'D').map(item => item.updateComplete));

    expect(disabledMoves(el, 'A')).to.deep.equal(['Move up', 'Move to top']);
    expect(disabledMoves(el, 'B')).to.deep.equal([]);
    expect(disabledMoves(el, 'C')).to.deep.equal([]);
    expect(disabledMoves(el, 'D')).to.deep.equal(['Move down', 'Move to bottom']);
  });

  it('skips the disabled moves when the menu of the first column opens', async () => {
    const el = await openSettings();
    await openMenuByKeyboard(el, 'A');
    await focusOnMenuItem(el, 'Move down');
  });

  it('closes only the menu on Escape, and the dropdown on the next Escape', async () => {
    const el = await openSettings();
    await openMenuByKeyboard(el, 'B');

    await sendKeys({ press: 'Escape' });
    await focusOnGrip(el, 'B');
    expect(grips(el)[1].getAttribute('aria-expanded')).to.equal('false');
    expect(el.open).to.equal(true);

    await sendKeys({ press: 'Escape' });
    expect(el.open).to.equal(false);
  });

  it("keeps the menu's events to itself: none looks like an event of the settings dropdown", async () => {
    const el = await openSettings();
    const leaked = [];
    for (const type of ['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide', 'wa-select']) {
      el.addEventListener(type, () => leaked.push(type));
    }
    const menu = grips(el)[1].closest('wa-dropdown');

    const shown = oneEvent(menu, 'wa-after-show');
    await openMenuByKeyboard(el, 'B');
    await shown;
    const hidden = oneEvent(menu, 'wa-after-hide');
    await sendKeys({ press: 'Escape' });
    await hidden;

    // focus is back on the grip: open the menu again and choose its first item
    await sendKeys({ press: 'Enter' });
    await focusOnMenuItem(el, 'Move up');
    await sendKeys({ press: 'Enter' });
    await focusOnGrip(el, 'B');
    expect(shownOrder(el)).to.deep.equal(['B', 'A', 'C', 'D']);

    expect(leaked).to.deep.equal([]);
  });

  it('leaves the order alone when Alt+ArrowUp is pressed on the first column or Alt+ArrowDown on the last', async () => {
    const el = await openSettings();
    let changes = 0;
    el.addEventListener('change', () => {
      changes += 1;
    });

    await sendKeys({ press: 'Tab' });
    await focusOnGrip(el, 'A');
    await sendKeys({ press: 'Alt+ArrowUp' });
    await el.updateComplete;
    expect(shownOrder(el)).to.deep.equal(['A', 'B', 'C', 'D']);
    await focusOnGrip(el, 'A');

    grips(el)[3].focus();
    await sendKeys({ press: 'Alt+ArrowDown' });
    await el.updateComplete;
    expect(shownOrder(el)).to.deep.equal(['A', 'B', 'C', 'D']);
    await focusOnGrip(el, 'D');
    expect(changes).to.equal(0);
    expect(savedOrders(el)).to.deep.equal({
      overrides: undefined,
      localStorage: undefined,
      url: undefined,
    });
  });

  it('moves the column with Alt+ArrowDown from its checkbox too, and keeps focus on the checkbox', async () => {
    const el = await openSettings();
    await sendKeys({ press: 'Tab' });
    await sendKeys({ press: 'Tab' });
    const checkboxOf = index =>
      el.shadowRoot.querySelectorAll('.row')[index].querySelector('wa-checkbox');
    expect(el.shadowRoot.activeElement === checkboxOf(0)).to.equal(true);

    await sendKeys({ press: 'Alt+ArrowDown' });
    await waitUntil(
      () => el.shadowRoot.activeElement === checkboxOf(1),
      'focus is on the checkbox of the moved column',
    );
    expect(shownOrder(el)).to.deep.equal(['B', 'A', 'C', 'D']);
  });

  it('cycles the visibility with Space on the checkbox that Tab now reaches', async () => {
    const el = await openSettings();
    await sendKeys({ press: 'Tab' });
    await sendKeys({ press: 'Tab' });
    expect(el.shadowRoot.activeElement?.localName).to.equal('wa-checkbox');

    await sendKeys({ press: 'Space' });
    expect(el.overrides.visibility).to.deep.equal({ a: 'ifFiltered' });
    expect(el.shadowRoot.activeElement.indeterminate).to.equal(true);
    await sendKeys({ press: 'Space' });
    expect(el.overrides.visibility).to.deep.equal({ a: 'never' });
    expect(el.shadowRoot.activeElement.checked).to.equal(false);
    expect(el.open).to.equal(true);
  });

  it('does not reorder while a search filters the list', async () => {
    const el = await openSettings();
    let changes = 0;
    el.addEventListener('change', () => {
      changes += 1;
    });
    await sendKeys({ type: 'b' });
    await el.updateComplete;
    expect(shownOrder(el)).to.deep.equal(['B']);

    // the grip is hidden, so the next Tab stop is the checkbox of the only item left
    await sendKeys({ press: 'Tab' });
    expect(el.shadowRoot.activeElement?.localName).to.equal('wa-checkbox');
    await sendKeys({ press: 'Alt+ArrowDown' });
    await sendKeys({ press: 'Alt+ArrowUp' });
    await el.updateComplete;

    expect(el.data.map(column => column.field)).to.deep.equal(['a', 'b', 'c', 'd']);
    expect(changes).to.equal(0);
  });

  it('closes the dropdown once Tab moves the focus out of it', async () => {
    const container = await fixture(
      html`<div>
        <owc-table-settings
          .columns=${reorderColumns}
          .storeNamePrefix=${prefix}
        ></owc-table-settings>
        <button id="after">after</button>
      </div>`,
    );
    const el = container.querySelector('owc-table-settings');
    el.open = true;
    await el.updateComplete;
    await waitUntil(() => el.shadowRoot.activeElement === el.search, 'the search gets focus');

    const stops = [];
    while (document.activeElement.id !== 'after' && stops.length < 20) {
      await sendKeys({ press: 'Tab' });
      const active = el.shadowRoot.activeElement;
      stops.push(active ? active.getAttribute('aria-label') || active.localName : 'outside');
    }

    expect(stops).to.deep.equal([
      'Move column: A',
      'wa-checkbox',
      'Move column: B',
      'wa-checkbox',
      'Move column: C',
      'wa-checkbox',
      'Move column: D',
      'wa-checkbox',
      'wa-button',
      'wa-button',
      'outside',
    ]);
    expect(el.open).to.equal(false);
  });

  it('keeps a moved column in view in a list that scrolls', async () => {
    const many = Array.from({ length: 40 }, (_, index) => ({
      field: `f${index}`,
      label: `Column ${index}`,
      visible: 'always',
    }));
    const el = await openSettings({ columns: many });
    const list = el.shadowRoot.querySelector('#rows');
    await waitUntil(() => list.scrollHeight > list.clientHeight, 'the list scrolls');

    grips(el)[30].focus();
    await focusOnGrip(el, 'Column 30');
    expect(list.scrollTop).to.be.greaterThan(0);

    await sendKeys({ press: 'Alt+ArrowDown' });
    await focusOnGrip(el, 'Column 30');
    // a frame for a scroll that an update after the move would cause
    await nextFrame();
    await nextFrame();

    expect(shownOrder(el).slice(29, 33)).to.deep.equal([
      'Column 29',
      'Column 31',
      'Column 30',
      'Column 32',
    ]);
    const shown = list.getBoundingClientRect();
    const grip = el.shadowRoot.activeElement.getBoundingClientRect();
    expect(grip.top >= shown.top && grip.bottom <= shown.bottom).to.equal(true);
  });

  for (const [move, position] of [
    ['Move to bottom', 319],
    ['Move to top', 0],
  ]) {
    it(`brings in and focuses a column that "${move}" moves out of the rendered part of a virtualized list`, async () => {
      const many = Array.from({ length: 320 }, (_, index) => ({
        field: `f${index}`,
        label: `Column ${index}`,
        visible: 'always',
      }));
      const el = await openSettings({ columns: many });
      const list = el.shadowRoot.querySelector('#rows');
      await waitUntil(() => list.scrollHeight > list.clientHeight, 'the list scrolls');
      const start = move === 'Move to top' ? 300 : 3;
      if (move === 'Move to top') {
        list.scrollTop = list.scrollHeight;
        await waitUntil(
          () => el.shadowRoot.querySelector(`#rows > [data-index="${start}"]`),
          'the column is rendered',
        );
      }
      el.shadowRoot.querySelector(`#rows > [data-index="${start}"] button.grip`).focus();
      await focusOnGrip(el, `Column ${start}`);
      await sendKeys({ press: 'Enter' });
      await focusOnMenuItem(el, 'Move up');
      const steps = move === 'Move to top' ? 2 : 3;
      for (let step = 0; step < steps; step += 1) {
        await sendKeys({ press: 'ArrowDown' });
      }
      await focusOnMenuItem(el, move);
      await sendKeys({ press: 'Enter' });
      await focusOnGrip(el, `Column ${start}`);
      const row = el.shadowRoot.activeElement.closest('.row');
      expect(row.dataset.index).to.equal(String(position));
      const shown = list.getBoundingClientRect();
      const grip = el.shadowRoot.activeElement.getBoundingClientRect();
      expect(grip.top >= shown.top && grip.bottom <= shown.bottom).to.equal(true);
    });
  }

  it('names the search field, and each visibility checkbox by its column and what Space made of it', async () => {
    const el = await openSettings();
    const search = el.search.shadowRoot.querySelector('label');
    expect(search.textContent.trim()).to.equal('Search');
    expect(search.getBoundingClientRect().width).to.be.at.most(1);
    const checkbox = () => el.shadowRoot.querySelector('.row[data-index="0"] wa-checkbox');
    expect(checkbox().textContent.trim()).to.equal('A: Show always');
    expect(
      checkbox().shadowRoot.querySelector('[part~="label"]').getBoundingClientRect().width,
    ).to.be.at.most(1);
    checkbox().focus();
    await sendKeys({ press: 'Space' });
    await el.updateComplete;
    expect(checkbox().textContent.trim()).to.equal('A: Show when filtered');
    await sendKeys({ press: 'Space' });
    await el.updateComplete;
    expect(checkbox().textContent.trim()).to.equal('A: Show never');
  });

  it('names the grip and the moves in German', async () => {
    const el = await openSettings({ lang: 'de' });
    expect(grips(el)[0].getAttribute('aria-label')).to.equal('Spalte verschieben: A');
    expect(
      [...grips(el)[0].closest('wa-dropdown').querySelectorAll('wa-dropdown-item')].map(item =>
        item.textContent.trim(),
      ),
    ).to.deep.equal(['Nach oben', 'Nach unten', 'An den Anfang', 'Ans Ende']);
  });

  it('reorders the columns of the table it belongs to', async () => {
    const table = await fixture(
      html`<owc-table
        store-name-prefix=${prefix}
        action-tab-active="settings"
        .actionTabs=${{ settings: { visible: true } }}
        .columns=${reorderColumns}
        .data=${[{ id: 1, a: 1, b: 2, c: 3, d: 4 }]}
      ></owc-table>`,
    );
    const headers = () =>
      [...table.shadowRoot.querySelectorAll('#data-table owc-table-header-cell')].map(cell =>
        cell.textContent.trim(),
      );
    const settings = () =>
      table.shadowRoot
        .querySelector('owc-table-info')
        ?.shadowRoot.querySelector('owc-tabs')
        ?.shadowRoot.querySelector('owc-table-settings');
    await waitUntil(settings, 'the settings tab renders');
    const el = settings();
    await el.updateComplete;
    expect(headers()).to.deep.equal(['A', 'B', 'C', 'D']);

    // opening focuses the search field after a moment, as in openSettings()
    el.open = true;
    await el.updateComplete;
    await waitUntil(() => el.shadowRoot.activeElement === el.search, 'the search gets focus');
    await sendKeys({ press: 'Tab' });
    await focusOnGrip(el, 'A');
    await sendKeys({ press: 'Alt+ArrowDown' });
    await focusOnGrip(el, 'A');
    await table.updateComplete;

    expect(headers()).to.deep.equal(['B', 'A', 'C', 'D']);
  });
});
