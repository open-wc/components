import { html, expect, nextFrame } from '@open-wc/testing';
import { sendMouse } from '@web/test-runner-commands';
import { deepActiveElement } from '../a11y/controls.js';
import { composedControlTemplates } from '../a11y/controls.test-browser.helpers.js';
import '@open-wc/components/register/de.js';
import { OwcPinboard } from './OwcPinboard.js';
import { scrollTo, untilStable } from '../virtualizer/virtualList.test-browser.helpers.js';
import {
  announces,
  boardFixture,
  cards,
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

customElements.define(
  'test-shadow-button',
  class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).innerHTML = '<button>inner</button>';
    }
  },
);

/** A card with a link, a button and a custom element with a button inside. */
const withControls = {
  body: card =>
    html`<a href="#${card.id}">${card.title}</a> <button id="edit">Edit</button>
      <test-shadow-button></test-shadow-button>`,
};

describe('owc-pinboard semantics', () => {
  it('renders every column as a list that is named by its label, else by its value', async () => {
    const { el } = await boardFixture({
      columns: [{ label: 'Todo', value: 'todo' }, { value: 'doing' }],
      data: [cards('todo', 2), cards('doing', 1)],
    });
    expect(lists(el).map(list => list.getAttribute('aria-label'))).to.deep.equal(['Todo', 'doing']);
  });

  it('renders every card as a list item of its list, with its position and the size of the list', async () => {
    const { el } = await boardFixture();
    const [todo, doing] = lists(el);
    expect(items(todo).map(item => item.parentElement === todo)).to.deep.equal([true, true, true]);
    expect(
      items(todo).map(item => `${item.getAttribute('aria-posinset')}/${item.ariaSetSize}`),
    ).to.deep.equal(['1/3', '2/3', '3/3']);
    expect(
      items(doing).map(item => `${item.getAttribute('aria-posinset')}/${item.ariaSetSize}`),
    ).to.deep.equal(['1/2', '2/2']);
  });

  it('counts the cards that are not rendered in a virtualized column', async () => {
    const { el, box } = await boardFixture({
      data: [cards('todo', 1000), [], []],
      boxStyle: 'height: 400px; overflow: auto',
    });
    const [todo] = lists(el);
    await untilStable(el, () => String(items(todo).length));
    await scrollTo(box, 20000);
    await untilStable(el, () => items(todo)[0]?.textContent);

    const [first] = items(todo);
    expect(first.ariaSetSize).to.equal('1000');
    const position = Number(first.getAttribute('aria-posinset'));
    expect(position).to.be.above(100);
    expect(first.textContent).to.contain(`todo card ${position - 1}`);
    // only the cards are children with a role: a list may contain nothing else
    expect(
      [...todo.children].map(child => child.getAttribute('role')).filter(role => role !== 'none'),
    ).to.deep.equal(items(todo).map(() => 'listitem'));
  });

  it("names a card by cardLabel, and by the card's text without it", async () => {
    const named = await boardFixture({ cardLabel: card => `Task ${card.id}` });
    expect(items(lists(named.el)[1]).map(item => item.getAttribute('aria-label'))).to.deep.equal([
      'Task doing-0',
      'Task doing-1',
    ]);

    const { el } = await boardFixture({
      fieldMapper: { header: card => card.id, body: card => html`<p>${card.title}</p>` },
    });
    // without a label of its own, the item is labelled by the element with the card's content
    const names = items(lists(el)[1]).map(item => {
      expect(item.hasAttribute('aria-label')).to.equal(false);
      const content = el.shadowRoot.getElementById(item.getAttribute('aria-labelledby'));
      expect(item.contains(content)).to.equal(true);
      return content.textContent.replace(/\s+/g, ' ').trim();
    });
    expect(names).to.deep.equal(['doing-0 doing card 0', 'doing-1 doing card 1']);
  });
});

