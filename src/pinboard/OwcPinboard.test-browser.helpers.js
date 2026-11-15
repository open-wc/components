/**
 * Helpers for the browser tests that drive a pinboard with the keyboard. The
 * name keeps the module out of the package and out of the test runs, see
 * `virtualList.test-browser.helpers.js`. A suite defines `owc-pinboard`
 * itself before it uses them.
 */
import { fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { deepActiveElement } from '../a11y/controls.js';
import { untilStable, visibleArea } from '../virtualizer/virtualList.test-browser.helpers.js';

/** @typedef {import('./OwcPinboard.js').OwcPinboard<Record<string, any>, any, any>} Pinboard */

/**
 * @typedef {object} BoardOptions
 * @property {object[]} [columns] three columns by default: Todo, Doing and Review
 * @property {object[][]} [data] 3, 2 and 4 cards by default
 * @property {object} [dropZones]
 * @property {object} [fieldMapper] shows a card's `title` by default
 * @property {(card: any) => string} [cardLabel]
 * @property {(card: any) => string | number} [getCardId]
 * @property {(card: any, column: string) => boolean} [canDrop]
 * @property {string} [lang]
 * @property {string} [boxStyle] styles of the element around the board, e.g. a scroll box
 */

/**
 * Cards like `{ id: 'todo-0', title: 'todo card 0' }`.
 *
 * @param {string} prefix
 * @param {number} count
 */
export function cards(prefix, count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    title: `${prefix} card ${index}`,
  }));
}

export const columns = [
  { label: 'Todo', value: 'todo' },
  { label: 'Doing', value: 'doing' },
  { label: 'Review', value: 'review' },
];

/**
 * Renders a board between two buttons, so tests can Tab into it and out of it.
 *
 * @param {BoardOptions} [options]
 */
export async function boardFixture({
  columns: boardColumns = columns,
  data = [cards('todo', 3), cards('doing', 2), cards('review', 4)],
  dropZones = {},
  fieldMapper = { body: (/** @type {any} */ card) => card.title },
  cardLabel,
  getCardId,
  canDrop = () => true,
  lang,
  boxStyle = '',
} = {}) {
  const wrapper = await fixture(html`
    <div>
      <button id="before">before</button>
      <div id="box" style=${boxStyle}>
        <owc-pinboard
          lang=${lang ?? 'en'}
          .columns=${boardColumns}
          .data=${data}
          .fieldMapper=${fieldMapper}
          .dropZones=${dropZones}
          .cardLabel=${cardLabel}
          .getCardId=${getCardId}
          .canDrop=${canDrop}
        ></owc-pinboard>
      </div>
      <button id="after">after</button>
    </div>
  `);
  const el = /** @type {Pinboard} */ (wrapper.querySelector('owc-pinboard'));
  await el.updateComplete;
  return {
    el,
    box: /** @type {HTMLElement} */ (wrapper.querySelector('#box')),
    before: /** @type {HTMLElement} */ (wrapper.querySelector('#before')),
    after: /** @type {HTMLElement} */ (wrapper.querySelector('#after')),
  };
}

/** @param {Pinboard} el */
function rootOf(el) {
  return /** @type {ShadowRoot} */ (el.shadowRoot);
}

/**
 * The lists of cards of a board: one per column, then one per dropzone list.
 *
 * @param {Pinboard} el
 */
export function lists(el) {
  return /** @type {HTMLElement[]} */ ([...rootOf(el).querySelectorAll('[role="list"]')]);
}

/** @param {Element} list */
export function items(list) {
  return /** @type {HTMLElement[]} */ ([...list.querySelectorAll('[role="listitem"]')]);
}

/** @param {string} key e.g. `ArrowDown` or `Shift+Tab` */
export function press(key) {
  return sendKeys({ press: key });
}

/**
 * The button of a dropzone.
 *
 * @param {Pinboard} el
 * @param {'success' | 'delete'} name
 */
export function dropzone(el, name) {
  return /** @type {HTMLButtonElement} */ (rootOf(el).querySelector(`.dropzone.${name}`));
}

/**
 * Waits for the list of a dropzone to be open or closed, animation included.
 *
 * @param {Pinboard} el
 */
