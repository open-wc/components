/**
 * Helpers for the browser tests that drive a table with the keyboard and
 * the pointer, and run axe over it. The name keeps the module out of the
 * package and out of the test runs, see `virtualList.test-browser.helpers.js`.
 * Importing it defines `owc-table`, and the custom elements with shadow
 * trees that the suites put into cells.
 */
import { fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import { deepActiveElement } from '../a11y/controls.js';
import { untilStable, visibleArea } from '../virtualizer/virtualList.test-browser.helpers.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@open-wc/components/register/de.js';
import { OwcTable } from './OwcTable.js';

customElements.define('owc-table', OwcTable);

/**
 * The shadow root of a table, or of another element that has one.
 *
 * @param {Element} el
 */
function rootOf(el) {
  return /** @type {ShadowRoot} */ (el.shadowRoot);
}

/** @typedef {Record<string, any>} Row */

/**
 * @param {string} name
 * @param {string} shadowHtml
 */
export function defineShadowElement(name, shadowHtml) {
  customElements.define(
    name,
    class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = shadowHtml;
      }
    },
  );
}

/** @typedef {OwcTable<Record<string, unknown>>} Table */

export const columns = [
  { label: 'First Name', field: 'firstName' },
  { label: 'Age', field: 'age', formatter: 'number' },
  { label: 'City', field: 'city' },
];

export const data = [
  { id: '1', firstName: 'Robert', age: 34, city: 'Vienna' },
  { id: '2', firstName: 'Sarah', age: 65, city: 'Graz' },
  { id: '3', firstName: 'Grace', age: 25, city: 'Linz' },
];

/** @param {number} count */
export function rows(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    firstName: `Person ${index}`,
    age: index,
    city: `City ${index}`,
  }));
}

/**
 * @param {import('lit').TemplateResult} template
 * @param {{ animations?: boolean }} [options] see `settle`
 * @returns {Promise<Table>}
 */
export async function tableFixture(template, options) {
  const wrapper = await fixture(html`<div>${template}</div>`);
  const el = /** @type {Table} */ (wrapper.querySelector('owc-table'));
  await settle(el, options);
  return el;
}

/**
 * Waits until the rendered rows stay the same for a few frames.
 *
 * @param {Table} el
 * @param {{ animations?: boolean }} [options] `animations`: also until the animations in the table are done, like a detail that opens
 */
export function settle(el, options) {
  return untilStable(
    el,
    () =>
      bodyRows(el)
        .map(row => row.getAttribute('data-index'))
        .join(),
    options,
  );
}

/** @param {Table} el */
export function grid(el) {
  return /** @type {HTMLElement} */ (rootOf(el).querySelector('#data-table'));
}

/** @param {Table} el */
export function headerRow(el) {
  return /** @type {HTMLElement} */ (rootOf(el).querySelector('.table-header > .row'));
}

/** @param {Table} el */
export function bodyRows(el) {
  return /** @type {HTMLElement[]} */ ([
    ...rootOf(el).querySelectorAll('#virtualize-container > .row-container > .row'),
  ]);
}

/** @param {Element} row */
export function cellsOf(row) {
  return /** @type {HTMLElement[]} */ ([...row.querySelectorAll(':scope > .cell')]);
}

/** @param {Table} el */
export function rowIndices(el) {
  return bodyRows(el).map(row => Number(row.getAttribute('aria-rowindex')));
}

defineShadowElement('test-shadow-button', '<button>inner</button>');

/**
 * Renders a table between two buttons, so tests can Tab into it and out of it.
 *
 * @param {import('lit').TemplateResult} template
 */
export async function betweenButtons(template) {
  const wrapper = await fixture(html`
    <div>
      <button id="before">before</button>
      ${template}
      <button id="after">after</button>
    </div>
  `);
  const el = /** @type {Table} */ (wrapper.querySelector('owc-table'));
  await settle(el);
  return {
    el,
    before: /** @type {HTMLElement} */ (wrapper.querySelector('#before')),
    after: /** @type {HTMLElement} */ (wrapper.querySelector('#after')),
  };
}

