import { aTimeout, expect, html, waitUntil } from '@open-wc/testing';
import { resetMouse, sendMouse } from '@web/test-runner-commands';
import '@open-wc/components/register/de.js';
import { OwcPinboard } from './OwcPinboard.js';
import { deepActiveElement } from '../a11y/controls.js';
import { scrollTo, untilStable } from '../virtualizer/virtualList.test-browser.helpers.js';
import {
  announces,
  boardFixture,
  cards,
  columns,
  dropzone,
  dropzoneSettled,
  focusArrivesAt,
  focusAt,
  focusedBoard,
  focusedCard,
  isInView,
  items,
  lists,
  liveRegion,
  press,
  pressAll,
  tabStops,
} from './OwcPinboard.test-browser.helpers.js';

customElements.define('owc-pinboard', OwcPinboard);

/** @typedef {import('./OwcPinboard.test-browser.helpers.js').Pinboard} Pinboard */

/**
 * The Move to… button of a card.
 *
 * @param {Pinboard} el
 * @param {number} list the index of the card's list among the lists of the board
 * @param {number} index the index of the card among the rendered cards of its list
 * @returns {HTMLButtonElement | null}
 */
function moveButton(el, list, index) {
  return items(lists(el)[list])[index].querySelector('button[aria-haspopup="menu"]');
}

/**
 * The accessible name of a button that is named by `aria-label`, or by the
 * elements `aria-labelledby` lists, which may include itself.
 *
 * @param {Element} button
 */
function nameOf(button) {
  const root = /** @type {ShadowRoot} */ (button.getRootNode());
  const ids = button.getAttribute('aria-labelledby')?.split(' ');
  if (!ids) {
    return button.getAttribute('aria-label');
  }
  return ids
    .map(id => root.getElementById(id))
    .map(part => part.getAttribute('aria-label') ?? part.textContent.trim())
    .join(' ');
}

/**
 * A real click in the middle of an element, which is scrolled into the
 * window first: a board with dropzones is wider than the test window.
 *
 * @param {Element} element
 */
async function clickOn(element) {
  element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  const { x, y, width, height } = element.getBoundingClientRect();
  await sendMouse({
    type: 'click',
    position: [Math.round(x + width / 2), Math.round(y + height / 2)],
  });
}

/**
 * The items of the menu that is open.
 *
 * @param {Pinboard} el
 */
function menuItems(el) {
  return /** @type {HTMLElement[]} */ ([
    ...el.shadowRoot.querySelectorAll('wa-dropdown[open] [role="menuitem"]'),
  ]);
}

/**
 * Whether a menu is open.
 *
 * @param {Pinboard} el
 */
function isOpen(el) {
  return el.shadowRoot.querySelector('wa-dropdown[open]') !== null;
}

/**
 * Clicks on a Move to… button and waits for its menu to be open: the focus
 * is on its first item that can be chosen then.
 *
 * @param {HTMLButtonElement} button
 */
async function openWithClick(button) {
  const el = /** @type {Pinboard} */ (/** @type {ShadowRoot} */ (button.getRootNode()).host);
  await clickOn(button);
  await waitUntil(
    () => {
      const [first] = menuItems(el).filter(item => item.getAttribute('aria-disabled') !== 'true');
      return first !== undefined && deepActiveElement() === first;
    },
    'the menu did not open',
    { timeout: 1500 },
  );
}

/**
 * Presses Escape and waits for the open menu to be gone.
 *
 * @param {Pinboard} el
 */
async function closeWithEscape(el) {
  await press('Escape');
  await waitUntil(() => el.shadowRoot.querySelector('wa-dropdown') === null);
}

/**
 * What the items of the open menu say, with `(disabled)` behind the ones that
 * can't be chosen.
 *
 * @param {Pinboard} el
 */
function menu(el) {
  return menuItems(el).map(
    item =>
      `${item.textContent.trim()}${item.getAttribute('aria-disabled') === 'true' ? ' (disabled)' : ''}`,
  );
}

