import { aTimeout, expect, html, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import '@open-wc/components/register/de.js';
import { OwcPinboard } from './OwcPinboard.js';
import { scrollTo, untilStable } from '../virtualizer/virtualList.test-browser.helpers.js';
import {
  announces,
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
} from './OwcPinboard.test-browser.helpers.js';

customElements.define('owc-pinboard', OwcPinboard);

/** @typedef {import('./OwcPinboard.test-browser.helpers.js').Pinboard} Pinboard */

/**
 * The columns and dropzones that show a class, like `Doing` or `dropzone Delete`.
 *
 * @param {Pinboard} el
 * @param {string} className
 */
function marked(el, className) {
  return [...el.shadowRoot.querySelectorAll(`.${className}`)].map(element =>
    element.matches('.dropzone')
      ? `dropzone ${element.getAttribute('aria-label')}`
      : element.querySelector('[role="list"]').getAttribute('aria-label'),
  );
}

/**
 * The titles of the cards the board shows, list by list.
 *
 * @param {Pinboard} el
 */
function titles(el) {
  return lists(el).map(list => items(list).map(item => item.textContent.trim()));
}

/**
 * Collects what the board says from now on.
 *
 * @param {Pinboard} el
 * @returns {string[]} the messages, which grow as the board says more
 */
function listenTo(el) {
  const heard = [];
  new MutationObserver(() => {
    const message = liveRegion(el).textContent;
    if (message) {
      heard.push(message);
    }
  }).observe(liveRegion(el), { childList: true });
  return heard;
}

/**
 * Presses a key, and waits for what the board says then.
 *
 * @param {Pinboard} el
 * @param {string} key
 * @param {string} message
 */
async function pressAndHear(el, key, message) {
  await press(key);
  await announces(el, message);
  await el.updateComplete;
}

describe('owc-pinboard pick-up mode', () => {
  describe('picking up', () => {
    it('picks up the focused card with Space and says so, naming the card by its text', async () => {
      const { el } = await focusedBoard();
      await press('Space');
      await announces(
        el,
        'Picked up todo card 0. Arrow keys choose a destination, Space drops, Escape cancels.',
      );
      expect(focusAt(el), 'the focus stays on the card').to.equal('Todo:0');
    });

    it('names the card by cardLabel, and speaks the language of the board', async () => {
      const { el } = await focusedBoard({
        lang: 'de',
        cardLabel: card => `Karte ${card.id}`,
        canDrop: (card, column) => column !== 'review',
        dropZones: { success: { data: cards('finished', 1) }, delete: { data: [] } },
      });
      await pressAndHear(
        el,
        'Space',
        'Karte todo-0 aufgenommen. Pfeiltasten wählen ein Ziel, Leertaste legt ab, Escape bricht ab.',
      );
      await pressAndHear(el, 'ArrowRight', 'Doing, 2 Karten');
      await pressAndHear(el, 'ArrowRight', 'Ablegen in Review nicht möglich');
      await pressAndHear(el, 'ArrowRight', 'Erledigt, 1 Karte');
      await pressAndHear(el, 'Escape', 'Verschieben abgebrochen');
      await pressAll(el, ['Space', 'ArrowRight']);
      await pressAndHear(el, 'Space', 'Karte todo-0 nach Doing verschoben, 3 von 3');

      dropzone(el, 'success').click();
      await dropzoneSettled(el);
      el.shadowRoot.querySelector('[role="listitem"][tabindex="0"]').focus();
      await pressAll(el, ['ArrowRight', 'ArrowRight']);
      expect(focusAt(el)).to.equal('Erledigt:0');
      await pressAndHear(el, 'Space', 'Karte finished-0 kann nicht verschoben werden');
    });

    it('puts a card back that is picked up when it is dragged', async () => {
      const { el } = await focusedBoard({ canDrop: (card, column) => column !== 'review' });
      await pressAll(el, ['Space', 'ArrowRight']);
      const [, doing] = el.shadowRoot.querySelectorAll('.column');
      const dataTransfer = new DataTransfer();
      focusedCard(el).dispatchEvent(new DragEvent('dragstart', { dataTransfer, bubbles: true }));
      await el.updateComplete;
      expect(marked(el, 'drop-hover')).to.deep.equal([]);
      expect(marked(el, 'cannot-drop'), 'what dragging shows').to.deep.equal(['Review']);
      doing.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }));
      await el.updateComplete;
      expect(marked(el, 'cannot-drop')).to.deep.equal([]);
      await announces(el, 'Moved todo card 0 to Doing, 3 of 3');
      expect(focusAt(el)).to.equal('Doing:2');
      expect(await pressAll(el, ['ArrowUp']), 'the arrow keys navigate').to.deep.equal(['Doing:1']);
    });

    /**
     * A board with the focus on the first card of the open list of its Done
     * dropzone.
     *
     * @param {boolean} liftable
     */
    async function focusedDropzoneList(liftable) {
      const board = await focusedBoard({
        dropZones: { success: { data: cards('finished', 2), liftable }, delete: {} },
      });
      dropzone(board.el, 'success').click();
      await dropzoneSettled(board.el);
      board.el.shadowRoot.querySelector('[role="listitem"][tabindex="0"]').focus();
      expect(await pressAll(board.el, ['ArrowRight', 'ArrowRight', 'ArrowRight'])).to.deep.equal([
        'Doing:0',
        'Review:0',
        'Done:0',
      ]);
      return board;
    }

    it('picks up a card of a liftable dropzone list, starting from its dropzone', async () => {
      const { el } = await focusedDropzoneList(true);
      await pressAndHear(
        el,
        'Space',
        'Picked up finished card 0. Arrow keys choose a destination, Space drops, Escape cancels.',
      );
      expect(marked(el, 'drop-hover')).to.deep.equal(['dropzone Done']);
      await pressAndHear(el, 'ArrowRight', 'Delete');
      await pressAndHear(el, 'ArrowLeft', 'Done, 2 cards');
      await pressAndHear(el, 'ArrowLeft', 'Review, 4 cards');
      await pressAndHear(el, 'Space', 'Moved finished card 0 to Review, 5 of 5');
      expect(titles(el)[3]).to.deep.equal(['finished card 1']);
      expect(focusAt(el)).to.equal('Review:4');
    });

    it('says that a card of a dropzone list that is not liftable cannot be moved', async () => {
      const { el } = await focusedDropzoneList(false);
      await pressAndHear(el, 'Space', "finished card 0 can't be moved");
      expect(marked(el, 'drop-hover')).to.deep.equal([]);
      expect(await pressAll(el, ['ArrowLeft']), 'the arrow keys still navigate').to.deep.equal([
        'Review:0',
      ]);
    });
  });

  describe('choosing a destination', () => {
    it('steps through the columns, then the dropzones, with ← and →, and says where it is', async () => {
      const { el } = await focusedBoard({
        dropZones: { success: { data: cards('finished', 1) }, delete: {} },
      });
      await press('ArrowDown');
      await press('Space');
      await el.updateComplete;
      expect(marked(el, 'drop-hover'), 'it starts at the column of the card').to.deep.equal([
        'Todo',
      ]);

      await pressAndHear(el, 'ArrowRight', 'Doing, 2 cards');
      expect(marked(el, 'drop-hover')).to.deep.equal(['Doing']);
      await pressAndHear(el, 'ArrowRight', 'Review, 4 cards');
      await pressAndHear(el, 'ArrowRight', 'Done, 1 card');
      expect(marked(el, 'drop-hover')).to.deep.equal(['dropzone Done']);
      await pressAndHear(el, 'ArrowRight', 'Delete');
      expect(marked(el, 'drop-hover')).to.deep.equal(['dropzone Delete']);
      await pressAndHear(el, 'ArrowRight', 'Delete');
      expect(marked(el, 'drop-hover'), 'the last one').to.deep.equal(['dropzone Delete']);

      await pressAndHear(el, 'ArrowLeft', 'Done, 1 card');
      await pressAndHear(el, 'ArrowLeft', 'Review, 4 cards');
      await pressAndHear(el, 'ArrowLeft', 'Doing, 2 cards');
      await pressAndHear(el, 'ArrowLeft', 'Todo, 3 cards');
      await pressAndHear(el, 'ArrowLeft', 'Todo, 3 cards');
      expect(marked(el, 'drop-hover'), 'the first one').to.deep.equal(['Todo']);
      expect(focusAt(el), 'the focus stays on the card').to.equal('Todo:1');
    });

    it('ignores ↑, ↓, Home and End while a card is picked up', async () => {
      const { el } = await focusedBoard();
      await pressAll(el, ['ArrowDown', 'Space', 'ArrowRight']);
      expect(await pressAll(el, ['ArrowDown', 'ArrowUp', 'End', 'Home'])).to.deep.equal([
        'Todo:1',
        'Todo:1',
        'Todo:1',
        'Todo:1',
      ]);
      expect(marked(el, 'drop-hover'), 'the card is still picked up').to.deep.equal(['Doing']);
    });

    it('drops with Enter on a card with controls too, instead of going to its controls', async () => {
      const { el } = await focusedBoard({
        fieldMapper: { body: card => html`${card.title} <button>Edit</button>` },
      });
      await pressAll(el, ['Space', 'ArrowRight']);
      await pressAndHear(el, 'Enter', 'Moved todo card 0 Edit to Doing, 3 of 3');
      expect(focusAt(el)).to.equal('Doing:2');
    });

    it('keeps the card picked up while its list holds the focus for it', async function () {
      this.timeout(10000);
      const { el, box } = await focusedBoard({
        data: [cards('todo', 1000), cards('doing', 2), cards('review', 2)],
        boxStyle: 'height: 400px; overflow: auto',
      });
      await untilStable(el, () => String(items(lists(el)[0]).length));
      await press('Space');
      await scrollTo(box, 30000);
      await untilStable(el, () => items(lists(el)[0])[0]?.textContent);
      expect(focusAt(el)).to.equal('list Todo');

      await pressAndHear(el, 'ArrowRight', 'Doing, 2 cards');
      await pressAndHear(el, 'Space', 'Moved todo card 0 to Doing, 3 of 3');
      await focusArrivesAt(el, 'Doing:2');
      expect(isInView(focusedCard(el), box)).to.equal(true);
    });
  });

  describe('cancelling', () => {
    /** @param {Pinboard} el */
    function expectNothingMoved(el) {
      expect(titles(el).map(list => list.length)).to.deep.equal([3, 2, 4]);
      expect(marked(el, 'drop-hover')).to.deep.equal([]);
    }

    it('puts the card back with Escape and says so', async () => {
      const { el } = await focusedBoard();
      await pressAll(el, ['Space', 'ArrowRight']);
      await pressAndHear(el, 'Escape', 'Move cancelled');
      expectNothingMoved(el);
      expect(focusAt(el)).to.equal('Todo:0');
      expect(await pressAll(el, ['ArrowRight']), 'the arrow keys navigate again').to.deep.equal([
        'Doing:0',
      ]);
    });

    it('puts the card back when it is dropped where it came from, without running a hook', async () => {
      const calls = [];
      const hooks = { onLift: () => calls.push('lift'), onDrop: () => calls.push('drop') };
      const { el } = await focusedBoard({
        columns: columns.map(column => ({ ...column, ...hooks })),
      });
      await pressAll(el, ['Space', 'ArrowRight', 'ArrowLeft']);
      await pressAndHear(el, 'Space', 'Move cancelled');
      expectNothingMoved(el);
      expect(calls).to.deep.equal([]);
    });

    for (const [key, next] of [
      ['Tab', '#after'],
      ['Shift+Tab', '#before'],
    ]) {
      it(`puts the card back with ${key}, which moves the focus on`, async () => {
        const { el } = await focusedBoard();
        await pressAll(el, ['Space', 'ArrowRight']);
        await pressAndHear(el, key, 'Move cancelled');
        expectNothingMoved(el);
        expect(focusAt(el)).to.equal(next);
      });
    }

    it('puts the card back when the focus leaves the card', async () => {
      const { el, after } = await focusedBoard({ dropZones: { delete: {} } });
      await pressAll(el, ['Space', 'ArrowRight']);
      after.focus();
      await announces(el, 'Move cancelled');
      await el.updateComplete;
      expectNothingMoved(el);

      // to another card, which a click does
      await pressAll(el, ['Shift+Tab', 'Shift+Tab', 'Space', 'ArrowRight']);
      await announces(el, 'Doing, 2 cards');
      items(lists(el)[2])[1].focus();
      await announces(el, 'Move cancelled');
      await el.updateComplete;
      expectNothingMoved(el);
      expect(focusAt(el)).to.equal('Review:1');

      // to a dropzone
      await pressAll(el, ['Space', 'ArrowLeft']);
      await announces(el, 'Doing, 2 cards');
      dropzone(el, 'delete').focus();
      await announces(el, 'Move cancelled');
      await el.updateComplete;
      expectNothingMoved(el);
    });

    it('puts the card back when F2 moves the focus to a control of the card', async () => {
      const { el } = await focusedBoard({
        fieldMapper: { body: card => html`${card.title} <button>Edit</button>` },
      });
      await pressAll(el, ['Space', 'ArrowRight']);
      expect(await pressAll(el, ['F2'])).to.deep.equal(['Todo:0 button']);
      expectNothingMoved(el);
      expect(await pressAll(el, ['Escape', 'ArrowRight'])).to.deep.equal(['Todo:0', 'Doing:0']);
    });

    for (const key of ['F2', 'Shift+F10']) {
      it(`says both that the move is cancelled and how to leave the card's controls after ${key}`, async () => {
        const { el } = await focusedBoard({
          fieldMapper: { body: card => html`${card.title} <button>Edit</button>` },
        });
        await pressAll(el, ['Space', 'ArrowRight']);
        await announces(el, 'Doing, 2 cards');
        const heard = listenTo(el);
        await press(key);
        await announces(el, 'Move cancelled Press Escape to return to the card');
        await aTimeout(100);
        expect(heard).to.deep.equal(['Move cancelled Press Escape to return to the card']);
        expectNothingMoved(el);
      });
    }

    it('picks up once while Space is held down, and drops with the next press', async () => {
      const { el } = await focusedBoard();
      // a held key repeats: the second keydown is a repeat
      await sendKeys({ down: 'Space' });
      await sendKeys({ down: 'Space' });
      await sendKeys({ up: 'Space' });
      await announces(
        el,
        'Picked up todo card 0. Arrow keys choose a destination, Space drops, Escape cancels.',
      );
      await pressAndHear(el, 'ArrowRight', 'Doing, 2 cards');
      expect(focusAt(el)).to.equal('Todo:0');
      await pressAndHear(el, 'Space', 'Moved todo card 0 to Doing, 3 of 3');
    });

    it('keeps the card picked up while the board renders again', async () => {
      const { el } = await focusedBoard({ getCardId: card => card.id });
      await pressAll(el, ['Space', 'ArrowRight']);
      // every card is a new object, so every card gets a new element
      el.data = [cards('todo', 3), cards('doing', 2), cards('review', 4)];
      await el.updateComplete;
      expect(focusAt(el)).to.equal('Todo:0');
      expect(marked(el, 'drop-hover')).to.deep.equal(['Doing']);
      await pressAndHear(el, 'Space', 'Moved todo card 0 to Doing, 3 of 3');
    });
  });

  describe('canDrop', () => {
    it('reaches a column that cannot take the card, marks it and says so, and drops nothing there', async () => {
      const { el } = await focusedBoard({ canDrop: (card, column) => column !== 'doing' });
      await press('Space');
      await el.updateComplete;
      expect(marked(el, 'cannot-drop')).to.deep.equal(['Doing']);

      const heard = listenTo(el);
      await pressAndHear(el, 'ArrowRight', "Can't drop in Doing");
      expect(marked(el, 'drop-hover'), 'no shadow, as when dragging over it').to.deep.equal([]);
      await press('Space');
      await waitUntil(() => heard.length === 2, 'it says it again');
      expect(heard).to.deep.equal(["Can't drop in Doing", "Can't drop in Doing"]);
      expect(titles(el).map(list => list.length)).to.deep.equal([3, 2, 4]);
      expect(marked(el, 'cannot-drop'), 'the card is still picked up').to.deep.equal(['Doing']);

      await pressAndHear(el, 'ArrowRight', 'Review, 4 cards');
      expect(marked(el, 'drop-hover')).to.deep.equal(['Review']);
      await pressAndHear(el, 'Enter', 'Moved todo card 0 to Review, 5 of 5');
      expect(marked(el, 'cannot-drop')).to.deep.equal([]);
    });

    it('is never asked about a dropzone, with or without a list', async () => {
      const asked = [];
      const { el } = await focusedBoard({
        // false for every name it doesn't know
        canDrop: (card, column) => {
          asked.push(column);
          return ['todo', 'doing', 'review'].includes(column);
        },
        dropZones: { success: { data: [] }, delete: {} },
      });
      dropzone(el, 'success').click();
      await dropzoneSettled(el);
      el.shadowRoot.querySelector('[role="listitem"][tabindex="0"]').focus();

      await pressAll(el, ['Space', 'ArrowRight', 'ArrowRight']);
      await pressAndHear(el, 'ArrowRight', 'Done, 0 cards');
      expect(marked(el, 'cannot-drop')).to.deep.equal([]);
      await pressAndHear(el, 'ArrowRight', 'Delete');
      await pressAndHear(el, 'Space', 'Moved todo card 0 to Delete');
      expect(titles(el)[0]).to.deep.equal(['todo card 1', 'todo card 2']);

      await pressAll(el, ['Space', 'ArrowRight', 'ArrowRight', 'ArrowRight']);
      await pressAndHear(el, 'Space', 'Moved todo card 1 to Done, 1 of 1');
      expect(titles(el)[0]).to.deep.equal(['todo card 2']);
      expect(titles(el)[3]).to.deep.equal(['todo card 1']);
      expect(asked).to.include('doing');
      expect(asked).to.not.include('success');
      expect(asked).to.not.include('delete');
    });

    it('is not asked about the open list of a dropzone that a card is dragged onto either', async () => {
      const asked = [];
      const { el } = await focusedBoard({
        canDrop: (card, column) => {
          asked.push(column);
          return ['todo', 'doing', 'review'].includes(column);
        },
        dropZones: { success: { data: [] } },
      });
      dropzone(el, 'success').click();
      await dropzoneSettled(el);
      const list = /** @type {HTMLElement} */ (
        el.shadowRoot.querySelector('.dropzone-details .column')
      );
      const dataTransfer = new DataTransfer();
      focusedCard(el).dispatchEvent(new DragEvent('dragstart', { dataTransfer, bubbles: true }));
      const over = new DragEvent('dragover', { dataTransfer, bubbles: true, cancelable: true });
      list.dispatchEvent(over);
      expect(over.defaultPrevented, 'the list takes the drop').to.be.true;
      expect(list.classList.contains('drop-hover')).to.be.true;
      list.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }));
      await announces(el, 'Moved todo card 0 to Done, 1 of 1');
      expect(titles(el)[3]).to.deep.equal(['todo card 0']);
      expect(asked).to.not.include('success');
    });
  });

  describe('dropping', () => {
    for (const key of ['Space', 'Enter']) {
      it(`drops the card with ${key}, follows it with the focus and says where it is now`, async () => {
        const { el } = await focusedBoard();
        await pressAll(el, ['ArrowDown', 'Space', 'ArrowRight']);
        await pressAndHear(el, key, 'Moved todo card 1 to Doing, 3 of 3');
        expect(titles(el)).to.deep.equal([
          ['todo card 0', 'todo card 2'],
          ['doing card 0', 'doing card 1', 'todo card 1'],
          ['review card 0', 'review card 1', 'review card 2', 'review card 3'],
        ]);
        expect(focusAt(el)).to.equal('Doing:2');
        expect(marked(el, 'drop-hover'), 'the card is not picked up anymore').to.deep.equal([]);
        expect(await pressAll(el, ['ArrowLeft']), 'the arrow keys navigate again').to.deep.equal([
          'Todo:1',
        ]);
      });
    }

    describe('into a column that renders only part of its cards', () => {
      /**
       * A board in a 400px scroll box whose second column has 1000 cards, with
       * the focus on `Todo:1`.
       *
       * @param {object[]} [boardColumns]
       */
      async function largeBoard(boardColumns = columns) {
        const board = await focusedBoard({
          columns: boardColumns,
          data: [cards('todo', 3), cards('doing', 1000), cards('review', 2)],
          boxStyle: 'height: 400px; overflow: auto',
        });
        await untilStable(board.el, () => String(items(lists(board.el)[1]).length));
        await press('ArrowDown');
        return board;
      }

      it('brings the card in, scrolls to it and focuses it', async function () {
        this.timeout(10000);
        const { el, box } = await largeBoard();
        await pressAll(el, ['Space', 'ArrowRight']);
        await pressAndHear(el, 'Space', 'Moved todo card 1 to Doing, 1001 of 1001');
        await focusArrivesAt(el, 'Doing:1000');
        expect(focusedCard(el).textContent).to.contain('todo card 1');
        expect(isInView(focusedCard(el), box)).to.equal(true);
      });

      it('does so for a card that is dragged there while it has the focus', async function () {
        this.timeout(10000);
        const { el, box } = await largeBoard();
        const [todo, doing] = el.shadowRoot.querySelectorAll('.column');
        const dataTransfer = new DataTransfer();
        focusedCard(el).dispatchEvent(new DragEvent('dragstart', { dataTransfer, bubbles: true }));
        doing.dispatchEvent(
          new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }),
        );
        await announces(el, 'Moved todo card 1 to Doing, 1001 of 1001');
        await focusArrivesAt(el, 'Doing:1000');
        expect(isInView(focusedCard(el), box)).to.equal(true);
        expect(items(todo.querySelector('[role="list"]')).length).to.equal(2);
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
        await pressAll(el, ['Space', 'ArrowRight', 'Space']);
        await waitUntil(() => dropping);
        after.focus();
        await announces(el, 'Moved todo card 1 to Doing, 1001 of 1001');
        await untilStable(el, () => items(lists(el)[1])[0]?.textContent);
        expect(focusAt(el)).to.equal('#after');
        expect(box.scrollTop).to.equal(0);
      });
    });

    describe('on a dropzone', () => {
      /** @param {Pinboard} el */
      async function dropOnDelete(el) {
        await pressAll(el, ['Space', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight']);
        await waitUntil(() => liveRegion(el).textContent.startsWith('Delete'));
        await press('Enter');
        await waitUntil(() => liveRegion(el).textContent.startsWith('Moved'));
        await el.updateComplete;
      }

      for (const [what, zone] of [
        ['keeps no cards', {}],
        ['keeps its cards in a closed list', { data: [] }],
        ['keeps its cards in an open list', { data: [], open: true }],
      ]) {
        it(`moves the focus to the next card, else to the previous one, else to the list, when the dropzone ${what}`, async () => {
          const { open, ...deleteZone } = zone;
          const { el } = await focusedBoard({
            dropZones: { success: {}, delete: deleteZone },
          });
          if (open) {
            dropzone(el, 'delete').click();
            await dropzoneSettled(el);
            el.shadowRoot.querySelector('[role="listitem"][tabindex="0"]').focus();
          }
          await press('ArrowDown');
          await dropOnDelete(el);
          expect(focusAt(el), 'the next card').to.equal('Todo:1');
          expect(focusedCard(el).textContent).to.contain('todo card 2');

          await dropOnDelete(el);
          expect(focusAt(el), 'the previous card').to.equal('Todo:0');
          expect(focusedCard(el).textContent).to.contain('todo card 0');

          await dropOnDelete(el);
          expect(focusAt(el)).to.equal('list Todo');
          expect(titles(el)[0]).to.deep.equal([]);
        });
      }

      it('says where the card is in the list of the dropzone', async () => {
        const { el } = await focusedBoard({
          dropZones: { delete: { data: cards('deleted', 2) } },
        });
        await pressAll(el, ['Space', 'ArrowRight', 'ArrowRight', 'ArrowRight']);
        await pressAndHear(el, 'Space', 'Moved todo card 0 to Delete, 3 of 3');
      });
    });

    describe('hooks', () => {
      /**
       * A board whose columns and dropzone have slow hooks, which note when
       * they start and end and what they get.
       */
      async function boardWithHooks() {
        const calls = [];
        const hook = name => async (card, destination, defaultAction) => {
          calls.push(`${name} ${card.id} ${destination} starts`);
          await aTimeout(20);
          defaultAction(card, destination);
          calls.push(`${name} ${card.id} ${destination} ends`);
        };
        const hooks = { onLift: hook('lift'), onDrop: hook('drop') };
        const board = await focusedBoard({
          columns: columns.map(column => ({ ...column, ...hooks })),
          dropZones: { delete: { ...hooks } },
        });
        return { ...board, calls };
      }

      it('runs the lift hook, then the drop hook, with what a drag gives them, and waits for each', async () => {
        const dragged = await boardWithHooks();
        const [todo, doing] = dragged.el.shadowRoot.querySelectorAll('.column');
        const dataTransfer = new DataTransfer();
        todo
          .querySelector('owc-card')
          .dispatchEvent(new DragEvent('dragstart', { dataTransfer, bubbles: true }));
        doing.dispatchEvent(
          new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }),
        );
        await announces(dragged.el, 'Moved todo card 0 to Doing, 3 of 3');

        const { el, calls } = await boardWithHooks();
        await pressAll(el, ['Space', 'ArrowRight']);
        await pressAndHear(el, 'Space', 'Moved todo card 0 to Doing, 3 of 3');
        expect(calls).to.deep.equal([
          'lift todo-0 todo starts',
          'lift todo-0 todo ends',
          'drop todo-0 doing starts',
          'drop todo-0 doing ends',
        ]);
        expect(calls).to.deep.equal(dragged.calls);
        expect(focusAt(el)).to.equal('Doing:2');
      });

      it('leaves the focus where the user put it while the hooks ran', async () => {
        const { el, calls, after } = await boardWithHooks();
        await pressAll(el, ['Space', 'ArrowRight', 'Space']);
        await waitUntil(() => calls.length > 0);
        after.focus();
        await announces(el, 'Moved todo card 0 to Doing, 3 of 3');
        await el.updateComplete;
        expect(focusAt(el)).to.equal('#after');
        expect(await pressAll(el, ['Shift+Tab', 'Shift+Tab'])).to.deep.equal([
          'dropzone Delete',
          'Doing:2',
        ]);
      });

      it('leaves the focus on another card that the user went to while the hooks ran', async () => {
        const { el, calls } = await boardWithHooks();
        await pressAll(el, ['Space', 'ArrowRight', 'Space']);
        await waitUntil(() => calls.length > 0);
        await pressAll(el, ['ArrowRight', 'ArrowRight']);
        expect(focusAt(el)).to.equal('Review:0');
        await announces(el, 'Moved todo card 0 to Doing, 3 of 3');
        await el.updateComplete;
        await aTimeout(50);
        expect(focusAt(el)).to.equal('Review:0');
      });

      it('runs the hooks of a dropzone', async () => {
        const { el, calls } = await boardWithHooks();
        await pressAll(el, ['Space', 'ArrowRight', 'ArrowRight', 'ArrowRight']);
        await pressAndHear(el, 'Enter', 'Moved todo card 0 to Delete');
        expect(calls).to.deep.equal([
          'lift todo-0 todo starts',
          'lift todo-0 todo ends',
          'drop todo-0 delete starts',
          'drop todo-0 delete ends',
        ]);
        expect(titles(el)[0]).to.deep.equal(['todo card 1', 'todo card 2']);
      });
    });
  });
});