/**
 * Renders a table and moves the focus into it with Tab, as a user does.
 *
 * @param {import('lit').TemplateResult} template
 */
export async function focusedTable(template) {
  const { el, before } = await betweenButtons(template);
  before.focus();
  await press('Tab');
  return el;
}

/** @param {string} key e.g. `ArrowDown`, `Control+End` or `Shift+Tab` */
export function press(key) {
  return sendKeys({ press: key });
}

/**
 * The cell of the grid that has the focus or holds it.
 *
 * @param {Table} el
 */
export function focusedCell(el) {
  let element = rootOf(el).activeElement;
  while (element && !element.matches('[role="gridcell"], [role="columnheader"]')) {
    element = element.parentElement;
  }
  return /** @type {HTMLElement | undefined} */ (element ?? undefined);
}

/**
 * Where the focus is: the row (`header`, `empty`, or the row's index in the
 * list) and the column of the focused cell, like `header:1` or `3:0`. The one
 * cell of a group header is `0:group`, and the one of the open detail of the
 * row at index 3 is `3:detail`. Outside the grid's cells it is the focused
 * element, like `#after` or `body`.
 *
 * @param {Table} el
 */
export function focusAt(el) {
  const cell = focusedCell(el);
  if (!cell) {
    const active = deepActiveElement();
    return active?.id ? `#${active.id}` : active?.localName;
  }
  const row = /** @type {HTMLElement} */ (cell.parentElement);
  if (row.id === 'empty-message-wrapper') {
    return 'empty';
  }
  if (row.classList.contains('group-label-container')) {
    return `${row.dataset.index}:group`;
  }
  if (row.classList.contains('detail-row')) {
    return `${/** @type {HTMLElement} */ (row.previousElementSibling).dataset.index}:detail`;
  }
  const name = /** @type {HTMLElement} */ (row.parentElement).classList.contains('table-header')
    ? 'header'
    : row.dataset.index;
  return `${name}:${cellsOf(row).indexOf(cell)}`;
}

/**
 * Whether a cell itself has the focus, not something inside it.
 *
 * @param {Table} el
 */
export function cellHasFocus(el) {
  return focusedCell(el) !== undefined && deepActiveElement() === focusedCell(el);
}

/**
 * Presses Tab, or Shift+Tab, from one button until the focus is on the other,
 * and tells where the focus was in between.
 *
 * @param {Table} el
 * @param {HTMLElement} from
 * @param {HTMLElement} to
 * @param {'Tab' | 'Shift+Tab'} key
 */
export async function tabStops(el, from, to, key = 'Tab') {
  from.focus();
  const stops = [];
  for (let presses = 0; presses < 30; presses++) {
    await press(key);
    await nextFrame();
    if (document.activeElement === to) {
      return stops;
    }
    stops.push(focusAt(el));
  }
  throw new Error(`${key} never reached #${to.id}; it stopped at ${stops.join(', ')}`);
}

/** @param {Table} el */
export function liveRegion(el) {
  return /** @type {HTMLElement} */ (rootOf(el).querySelector('[aria-live="polite"]'));
}

/**
 * Whether an element is fully inside the visible part of a scroll container.
 *
 * @param {Element} element
 * @param {Element} scroller
 * @param {number} [top] where the visible part starts, e.g. below a sticky header
 */
export function isInView(element, scroller, top = visibleArea(scroller).top) {
  const rect = element.getBoundingClientRect();
  const area = visibleArea(scroller);
  const sides =
    scroller === document.scrollingElement
      ? { left: 0, right: window.innerWidth }
      : scroller.getBoundingClientRect();
  return (
    rect.top >= top - 0.5 &&
    rect.bottom <= area.bottom + 0.5 &&
    rect.left >= sides.left - 0.5 &&
    rect.right <= sides.right + 0.5
  );
}