/**
 * The cards of every list of a board, by their id.
 *
 * @param {Pinboard} el
 */
function board(el) {
  return lists(el).map(list =>
    items(list).map(item => /** @type {any} */ (item.querySelector('owc-card')).data.id),
  );
}

/**
 * Hooks that note the moves they are asked for, and then do them.
 *
 * @param {string[]} log
 */
function recording(log) {
  return {
    onLift: (card, from, lift) => {
      log.push(`lift ${card.id} from ${from}`);
      lift(card, from);
    },
    onDrop: (card, to, drop) => {
      log.push(`drop ${card.id} on ${to}`);
      drop(card, to);
    },
  };
}

afterEach(async () => {
  await resetMouse();
});

describe('owc-pinboard Move to… button', () => {
  it('gives every card a button that is named after what it does and after its card', async () => {
    const { el } = await boardFixture({ data: [cards('todo', 2), cards('doing', 1), []] });
    expect(nameOf(moveButton(el, 0, 0))).to.equal('Move to… todo card 0');
    expect(nameOf(moveButton(el, 0, 1))).to.equal('Move to… todo card 1');
    expect(nameOf(moveButton(el, 1, 0))).to.equal('Move to… doing card 0');
  });

  it('gives the cards of a dropzone list a button only if the dropzone is liftable', async () => {
    const { el } = await boardFixture({
      dropZones: {
        success: { data: cards('finished', 2), liftable: true },
        delete: { data: cards('deleted', 2) },
      },
    });
    dropzone(el, 'success').click();
    dropzone(el, 'delete').click();
    await dropzoneSettled(el);
    expect(lists(el).map(list => list.getAttribute('aria-label'))).to.deep.equal([
      'Todo',
      'Doing',
      'Review',
      'Done',
      'Delete',
    ]);
    expect(nameOf(moveButton(el, 3, 1))).to.equal('Move to… finished card 1');
    expect(moveButton(el, 4, 0) === null).to.equal(true);
    expect(moveButton(el, 4, 1) === null).to.equal(true);
  });

  it('gives no card a button on a board with nowhere else to go', async () => {
    const { el } = await boardFixture({
      columns: [{ label: 'Todo', value: 'todo' }],
      data: [cards('todo', 2)],
    });
    expect(moveButton(el, 0, 0) === null).to.equal(true);
  });

  it('names the button by cardLabel, in the language of the board', async () => {
    const { el } = await boardFixture({ cardLabel: card => `Card ${card.id}`, lang: 'de' });
    expect(nameOf(moveButton(el, 0, 0))).to.equal('Verschieben nach… Card todo-0');
  });

  it('sits in the top corner at the end of its card, also in a dropzone list, and is big enough to hit', async () => {
    const { el } = await boardFixture({
      dropZones: { success: { data: cards('finished', 2), liftable: true } },
    });
    dropzone(el, 'success').click();
    await dropzoneSettled(el);
    for (const list of [0, 3]) {
      const button = moveButton(el, list, 1);
      const card = button
        .closest('[role="listitem"]')
        .querySelector('owc-card')
        .getBoundingClientRect();
      const rect = button.getBoundingClientRect();
      expect(rect.width, 'width').to.be.at.least(24);
      expect(rect.height, 'height').to.be.at.least(24);
      expect(rect.top - card.top, 'from the top of the card').to.be.within(0, 8);
      expect(card.right - rect.right, 'from the end of the card').to.be.within(0, 8);
    }
  });

  describe('visibility', () => {
    /** @param {Element} button */
    function shows(button) {
      const { opacity, display, visibility } = getComputedStyle(button);
      return display !== 'none' && visibility === 'visible' && opacity === '1';
    }

    /**
     * Whether assistive technology finds an element: it is rendered, however
     * it looks.
     *
     * @param {Element} button
     */
    function isExposed(button) {
      return button.checkVisibility({ visibilityProperty: true });
    }

    /** @param {Element} element */
    async function hover(element) {
      const { x, y, width, height } = element.getBoundingClientRect();
      await sendMouse({
        type: 'move',
        position: [Math.round(x + width / 4), Math.round(y + height / 2)],
      });
    }

    it('shows the button of the card the pointer is over, and keeps the others for assistive technology', async () => {
      const { el } = await boardFixture();
      const buttons = [moveButton(el, 0, 0), moveButton(el, 0, 1), moveButton(el, 1, 0)];
      expect(buttons.map(shows)).to.deep.equal([false, false, false]);
      expect(buttons.map(isExposed)).to.deep.equal([true, true, true]);

      await hover(items(lists(el)[0])[1]);
      expect(buttons.map(shows)).to.deep.equal([false, true, false]);

      await hover(items(lists(el)[1])[0]);
      expect(buttons.map(shows)).to.deep.equal([false, false, true]);
    });

    it('shows the button of the card that has the focus, or has it in one of its controls', async () => {
      const { el } = await focusedBoard();
      const buttons = [moveButton(el, 0, 0), moveButton(el, 0, 1)];
      expect(buttons.map(shows)).to.deep.equal([true, false]);

      await press('ArrowDown');
      expect(buttons.map(shows)).to.deep.equal([false, true]);

      await press('Enter');
      expect(focusAt(el)).to.equal('Todo:1 menu button');
      expect(buttons.map(shows)).to.deep.equal([false, true]);
    });

    it('always shows the buttons where there is no hover, as on touch screens', async () => {
      const { el } = await boardFixture();
      const button = moveButton(el, 0, 0);
      // The test browser has a pointer that hovers, so this reads the styles.
      const rules = el.shadowRoot.adoptedStyleSheets
        .flatMap(sheet => [...sheet.cssRules])
        .filter(rule => rule instanceof CSSMediaRule && rule.conditionText === '(hover: none)')
        .flatMap(rule => [...rule.cssRules])
        .filter(rule => button.matches(rule.selectorText));
      expect(rules.map(rule => rule.style.opacity)).to.deep.equal(['1']);
    });
  });
});