export function dropzoneSettled(el) {
  return untilStable(
    el,
    () =>
      [...rootOf(el).querySelectorAll('wa-details')]
        .map(details => /** @type {HTMLElement & { open: boolean }} */ (details).open)
        .join(),
    { animations: true },
  );
}

/**
 * What `focusAt` calls an element that isn't a card, a list or a dropzone.
 *
 * @param {Element | null} element
 */
function nameOf(element) {
  if (element?.getAttribute('aria-haspopup') === 'menu') {
    return 'menu button';
  }
  if (element?.getAttribute('role') === 'menuitem') {
    return `menu item ${element.textContent?.trim()}`;
  }
  return element?.id ? `#${element.id}` : element?.localName;
}

/**
 * Where the focus is: the list and the index of the focused card, like
 * `Todo:1`, followed by the focused element if that is something in the card,
 * like `Todo:1 button`. `list Todo` for the list itself, `dropzone Done` for a
 * dropzone, and the element outside the board, like `#after` or `body`. The
 * Move to… button of a card is `Todo:1 menu button`, and an item of its menu
 * `Todo:1 menu item Doing`.
 *
 * @param {Pinboard} el
 */
export function focusAt(el) {
  const inBoard = rootOf(el).activeElement;
  const active = deepActiveElement();
  const name = nameOf(active);
  if (!inBoard) {
    return name;
  }
  if (inBoard.matches('[role="list"]')) {
    return `list ${inBoard.getAttribute('aria-label')}`;
  }
  if (inBoard.matches('.dropzone')) {
    return `dropzone ${inBoard.getAttribute('aria-label')}`;
  }
  const item = inBoard.closest('[role="listitem"]');
  if (!item) {
    return inBoard.localName;
  }
  const at = `${item.parentElement?.getAttribute('aria-label')}:${
    Number(item.getAttribute('aria-posinset')) - 1
  }`;
  return active === item ? at : `${at} ${name}`;
}

/**
 * Presses Tab, or Shift+Tab, from one button until the focus is on the other,
 * and tells where the focus was in between.
 *
 * @param {Pinboard} el
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

/**
 * Renders a board and moves the focus into it with Tab, as a user does.
 *
 * @param {BoardOptions} [options]
 */
export async function focusedBoard(options) {
  const board = await boardFixture(options);
  board.before.focus();
  await press('Tab');
  return board;
}

/**
 * Presses keys one after the other and tells where the focus was after each.
 *
 * @param {Pinboard} el
 * @param {string[]} keys
 */
export async function pressAll(el, keys) {
  const stops = [];
  for (const key of keys) {
    await press(key);
    await el.updateComplete;
    stops.push(focusAt(el));
  }
  return stops;
}

/**
 * Waits for the focus to arrive somewhere, e.g. on a card that a list has to
 * bring in first.
 *
 * @param {Pinboard} el
 * @param {string} at what `focusAt` says once it is there
 */
export async function focusArrivesAt(el, at) {
  try {
    await waitUntil(() => focusAt(el) === at, '', { timeout: 1500 });
  } catch {
    throw new Error(`The focus never arrived at ${at}; it is at ${focusAt(el)}`);
  }
}

/**
 * The card that has the focus, or that has something with the focus in it.
 *
 * @param {Pinboard} el
 */
export function focusedCard(el) {
  return /** @type {HTMLElement} */ (
    rootOf(el).activeElement?.closest('[role="listitem"]')?.querySelector('owc-card')
  );
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
  return rect.top >= top - 0.5 && rect.bottom <= visibleArea(scroller).bottom + 0.5;
}

/** @param {Pinboard} el */
export function liveRegion(el) {
  return /** @type {HTMLElement} */ (rootOf(el).querySelector('[aria-live="polite"]'));
}

/**
 * Waits for the live region to say something.
 *
 * @param {Pinboard} el
 * @param {string} message
 */
export async function announces(el, message) {
  try {
    await waitUntil(() => liveRegion(el).textContent === message, '', { timeout: 1000 });
  } catch {
    throw new Error(
      `Expected "${message}", but the live region says "${liveRegion(el).textContent}"`,
    );
  }
}