export const editableColumns = [
  { label: 'First Name', field: 'firstName', type: 'editable' },
  { label: 'Age', field: 'age', formatter: 'number' },
  { label: 'City', field: 'city' },
];

/** A table with every kind of control the table itself renders into cells. */
export const fullTable = html`<owc-table
  selectable
  render-mode="linkWithDetail"
  .columns=${editableColumns}
  .data=${data}
  .insertData=${[{ id: '', firstName: '', age: 0, city: '' }]}
  .getRowLinkSettings=${(/** @type {Row} */ row) => ({ href: `#row-${row.id}`, 'aria-label': `Open ${row.firstName}` })}
  .renderDetail=${() => html`<p>Detail</p>`}
></owc-table>`;

export const twoButtons = {
  label: 'Actions',
  field: 'actions',
  formatter: (/** @type {Row} */ row) =>
    html`<button class="edit">Edit ${row.firstName}</button
      ><button class="delete">Delete ${row.firstName}</button>`,
};

export const textInput = {
  label: 'Note',
  field: 'note',
  formatter: () => html`<input class="note" />`,
};

export const shadowButton = {
  label: 'Custom',
  field: 'custom',
  formatter: () => html`<test-shadow-button></test-shadow-button>`,
};

/**
 * What scrolls a large table: the document, or a box around the table.
 *
 * @type {Record<string, (table: import('lit').TemplateResult) => Promise<{ el: Table, scroller: Element }>>}
 */
export const containers = {
  'the document': async table => {
    const { el } = await betweenButtons(table);
    return { el, scroller: /** @type {Element} */ (document.scrollingElement) };
  },
  'a scroll box': async table => {
    const wrapper = await fixture(html`
      <div>
        <button id="before">before</button>
        <div id="box" style="height: 300px; overflow: auto">${table}</div>
        <button id="after">after</button>
      </div>
    `);
    const el = /** @type {Table} */ (wrapper.querySelector('owc-table'));
    await settle(el);
    return { el, scroller: /** @type {Element} */ (wrapper.querySelector('#box')) };
  },
};

/**
 * Collects the rows of the `rowClick` events of a table.
 *
 * @param {Table} el
 */
export function rowClicks(el) {
  /** @type {unknown[]} */
  const clicked = [];
  el.addEventListener('rowClick', event => clicked.push(/** @type {any} */ (event).row));
  return clicked;
}

/**
 * Collects the activations of a table's row links, like `#row-1` or
 * `ctrl+shift+#row-1`, and keeps them from leaving the page.
 *
 * @param {Table} el
 */
export function linkActivations(el) {
  /** @type {string[]} */
  const activations = [];
  rootOf(el).addEventListener('click', event => {
    const link = event
      .composedPath()
      .find(target => target instanceof HTMLAnchorElement && target.matches('.row-click'));
    if (link) {
      event.preventDefault();
      const { ctrlKey, metaKey, shiftKey, altKey } = /** @type {MouseEvent} */ (event);
      activations.push(
        `${ctrlKey ? 'ctrl+' : ''}${metaKey ? 'meta+' : ''}${shiftKey ? 'shift+' : ''}${
          altKey ? 'alt+' : ''
        }${/** @type {Element} */ (link).getAttribute('href')}`,
      );
    }
  });
  return activations;
}

/**
 * Clicks the middle of an element with the mouse.
 *
 * @param {Element} element
 */
export function clickOn(element) {
  const rect = element.getBoundingClientRect();
  return sendMouse({
    type: 'click',
    position: [Math.round(rect.left + rect.width / 2), Math.round(rect.top + rect.height / 2)],
  });
}

/**
 * Clicks into the padding of a cell with the mouse, beside what the cell shows.
 *
 * @param {Element} cell
 */
export function clickBeside(cell) {
  const rect = cell.getBoundingClientRect();
  return sendMouse({
    type: 'click',
    position: [Math.round(rect.left + 4), Math.round(rect.top + 4)],
  });
}