describe('owc-pinboard Move to… menu', () => {
  it('lists every other column and every dropzone, and one click on one of them moves the card', async () => {
    const log = [];
    const { el } = await boardFixture({
      columns: columns.map(column => ({ ...column, ...recording(log) })),
      dropZones: { success: { data: [], ...recording(log) }, delete: recording(log) },
    });
    await openWithClick(moveButton(el, 0, 1));
    expect(menu(el)).to.deep.equal(['Doing', 'Review', 'Done', 'Delete']);

    await clickOn(menuItems(el)[1]);
    await waitUntil(() => log.length === 2);
    await el.updateComplete;
    expect(log).to.deep.equal(['lift todo-1 from todo', 'drop todo-1 on review']);
    expect(board(el)).to.deep.equal([
      ['todo-0', 'todo-2'],
      ['doing-0', 'doing-1'],
      ['review-0', 'review-1', 'review-2', 'review-3', 'todo-1'],
      [],
    ]);
    expect(menuItems(el)).to.deep.equal([]);
  });

  it('disables the columns that canDrop rejects for the card, and a click on one does nothing', async () => {
    const log = [];
    const { el } = await boardFixture({
      columns: columns.map(column => ({ ...column, ...recording(log) })),
      canDrop: (card, column) => !(card.id === 'todo-0' && column === 'review'),
    });
    await openWithClick(moveButton(el, 0, 0));
    expect(menu(el)).to.deep.equal(['Doing', 'Review (disabled)']);

    await clickOn(menuItems(el)[1]);
    await el.updateComplete;
    expect(log).to.deep.equal([]);
    expect(menu(el)).to.deep.equal(['Doing', 'Review (disabled)']);

    await closeWithEscape(el);
    await openWithClick(moveButton(el, 0, 1));
    expect(menu(el)).to.deep.equal(['Doing', 'Review']);
  });

  it('moves a card out of a liftable dropzone list, to anywhere but its own dropzone', async () => {
    const log = [];
    const { el } = await boardFixture({
      columns: columns.map(column => ({ ...column, ...recording(log) })),
      dropZones: {
        success: { data: cards('finished', 2), liftable: true, ...recording(log) },
        delete: recording(log),
      },
    });
    dropzone(el, 'success').click();
    await dropzoneSettled(el);
    await openWithClick(moveButton(el, 3, 0));
    expect(menu(el)).to.deep.equal(['Todo', 'Doing', 'Review', 'Delete']);

    await clickOn(menuItems(el)[1]);
    await waitUntil(() => log.length === 2);
    await el.updateComplete;
    expect(log).to.deep.equal(['lift finished-0 from success', 'drop finished-0 on doing']);
    expect(board(el)).to.deep.equal([
      ['todo-0', 'todo-1', 'todo-2'],
      ['doing-0', 'doing-1', 'finished-0'],
      ['review-0', 'review-1', 'review-2', 'review-3'],
      ['finished-1'],
    ]);
  });

  it('never disables a dropzone, and asks canDrop about columns only', async () => {
    const asked = [];
    const log = [];
    const { el } = await boardFixture({
      dropZones: { success: { data: [], ...recording(log) }, delete: recording(log) },
      canDrop: (card, column) => {
        asked.push(column);
        return false;
      },
    });
    await openWithClick(moveButton(el, 1, 0));
    expect(menu(el)).to.deep.equal(['Todo (disabled)', 'Review (disabled)', 'Done', 'Delete']);
    expect(asked).to.deep.equal(['todo', 'review']);

    await clickOn(menuItems(el)[3]);
    await waitUntil(() => log.length === 1);
    await el.updateComplete;
    expect(log).to.deep.equal(['drop doing-0 on delete']);
  });

  it('moves a card out of a column that renders only part of its cards', async () => {
    const { el, box } = await boardFixture({
      data: [cards('todo', 1000), cards('doing', 2), []],
      boxStyle: 'height: 400px; overflow: auto',
    });
    const [todo, doing] = lists(el);
    await untilStable(el, () => String(items(todo).length));
    await scrollTo(box, 20000);
    await untilStable(el, () => items(todo)[0]?.textContent);
    const inView = items(todo).filter(item => isInView(item, box))[2];
    const card = /** @type {any} */ (inView.querySelector('owc-card')).data;

    await openWithClick(inView.querySelector('button[aria-haspopup="menu"]'));
    expect(menu(el)).to.deep.equal(['Doing', 'Review']);
    await clickOn(menuItems(el)[0]);
    await waitUntil(() => el.data[1].includes(card));
    await el.updateComplete;
    expect(el.data[0]).to.have.length(999);
    expect(items(doing).map(item => item.textContent.trim())).to.include(card.title);
  });

  it('keeps the events of the menu to itself', async () => {
    const { el } = await boardFixture({
      dropZones: { success: { data: cards('finished', 2), liftable: true } },
    });
    dropzone(el, 'success').click();
    await dropzoneSettled(el);
    const heard = [];
    for (const type of ['wa-show', 'wa-after-show', 'wa-hide', 'wa-after-hide', 'wa-select']) {
      el.addEventListener(type, () => heard.push(type));
    }

    await openWithClick(moveButton(el, 3, 0));
    expect(dropzone(el, 'success').getAttribute('aria-expanded')).to.equal('true');
    await closeWithEscape(el);
    await openWithClick(moveButton(el, 0, 0));
    await clickOn(menuItems(el)[0]);
    await waitUntil(() => board(el)[1].includes('todo-0'));
    expect(heard).to.deep.equal([]);
    expect(dropzone(el, 'success').getAttribute('aria-expanded')).to.equal('true');
  });

  it('says on the button whether its menu is open, and a second click closes it', async () => {
    const { el } = await boardFixture();
    const button = moveButton(el, 0, 0);
    expect(button.getAttribute('aria-expanded')).to.equal('false');

    await openWithClick(button);
    expect(button.getAttribute('aria-expanded')).to.equal('true');

    await clickOn(button);
    await waitUntil(() => button.getAttribute('aria-expanded') === 'false');
    expect(isOpen(el)).to.equal(false);
  });

  it('has one menu open at a time', async () => {
    const { el } = await boardFixture();
    const buttons = [moveButton(el, 0, 0), moveButton(el, 1, 0)];
    await openWithClick(buttons[0]);
    await openWithClick(buttons[1]);
    expect(menu(el)).to.deep.equal(['Todo', 'Review']);
    expect(el.shadowRoot.querySelectorAll('wa-dropdown').length).to.equal(1);
    expect(buttons.map(button => button.getAttribute('aria-expanded'))).to.deep.equal([
      'false',
      'true',
    ]);
  });

  it('waits for the lift hook before it runs the drop hook, and is closed meanwhile', async () => {
    const log = [];
    /** @type {() => void} */
    let finishLift;
    const { el } = await boardFixture({
      columns: columns.map(column => ({
        ...column,
        ...recording(log),
        onLift: async (card, from, lift) => {
          log.push(`lift ${card.id} from ${from}`);
          await new Promise(resolve => {
            finishLift = () => resolve(undefined);
          });
          lift(card, from);
        },
      })),
    });
    await openWithClick(moveButton(el, 0, 1));
    await clickOn(menuItems(el)[0]);
    await waitUntil(() => log.length === 1);
    await el.updateComplete;
    expect(isOpen(el)).to.equal(false);
    expect(el.shadowRoot.querySelector('wa-dropdown') === null).to.equal(true);
    expect(board(el)[0]).to.deep.equal(['todo-0', 'todo-1', 'todo-2']);

    finishLift();
    await waitUntil(() => log.length === 2);
    await el.updateComplete;
    expect(log).to.deep.equal(['lift todo-1 from todo', 'drop todo-1 on doing']);
    expect(board(el)).to.deep.equal([
      ['todo-0', 'todo-2'],
      ['doing-0', 'doing-1', 'todo-1'],
      ['review-0', 'review-1', 'review-2', 'review-3'],
    ]);
    expect(isOpen(el)).to.equal(false);
  });

  it("doesn't come back with a card that left the rendered cards while its menu was open", async () => {
    const { el, box } = await boardFixture({
      data: [cards('todo', 1000), cards('doing', 2), []],
      boxStyle: 'height: 400px; overflow: auto',
    });
    const [todo] = lists(el);
    await untilStable(el, () => String(items(todo).length));
    const second = () => items(todo).find(item => item.getAttribute('aria-posinset') === '2');
    await openWithClick(second().querySelector('button[aria-haspopup="menu"]'));

    await scrollTo(box, 20000);
    await untilStable(el, () => items(todo)[0]?.textContent);
    expect(second() === undefined).to.equal(true);
    expect(el.shadowRoot.querySelector('wa-dropdown') === null).to.equal(true);

    await scrollTo(box, 0);
    await untilStable(el, () => items(todo)[0]?.textContent);
    expect(second() === undefined).to.equal(false);
    expect(el.shadowRoot.querySelector('wa-dropdown') === null).to.equal(true);
    expect(second().querySelector('button').getAttribute('aria-expanded')).to.equal('false');
  });

  it('has no axe violations while a menu is open', async () => {
    const { el } = await boardFixture({
      dropZones: { success: { data: cards('finished', 2), liftable: true }, delete: {} },
      canDrop: (card, column) => column !== 'review',
    });
    await expect(el).to.be.accessible();
    await openWithClick(moveButton(el, 0, 0));
    expect(menu(el)).to.deep.equal(['Doing', 'Review (disabled)', 'Done', 'Delete']);
    await expect(el).to.be.accessible();
  });
});