describe('owc-pinboard dropzones', () => {
  it('renders dropzones as buttons that are named in the language of the board', async () => {
    const dropZones = { success: {}, delete: {} };
    const { el } = await boardFixture({ dropZones });
    expect(dropzone(el, 'success').localName).to.equal('button');
    expect(dropzone(el, 'success').getAttribute('aria-label')).to.equal('Done');
    expect(dropzone(el, 'delete').getAttribute('aria-label')).to.equal('Delete');

    const german = await boardFixture({ dropZones, lang: 'de' });
    expect(dropzone(german.el, 'success').getAttribute('aria-label')).to.equal('Erledigt');
    expect(dropzone(german.el, 'delete').getAttribute('aria-label')).to.equal('Löschen');
  });

  it('says nothing about a list on a dropzone that keeps none', async () => {
    const { el } = await boardFixture({ dropZones: { delete: {} } });
    expect(dropzone(el, 'delete').hasAttribute('aria-expanded')).to.equal(false);
    expect(dropzone(el, 'delete').hasAttribute('aria-controls')).to.equal(false);
  });

  it('opens and closes the list of a dropzone with Enter and Space, and says so', async () => {
    const { el } = await boardFixture({
      dropZones: { success: { data: cards('finished', 2) }, delete: {} },
    });
    const button = dropzone(el, 'success');
    const details = el.shadowRoot.querySelector('.success-container wa-details');
    const list = el.shadowRoot.getElementById(button.getAttribute('aria-controls'));
    expect(list.getAttribute('role')).to.equal('list');
    expect(list.getAttribute('aria-label'), 'the list is named like its dropzone').to.equal('Done');
    expect(details.contains(list)).to.equal(true);
    expect(button.getAttribute('aria-expanded')).to.equal('false');

    button.focus();
    await press('Enter');
    await dropzoneSettled(el);
    expect(details.open).to.equal(true);
    expect(button.getAttribute('aria-expanded')).to.equal('true');
    expect(items(list).map(item => item.textContent.trim())).to.deep.equal([
      'finished card 0',
      'finished card 1',
    ]);

    await press('Space');
    await dropzoneSettled(el);
    expect(details.open).to.equal(false);
    expect(button.getAttribute('aria-expanded')).to.equal('false');
  });

  it('keeps aria-expanded right when the list is opened another way', async () => {
    const { el } = await boardFixture({ dropZones: { success: { data: cards('finished', 2) } } });
    el.shadowRoot.querySelector('.success-container wa-details').open = true;
    await dropzoneSettled(el);
    expect(dropzone(el, 'success').getAttribute('aria-expanded')).to.equal('true');
  });

  it('has no axe violations, with a column without cards and with the list of a dropzone closed and open', async () => {
    const { el } = await boardFixture({
      data: [cards('todo', 3), [], cards('review', 2)],
      fieldMapper: withControls,
      dropZones: { success: { data: cards('finished', 2) }, delete: {} },
    });
    await expect(el).to.be.accessible();

    dropzone(el, 'success').click();
    await dropzoneSettled(el);
    await expect(el).to.be.accessible();
  });
});