/** @param {Element} row */
export function rowLink(row) {
  return /** @type {HTMLAnchorElement | null} */ (row.querySelector('a.row-click'));
}

export const linkTable = html`<owc-table
  render-mode="link"
  .columns=${columns}
  .data=${data}
  .getRowLinkSettings=${(/** @type {Row} */ row) => ({ href: `#row-${row.id}` })}
></owc-table>`;

export const people = [
  { id: '1', firstName: 'Robert', age: 34, city: 'Vienna' },
  { id: '2', firstName: 'Sarah', age: 65, city: 'Graz' },
  { id: '3', firstName: 'Grace', age: 25, city: 'Vienna' },
  { id: '4', firstName: 'Ada', age: 36, city: 'Linz' },
  { id: '5', firstName: 'Linus', age: 54, city: 'Helsinki' },
];

/**
 * The groups Vienna, Graz and Linz as new objects; Linus belongs to none of them.
 *
 * @param {string[]} [collapsed]
 */
export function cityGroups(collapsed = ['Graz']) {
  return ['Vienna', 'Graz', 'Linz'].map(key => ({
    key,
    label: key,
    active: !collapsed.includes(key),
  }));
}

/**
 * Vienna (Robert, Grace), Graz (collapsed), Linz (Ada), Others (Linus). The
 * table writes into its groups whether they are expanded, so every table gets
 * its own.
 */
export const groupedTable = () =>
  html`<owc-table
    .columns=${columns}
    .data=${people}
    .groupSelector=${(/** @type {Row} */ row) => row.city}
    .groupList=${cityGroups()}
    .othersGroupActive=${true}
  ></owc-table>`;

/** @param {Table} el */
export function groupRows(el) {
  return /** @type {HTMLElement[]} */ ([
    ...rootOf(el).querySelectorAll('#virtualize-container > .group-label-container'),
  ]);
}

/** @param {Element} groupRow */
export function groupButton(groupRow) {
  return /** @type {HTMLButtonElement} */ (groupRow.querySelector('button'));
}

/**
 * The rows of the body in the order the grid has them, each as the text of
 * its first cell, with `>` or `v` before a collapsed or expanded group.
 *
 * @param {Table} el
 */
export function bodyOutline(el) {
  return [...rootOf(el).querySelectorAll('.table-body [role="row"]')].map(row => {
    const button = row.classList.contains('group-label-container') ? groupButton(row) : undefined;
    if (button) {
      return `${button.getAttribute('aria-expanded') === 'true' ? 'v' : '>'} ${button.getAttribute('aria-label')}`;
    }
    return /** @type {Element} */ (row.querySelector('[role="gridcell"]')).textContent?.trim();
  });
}

/**
 * Three people, each with a detail that has a button, which closes it.
 *
 * @param {string} renderMode
 * @param {string[]} [openDetails]
 */
export const detailTable = (renderMode, openDetails = []) =>
  html`<owc-table
    render-mode=${renderMode}
    .columns=${columns}
    .data=${data}
    .getRowLinkSettings=${(/** @type {Row} */ row) => ({ href: `#row-${row.id}` })}
    .renderDetail=${(
      /** @type {Row} */ row,
      /** @type {{ closeDetail: () => void }} */ { closeDetail },
    ) =>
      html`<p class="detail-text">About ${row.firstName}</p>
        <button class="close-detail" @click=${closeDetail}>Close</button>
        <input class="detail-note" />`}
    .openDetails=${openDetails}
  ></owc-table>`;

/**
 * The detail row after the Data Row at an index of the list.
 *
 * @param {Table} el
 * @param {number} index
 */
export function detailRowOf(el, index) {
  return /** @type {HTMLElement} */ (
    /** @type {Element} */ (rootOf(el).querySelector(`.row[data-index="${index}"]`))
      .nextElementSibling
  );
}