describe('owc-pinboard Move to… menu with the keyboard', () => {
  it("reaches the button in the card's interaction mode, after the controls of the card", async () => {
    const { el } = await focusedBoard({
      fieldMapper: { body: card => html`<a href="#${card.id}">${card.title}</a>` },
    });
    expect(await pressAll(el, ['Enter', 'Tab', 'Tab', 'Shift+Tab', 'Escape'])).to.deep.equal([
      'Todo:0 a',
      'Todo:0 menu button',
      'Todo:0 a',
      'Todo:0 menu button',
      'Todo:0',
    ]);
  });

  it('is no Tab stop of its own', async () => {
    const { el, before, after } = await boardFixture();
    expect(await tabStops(el, before, after)).to.deep.equal(['Todo:0']);
    expect(await tabStops(el, after, before, 'Shift+Tab')).to.deep.equal(['Todo:0']);
  });

  it('opens from the button with Enter, and the keys of a menu choose where the card goes', async () => {
    const log = [];
    const { el } = await focusedBoard({
      columns: columns.map(column => ({ ...column, ...recording(log) })),
      dropZones: { delete: recording(log) },
    });
    expect(await pressAll(el, ['Enter'])).to.deep.equal(['Todo:0 menu button']);
    await press('Enter');
    await focusArrivesAt(el, 'Todo:0 menu item Doing');
    expect(
      await pressAll(el, ['ArrowDown', 'ArrowDown', 'ArrowDown', 'End', 'ArrowUp']),
    ).to.deep.equal([
      'Todo:0 menu item Review',
      'Todo:0 menu item Delete',
      'Todo:0 menu item Doing',
      'Todo:0 menu item Delete',
      'Todo:0 menu item Review',
    ]);

    await press('Enter');
    await waitUntil(() => log.length === 2);
    expect(log).to.deep.equal(['lift todo-0 from todo', 'drop todo-0 on review']);
    await focusArrivesAt(el, 'Review:4');
    expect(isOpen(el)).to.equal(false);
  });

  it('opens from the button with Space, and skips the columns the card cannot go to', async () => {
    const { el } = await focusedBoard({ canDrop: (card, column) => column !== 'doing' });
    await pressAll(el, ['Enter', 'Space']);
    await focusArrivesAt(el, 'Todo:0 menu item Review');
    expect(await pressAll(el, ['ArrowDown', 'Home'])).to.deep.equal([
      'Todo:0 menu item Review',
      'Todo:0 menu item Review',
    ]);
  });

  it('closes with Escape, which returns to the button, and from there to the card', async () => {
    const { el } = await focusedBoard();
    await pressAll(el, ['Enter', 'Enter']);
    await focusArrivesAt(el, 'Todo:0 menu item Doing');

    await closeWithEscape(el);
    expect(focusAt(el)).to.equal('Todo:0 menu button');
    expect(await pressAll(el, ['Escape', 'ArrowDown'])).to.deep.equal(['Todo:0', 'Todo:1']);
  });

  it('closes with Tab, which leaves the board', async () => {
    const { el } = await focusedBoard();
    await pressAll(el, ['Enter', 'Enter']);
    await focusArrivesAt(el, 'Todo:0 menu item Doing');

    expect(await pressAll(el, ['Tab'])).to.deep.equal(['#after']);
    expect(isOpen(el)).to.equal(false);
    expect(await pressAll(el, ['Shift+Tab'])).to.deep.equal(['Todo:0']);
  });

  for (const key of ['Shift+F10', 'ContextMenu']) {
    it(`opens from a focused card with ${key} instead of the browser's menu, and Escape returns to the card`, async () => {
      const { el } = await focusedBoard();
      const prevented = [];
      el.addEventListener(
        'keydown',
        event => event.key !== 'Shift' && prevented.push(event.defaultPrevented),
      );
      await press('ArrowDown');
      await press(key);
      expect(prevented).to.deep.equal([true, true]);
      await focusArrivesAt(el, 'Todo:1 menu item Doing');
      expect(menu(el)).to.deep.equal(['Doing', 'Review']);

      expect(await pressAll(el, ['ArrowDown'])).to.deep.equal(['Todo:1 menu item Review']);
      await closeWithEscape(el);
      expect(focusAt(el)).to.equal('Todo:1');
      expect(await pressAll(el, ['ArrowDown'])).to.deep.equal(['Todo:2']);
    });
  }

  it('moves the card with a menu that was opened from the card, and the focus follows it', async () => {
    const log = [];
    const { el } = await focusedBoard({
      columns: columns.map(column => ({ ...column, ...recording(log) })),
    });
    await press('Shift+F10');
    await focusArrivesAt(el, 'Todo:0 menu item Doing');
    await press('Enter');
    await waitUntil(() => log.length === 2);
    expect(log).to.deep.equal(['lift todo-0 from todo', 'drop todo-0 on doing']);
    await focusArrivesAt(el, 'Doing:2');
  });

  it('opens for a card that is picked up, which puts the card back', async () => {
    const { el } = await focusedBoard();
    await press('Space');
    await announces(
      el,
      'Picked up todo card 0. Arrow keys choose a destination, Space drops, Escape cancels.',
    );
    await press('Shift+F10');
    await focusArrivesAt(el, 'Todo:0 menu item Doing');

    await closeWithEscape(el);
    expect(focusAt(el)).to.equal('Todo:0');
    // a card that is picked up would stay where it is and step through the destinations
    expect(await pressAll(el, ['ArrowRight'])).to.deep.equal(['Doing:0']);
    expect(el.data.map(list => list.length)).to.deep.equal([3, 2, 4]);
  });

  it("leaves Shift+F10 to the browser on a card that can't be moved", async () => {
    const { el } = await focusedBoard({
      data: [[], [], []],
      dropZones: { success: { data: cards('finished', 2) } },
    });
    dropzone(el, 'success').click();
    await dropzoneSettled(el);
    await press('Tab');
    expect(await pressAll(el, ['Enter'])).to.deep.equal(['Done:0']);

    const prevented = [];
    el.addEventListener(
      'keydown',
      event => event.key !== 'Shift' && prevented.push(event.defaultPrevented),
    );
    expect(await pressAll(el, ['Shift+F10'])).to.deep.equal(['Done:0']);
    expect(prevented).to.deep.equal([false]);
    expect(isOpen(el)).to.equal(false);
  });
});