describe('owc-pinboard card focus', () => {
  describe('one Tab stop', () => {
    it('takes the focus on its first card, and Tab moves on to the dropzones and out', async () => {
      const { el, before, after } = await boardFixture({
        dropZones: { success: { data: cards('finished', 2) }, delete: {} },
      });
      expect(await tabStops(el, before, after)).to.deep.equal([
        'Todo:0',
        'dropzone Done',
        'dropzone Delete',
      ]);
      expect(await tabStops(el, after, before, 'Shift+Tab')).to.deep.equal([
        'dropzone Delete',
        'dropzone Done',
        'Todo:0',
      ]);
    });

    it('starts at the first card of the first column that has cards', async () => {
      const { el, before, after } = await boardFixture({ data: [[], cards('doing', 2), []] });
      expect(await tabStops(el, before, after)).to.deep.equal(['Doing:0']);
    });

    it('has no Tab stop without cards', async () => {
      const { el, before, after } = await boardFixture({ data: [[], [], []] });
      expect(await tabStops(el, before, after)).to.deep.equal([]);
    });

    it('has no control in a card that Tab reaches', async () => {
      const { el, before, after } = await boardFixture({ fieldMapper: withControls });
      expect(await tabStops(el, before, after)).to.deep.equal(['Todo:0']);
      expect(await tabStops(el, after, before, 'Shift+Tab')).to.deep.equal(['Todo:0']);
    });
  });

  describe('navigation', () => {
    it('moves between the cards of a column with ↑ and ↓, and to its ends with Home and End', async () => {
      const { el } = await focusedBoard();
      expect(
        await pressAll(el, [
          'ArrowDown',
          'ArrowDown',
          'ArrowDown',
          'ArrowUp',
          'Home',
          'ArrowUp',
          'End',
          'Home',
        ]),
      ).to.deep.equal([
        'Todo:1',
        'Todo:2',
        'Todo:2',
        'Todo:1',
        'Todo:0',
        'Todo:0',
        'Todo:2',
        'Todo:0',
      ]);
    });

    it('moves to the card at the nearest position of the neighbouring column with ← and →', async () => {
      const { el } = await focusedBoard();
      expect(
        await pressAll(el, [
          'End',
          'ArrowRight',
          'ArrowRight',
          'ArrowRight',
          'End',
          'ArrowLeft',
          'ArrowLeft',
          'ArrowLeft',
        ]),
      ).to.deep.equal([
        'Todo:2',
        'Doing:1',
        'Review:1',
        'Review:1',
        'Review:3',
        'Doing:1',
        'Todo:1',
        'Todo:1',
      ]);
    });

    it('skips columns without cards', async () => {
      const { el } = await focusedBoard({ data: [cards('todo', 2), [], cards('review', 2)] });
      expect(await pressAll(el, ['ArrowDown', 'ArrowRight', 'ArrowLeft'])).to.deep.equal([
        'Todo:1',
        'Review:1',
        'Todo:1',
      ]);
    });

    it('treats every open dropzone list as one more column after the last one', async () => {
      const { el } = await focusedBoard({
        dropZones: {
          success: { data: cards('finished', 2) },
          delete: { data: cards('deleted', 1) },
        },
      });
      expect(
        await pressAll(el, ['ArrowRight', 'ArrowRight', 'ArrowRight']),
        'both lists closed',
      ).to.deep.equal(['Doing:0', 'Review:0', 'Review:0']);

      dropzone(el, 'delete').click();
      await dropzoneSettled(el);
      el.shadowRoot.querySelector('[role="listitem"][tabindex="0"]').focus();
      expect(
        await pressAll(el, ['ArrowDown', 'ArrowRight', 'ArrowRight']),
        'the list of the second dropzone open',
      ).to.deep.equal(['Review:1', 'Delete:0', 'Delete:0']);

      dropzone(el, 'success').click();
      await dropzoneSettled(el);
      el.shadowRoot.querySelector('[role="listitem"][tabindex="0"]').focus();
      expect(
        await pressAll(el, ['ArrowLeft', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowRight']),
        'both lists open',
      ).to.deep.equal(['Done:0', 'Done:1', 'Review:1', 'Done:1', 'Delete:0']);
    });

    describe('in columns that render only part of their cards', function () {
      this.timeout(10000);

      /** A board with two columns of 1000 cards in a 400px scroll box, with the focus on its first card. */
      async function largeBoard() {
        const board = await focusedBoard({
          data: [cards('todo', 1000), cards('doing', 1000), cards('review', 2)],
          boxStyle: 'height: 400px; overflow: auto',
        });
        await untilStable(board.el, () => String(items(lists(board.el)[0]).length));
        return board;
      }

      it('brings in the cards that End, Home and the arrow keys move to', async () => {
        const { el, box } = await largeBoard();
        expect(lists(el)[0].textContent).to.not.contain('todo card 999');

        await press('End');
        await focusArrivesAt(el, 'Todo:999');
        expect(focusedCard(el).textContent).to.contain('todo card 999');
        expect(isInView(focusedCard(el), box)).to.equal(true);

        await press('ArrowUp');
        await focusArrivesAt(el, 'Todo:998');
        await press('Home');
        await focusArrivesAt(el, 'Todo:0');
        expect(isInView(focusedCard(el), box)).to.equal(true);

        for (let index = 1; index <= 40; index++) {
          await press('ArrowDown');
          await focusArrivesAt(el, `Todo:${index}`);
        }
        expect(focusedCard(el).textContent).to.contain('todo card 40');
        expect(isInView(focusedCard(el), box)).to.equal(true);
      });

      it('goes on from the card that is on its way when keys come faster than it', async () => {
        const { el } = await largeBoard();
        await press('End');
        await press('ArrowUp');
        await press('ArrowUp');
        await focusArrivesAt(el, 'Todo:997');
        await press('Home');
        await press('ArrowDown');
        await press('ArrowRight');
        await focusArrivesAt(el, 'Doing:1');
      });

      it('moves between two columns of 1000 cards, and to a short one', async () => {
        const { el, box } = await largeBoard();
        await press('End');
        await focusArrivesAt(el, 'Todo:999');
        await press('ArrowRight');
        await focusArrivesAt(el, 'Doing:999');
        await press('ArrowUp');
        await focusArrivesAt(el, 'Doing:998');
        await press('ArrowLeft');
        await focusArrivesAt(el, 'Todo:998');
        await press('ArrowRight');
        await focusArrivesAt(el, 'Doing:998');
        await press('ArrowRight');
        await focusArrivesAt(el, 'Review:1');
        expect(isInView(focusedCard(el), box)).to.equal(true);
        await press('ArrowLeft');
        await focusArrivesAt(el, 'Doing:1');
      });

      it('never leaves the focused card under the sticky header of its column', async () => {
        const { el, box } = await largeBoard();
        const header = el.shadowRoot.querySelector('.column-header-cell');
        await press('End');
        await focusArrivesAt(el, 'Todo:999');
        for (let index = 998; index >= 985; index--) {
          await press('ArrowUp');
          await focusArrivesAt(el, `Todo:${index}`);
          expect(
            isInView(focusedCard(el), box, header.getBoundingClientRect().bottom),
            `todo card ${index} is below the header`,
          ).to.equal(true);
        }
      });
    });

    it('reaches the cards of a dropzone list that renders only part of its cards', async function () {
      this.timeout(10000);
      const { el } = await focusedBoard({
        dropZones: { success: { data: cards('finished', 500) } },
      });
      dropzone(el, 'success').click();
      await dropzoneSettled(el);
      const details = el.shadowRoot.querySelector('wa-details');
      el.shadowRoot.querySelector('[role="listitem"][tabindex="0"]').focus();

      expect(await pressAll(el, ['ArrowRight', 'ArrowRight', 'ArrowRight'])).to.deep.equal([
        'Doing:0',
        'Review:0',
        'Done:0',
      ]);
      await press('End');
      await focusArrivesAt(el, 'Done:499');
      expect(focusedCard(el).textContent).to.contain('finished card 499');
      expect(isInView(focusedCard(el), details)).to.equal(true);
      await press('ArrowLeft');
      await focusArrivesAt(el, 'Review:3');
    });

    it('goes on from a card that was clicked', async () => {
      const { el } = await focusedBoard();
      const rect = items(lists(el)[1])[1].getBoundingClientRect();
      await sendMouse({
        type: 'click',
        position: [Math.round(rect.x + rect.width / 2), Math.round(rect.y + rect.height / 2)],
      });
      expect(focusAt(el)).to.equal('Doing:1');
      expect(await pressAll(el, ['ArrowUp', 'ArrowLeft'])).to.deep.equal(['Doing:0', 'Todo:0']);
    });

    it('leaves the keys of the dropzones alone', async () => {
      const { el } = await focusedBoard({ dropZones: { delete: {} } });
      await press('Tab');
      expect(await pressAll(el, ['ArrowLeft', 'ArrowUp', 'Home'])).to.deep.equal([
        'dropzone Delete',
        'dropzone Delete',
        'dropzone Delete',
      ]);
    });
  });

  describe('interaction mode', () => {
    for (const [name, content] of Object.entries(composedControlTemplates)) {
      it(`cycles through shadow controls and ${name}, then leaves the card with Escape`, async () => {
        const { el, before, after } = await focusedBoard({
          columns: [{ label: 'Todo', value: 'todo' }],
          data: [cards('todo', 1)],
          fieldMapper: { body: () => content },
        });
        expect(focusAt(el)).to.equal('Todo:0');
        await press('Enter');
        expect(deepActiveElement().id).to.equal('shadow-first');
        const stops = [];
        for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
          await press(key);
          stops.push(deepActiveElement().id);
        }
        expect(stops).to.deep.equal([
          'slotted-input',
          'shadow-last',
          'shadow-first',
          'shadow-last',
          'slotted-input',
          'shadow-first',
        ]);
        await press('Escape');
        expect(focusAt(el)).to.equal('Todo:0');
        await press('F2');
        expect(deepActiveElement().id).to.equal('shadow-first');
        await press('Escape');
        await press('Tab');
        expect(document.activeElement === after).to.be.true;
        await press('Shift+Tab');
        await press('Shift+Tab');
        expect(document.activeElement === before).to.be.true;
      });
    }

    it('enters the controls of a card with Enter or F2, says how to leave, and Escape returns', async () => {
      const { el } = await focusedBoard({ fieldMapper: withControls });
      await press('Enter');
      expect(focusAt(el)).to.equal('Todo:0 a');
      await announces(el, 'Press Escape to return to the card');

      await press('Escape');
      expect(focusAt(el)).to.equal('Todo:0');

      expect(await pressAll(el, ['ArrowDown', 'F2'])).to.deep.equal(['Todo:1', 'Todo:1 a']);
      await press('Escape');
      expect(await pressAll(el, ['Tab'])).to.deep.equal(['#after']);
    });

    it('says how to leave in the language of the board', async () => {
      const { el } = await focusedBoard({ fieldMapper: withControls, lang: 'de' });
      await press('Enter');
      await announces(el, 'Escape drücken, um zur Karte zurückzukehren');
    });

    it('cycles through the controls of the card and its Move to… button with Tab and Shift+Tab', async () => {
      const { el } = await focusedBoard({ fieldMapper: withControls });
      await press('Enter');
      expect(
        await pressAll(el, ['Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']),
      ).to.deep.equal([
        'Todo:0 #edit',
        'Todo:0 button',
        'Todo:0 menu button',
        'Todo:0 a',
        'Todo:0 menu button',
        'Todo:0 button',
        'Todo:0 #edit',
      ]);
    });

    it('leaves every other key to the controls', async () => {
      const { el } = await focusedBoard({ fieldMapper: withControls });
      await press('Enter');
      await press('Tab');
      expect(await pressAll(el, ['ArrowDown', 'ArrowRight', 'End', 'F2'])).to.deep.equal([
        'Todo:0 #edit',
        'Todo:0 #edit',
        'Todo:0 #edit',
        'Todo:0 #edit',
      ]);
    });

    it('is entered by focusing a control another way too', async () => {
      const { el } = await focusedBoard({ fieldMapper: withControls });
      el.shadowRoot.querySelectorAll('#edit')[1].focus();
      expect(focusAt(el)).to.equal('Todo:1 #edit');
      await announces(el, 'Press Escape to return to the card');
      expect(await pressAll(el, ['Tab', 'Escape', 'ArrowUp'])).to.deep.equal([
        'Todo:1 button',
        'Todo:1',
        'Todo:0',
      ]);
    });

    it('is not entered on a card without controls, on a board where it has nowhere to move to', async () => {
      const { el } = await focusedBoard({
        columns: [{ label: 'Todo', value: 'todo' }],
        data: [cards('todo', 3)],
      });
      expect(await pressAll(el, ['Enter', 'F2'])).to.deep.equal(['Todo:0', 'Todo:0']);
      await nextFrame();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(liveRegion(el).textContent).to.equal('');
    });
  });

  describe('remembered focus', () => {
    /** A board with two columns of 1000 cards in a 400px scroll box, with the focus on `Todo:2`. */
    async function largeBoard() {
      const board = await focusedBoard({
        data: [cards('todo', 1000), cards('doing', 1000), cards('review', 2)],
        boxStyle: 'height: 400px; overflow: auto',
      });
      const { el } = board;
      await untilStable(el, () => String(items(lists(el)[0]).length));
      expect(await pressAll(el, ['ArrowDown', 'ArrowDown'])).to.deep.equal(['Todo:1', 'Todo:2']);
      return board;
    }

    /**
     * Scrolls the box of a large board, and waits for its lists to follow.
     *
     * @param {Pinboard} el
     * @param {HTMLElement} box
     * @param {number} top
     */
    async function scrollBoard(el, box, top) {
      await scrollTo(box, top);
      await untilStable(el, () => items(lists(el)[0])[0]?.textContent);
    }

    it('comes back to the last focused card with Tab and Shift+Tab', async () => {
      const { el, before, after } = await focusedBoard({ dropZones: { delete: {} } });
      await pressAll(el, ['ArrowDown', 'ArrowRight']);
      expect(await pressAll(el, ['Shift+Tab', 'Tab', 'Tab', 'Tab'])).to.deep.equal([
        '#before',
        'Doing:1',
        'dropzone Delete',
        '#after',
      ]);
      el.requestUpdate();
      await el.updateComplete;
      expect(await tabStops(el, after, before, 'Shift+Tab')).to.deep.equal([
        'dropzone Delete',
        'Doing:1',
      ]);
    });

    it('parks the focus on the list when the focused card scrolls out of the rendered cards', async () => {
      const { el, box } = await largeBoard();
      await scrollBoard(el, box, 30000);
      expect(lists(el)[0].textContent).to.not.contain('todo card 2 ');
      expect(focusAt(el)).to.equal('list Todo');
      expect(box.scrollTop, 'parking does not scroll back to the card').to.be.above(20000);
      expect(liveRegion(el).textContent, 'parking says nothing').to.equal('');
    });

    it('brings the card back with the next navigation key', async () => {
      const { el, box } = await largeBoard();
      await scrollBoard(el, box, 30000);
      await press('ArrowUp');
      await focusArrivesAt(el, 'Todo:2');
      expect(focusedCard(el).textContent).to.contain('todo card 2');
      expect(isInView(focusedCard(el), box)).to.equal(true);
      expect(await pressAll(el, ['ArrowUp'])).to.deep.equal(['Todo:1']);
    });

    it('brings the card back when the focus comes back with Tab', async () => {
      const { el, box, after } = await largeBoard();
      await scrollBoard(el, box, 30000);
      expect(await pressAll(el, ['Tab'])).to.deep.equal(['#after']);
      await press('Shift+Tab');
      await focusArrivesAt(el, 'Todo:2');
      expect(isInView(focusedCard(el), box)).to.equal(true);

      // also when the card left the rendered cards while the focus was elsewhere
      after.focus();
      await scrollBoard(el, box, 30000);
      expect(focusAt(el)).to.equal('#after');
      await press('Shift+Tab');
      await focusArrivesAt(el, 'Todo:2');
      expect(isInView(focusedCard(el), box)).to.equal(true);
    });

    it('stays on a card that is replaced by a new object with the same getCardId', async () => {
      const { el } = await focusedBoard({ getCardId: card => card.id });
      await pressAll(el, ['ArrowDown']);
      // every card is a new object, and the focused one moved to the end of its list
      const [first, focused, last] = cards('todo', 3);
      el.data = [[first, last, focused], cards('doing', 2), cards('review', 4)];
      await el.updateComplete;
      expect(focusAt(el)).to.equal('Todo:2');
      expect(focusedCard(el).textContent).to.contain('todo card 1');
    });

    it('follows a card with a getCardId to another column', async () => {
      const { el } = await focusedBoard({ getCardId: card => card.id });
      await pressAll(el, ['ArrowDown']);
      const [first, focused, last] = cards('todo', 3);
      el.data = [[first, last], [...cards('doing', 2), focused], cards('review', 4)];
      await el.updateComplete;
      expect(focusAt(el)).to.equal('Doing:2');
      expect(focusedCard(el).textContent).to.contain('todo card 1');
    });

    it('moves to the card at the same position when the focused card is gone', async () => {
      const { el } = await focusedBoard();
      await pressAll(el, ['ArrowDown']);
      const [first, , last] = el.data[0];

      el.data = [[first, last], el.data[1], el.data[2]];
      await el.updateComplete;
      expect(focusAt(el), 'the next card took its place').to.equal('Todo:1');
      expect(focusedCard(el).textContent).to.contain('todo card 2');

      el.data = [[first], el.data[1], el.data[2]];
      await el.updateComplete;
      expect(focusAt(el), 'the last card of the list').to.equal('Todo:0');

      el.data = [[], el.data[1], el.data[2]];
      await el.updateComplete;
      expect(focusAt(el), 'the list without cards').to.equal('list Todo');
      expect(liveRegion(el).textContent).to.equal('');
    });

    it('moves on from a list without cards with ← and →, and leaves it with Tab', async () => {
      const { el, before, after } = await focusedBoard({
        data: [cards('todo', 2), cards('doing', 1), cards('review', 2)],
      });
      await pressAll(el, ['ArrowRight']);
      el.data = [el.data[0], [], el.data[2]];
      await el.updateComplete;
      expect(focusAt(el)).to.equal('list Doing');
      expect(await pressAll(el, ['ArrowDown', 'ArrowRight'])).to.deep.equal([
        'list Doing',
        'Review:0',
      ]);

      el.data = [el.data[0], [], []];
      await el.updateComplete;
      expect(focusAt(el)).to.equal('list Review');
      expect(await pressAll(el, ['Tab'])).to.deep.equal(['#after']);
      expect(await tabStops(el, after, before, 'Shift+Tab')).to.deep.equal(['Todo:0']);
    });

    it('takes cards that are replaced by new objects for other cards without getCardId', async () => {
      const { el } = await focusedBoard();
      await pressAll(el, ['End']);
      el.data = [cards('todo', 2), cards('doing', 2), cards('review', 4)];
      await el.updateComplete;
      expect(focusAt(el), 'the last card, as there is none at the same position').to.equal(
        'Todo:1',
      );
    });

    describe('never steals the focus', () => {
      it('when the focused card scrolls out while the focus is elsewhere', async () => {
        const { el, box, after } = await largeBoard();
        after.focus();
        await scrollBoard(el, box, 30000);
        expect(focusAt(el)).to.equal('#after');
      });

      it('when a card is removed while the focus is elsewhere', async () => {
        const { el, before, after } = await focusedBoard();
        await pressAll(el, ['End']);
        after.focus();
        el.data = [el.data[0].slice(0, 2), el.data[1], el.data[2]];
        await el.updateComplete;
        expect(focusAt(el)).to.equal('#after');
        expect(await tabStops(el, before, after), 'Tab comes back to its place').to.deep.equal([
          'Todo:1',
        ]);
      });

      it('when the focus leaves while a card is brought in', async () => {
        const { el, after } = await largeBoard();
        await press('End');
        after.focus();
        await untilStable(el, () => items(lists(el)[0])[0]?.textContent);
        expect(lists(el)[0].textContent).to.contain('todo card 999');
        expect(focusAt(el)).to.equal('#after');
      });
    });
  });

  describe('visible focus', () => {
    /** @param {Element} element */
    function outlineOf(element) {
      const { outlineStyle, outlineWidth, outlineColor } = getComputedStyle(element);
      return outlineStyle === 'none' ? 'none' : `${outlineStyle} ${outlineWidth} ${outlineColor}`;
    }

    it("shows the theme's focus ring on the focused card and on a focused dropzone", async () => {
      const { el } = await boardFixture({ dropZones: { delete: {} } });
      el.style.setProperty('--wa-focus-ring', 'solid 3px rgb(0, 0, 255)');
      const [first, second] = [...el.shadowRoot.querySelectorAll('owc-card')];
      expect(outlineOf(first)).to.equal('none');

      el.parentElement.previousElementSibling.focus();
      await press('Tab');
      expect(outlineOf(first)).to.equal('solid 3px rgb(0, 0, 255)');
      expect(outlineOf(second)).to.equal('none');

      await press('ArrowDown');
      expect(outlineOf(first)).to.equal('none');
      expect(outlineOf(second)).to.equal('solid 3px rgb(0, 0, 255)');

      expect(outlineOf(dropzone(el, 'delete'))).to.equal('none');
      await press('Tab');
      expect(outlineOf(second)).to.equal('none');
      expect(outlineOf(dropzone(el, 'delete'))).to.equal('solid 3px rgb(0, 0, 255)');
    });

    it('shows a focus ring without a theme too', async () => {
      const { el } = await focusedBoard({ dropZones: { delete: {} } });
      expect(outlineOf(focusedCard(el))).to.not.equal('none');
      await press('Tab');
      expect(outlineOf(dropzone(el, 'delete'))).to.not.equal('none');
    });

    it('shows a focus ring on a list that holds the focus', async () => {
      const { el } = await focusedBoard({ data: [cards('todo', 1), [], []] });
      el.style.setProperty('--wa-focus-ring', 'solid 3px rgb(0, 0, 255)');
      el.data = [[], [], []];
      await el.updateComplete;
      expect(focusAt(el)).to.equal('list Todo');
      expect(outlineOf(lists(el)[0])).to.equal('solid 3px rgb(0, 0, 255)');
    });
  });
});