describe('owc-pinboard Move to… menu, after the move, as in pick-up mode', () => {
  /**
   * Opens the menu of the focused card with Shift+F10 and chooses one of its
   * items with the keys of the menu.
   *
   * @param {Pinboard} el
   * @param {string} label what the item says
   */
  async function moveFocusedCardTo(el, label) {
    await press('Shift+F10');
    await waitUntil(() => focusAt(el).includes(' menu item '), 'the menu did not open', {
      timeout: 1500,
    });
    const choices = menu(el).filter(item => !item.endsWith('(disabled)'));
    for (let presses = 0; presses < choices.indexOf(label); presses++) {
      await press('ArrowDown');
    }
    expect(focusAt(el)).to.contain(` menu item ${label}`);
    await press('Enter');
  }

  it('says where the card is now and follows it with the focus', async () => {
    const { el } = await focusedBoard();
    await press('ArrowDown');
    await moveFocusedCardTo(el, 'Doing');
    await announces(el, 'Moved todo card 1 to Doing, 3 of 3');
    await focusArrivesAt(el, 'Doing:2');
    expect(focusedCard(el).textContent).to.contain('todo card 1');
    expect(await pressAll(el, ['ArrowLeft'])).to.deep.equal(['Todo:1']);
  });

  it('does so for a menu that was opened from its button', async () => {
    const { el } = await focusedBoard({ cardLabel: card => `Card ${card.id}` });
    await pressAll(el, ['ArrowDown', 'Enter', 'Enter']);
    await focusArrivesAt(el, 'Todo:1 menu item Doing');
    await pressAll(el, ['ArrowDown', 'Enter']);
    await announces(el, 'Moved Card todo-1 to Review, 5 of 5');
    await focusArrivesAt(el, 'Review:4');
  });

  it('does so for a menu that is used with clicks', async () => {
    const { el } = await boardFixture();
    await openWithClick(moveButton(el, 0, 1));
    await clickOn(menuItems(el)[0]);
    await announces(el, 'Moved todo card 1 to Doing, 3 of 3');
    await focusArrivesAt(el, 'Doing:2');
  });

  describe('into a column that renders only part of its cards', () => {
    /**
     * A board in a 400px scroll box whose second column has 1000 cards, with
     * the focus on `Todo:1`.
     *
     * @param {object[]} [boardColumns]
     */
    async function largeBoard(boardColumns = columns) {
      const large = await focusedBoard({
        columns: boardColumns,
        data: [cards('todo', 3), cards('doing', 1000), cards('review', 2)],
        boxStyle: 'height: 400px; overflow: auto',
      });
      await untilStable(large.el, () => String(items(lists(large.el)[1]).length));
      await press('ArrowDown');
      return large;
    }

    it('brings the card in, scrolls to it and focuses it', async function () {
      this.timeout(10000);
      const { el, box } = await largeBoard();
      await moveFocusedCardTo(el, 'Doing');
      await announces(el, 'Moved todo card 1 to Doing, 1001 of 1001');
      await focusArrivesAt(el, 'Doing:1000');
      expect(focusedCard(el).textContent).to.contain('todo card 1');
      expect(isInView(focusedCard(el), box)).to.equal(true);
    });

    it('leaves the focus where the user put it while the hooks ran, and does not scroll', async function () {
      this.timeout(10000);
      let dropping = false;
      const slowDrop = async (card, column, defaultDrop) => {
        dropping = true;
        await aTimeout(20);
        defaultDrop(card, column);
      };
      const { el, box, after } = await largeBoard(
        columns.map(column => ({ ...column, onDrop: slowDrop })),
      );
      await moveFocusedCardTo(el, 'Doing');
      await waitUntil(() => dropping);
      after.focus();
      await announces(el, 'Moved todo card 1 to Doing, 1001 of 1001');
      await untilStable(el, () => items(lists(el)[1])[0]?.textContent);
      expect(focusAt(el)).to.equal('#after');
      expect(box.scrollTop).to.equal(0);
    });
  });

  for (const [what, zone] of [
    ['keeps no cards', {}],
    ['keeps its cards in a closed list', { data: [] }],
    ['keeps its cards in an open list', { data: [], open: true }],
  ]) {
    it(`moves the focus to the next card, else to the previous one, else to the list, when the card went to a dropzone that ${what}`, async () => {
      const { open, ...deleteZone } = zone;
      const { el } = await focusedBoard({ dropZones: { success: {}, delete: deleteZone } });
      if (open) {
        dropzone(el, 'delete').click();
        await dropzoneSettled(el);
        el.shadowRoot.querySelector('[role="listitem"][tabindex="0"]').focus();
      }
      /** @param {number} left the number of cards the first column has then */
      const moveToDelete = async left => {
        await moveFocusedCardTo(el, 'Delete');
        await waitUntil(() => el.data[0].length === left);
        await waitUntil(() => liveRegion(el).textContent.startsWith('Moved'));
        await el.updateComplete;
      };
      await press('ArrowDown');
      await moveToDelete(2);
      expect(focusAt(el), 'the next card').to.equal('Todo:1');
      expect(focusedCard(el).textContent).to.contain('todo card 2');

      await moveToDelete(1);
      expect(focusAt(el), 'the previous card').to.equal('Todo:0');
      expect(focusedCard(el).textContent).to.contain('todo card 0');

      await moveToDelete(0);
      expect(focusAt(el)).to.equal('list Todo');
    });
  }
});
