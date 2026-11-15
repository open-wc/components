import { expect, html, waitUntil } from '@open-wc/testing';
import { OwcPinboard } from './OwcPinboard.js';
import { deepActiveElement } from '../a11y/controls.js';
import { expectAccessible } from '../a11y/axe.test-browser.helpers.js';
import {
  boardFixture,
  cards,
  dropzone,
  dropzoneSettled,
  focusAt,
  focusedBoard,
  press,
} from './OwcPinboard.test-browser.helpers.js';

customElements.define('owc-pinboard', OwcPinboard);

// axe over every configuration of the pinboard that the keyboard accessibility
// spec lists (C2): by default, with dropzones and their lists open, during
// pick-up and with the Move to… menu open. `expectAccessible` ignores only
// findings in Web Awesome's markup, each with its reason.

/** Cards with a link and a button, as card templates may have. */
const withControls = {
  header: (/** @type {any} */ card) => card.title,
  body: (/** @type {any} */ card) =>
    html`<a href="#${card.id}">Open</a> <button>Assign ${card.title}</button>`,
};

const dropZones = () => ({
  success: { data: cards('finished', 2), liftable: true },
  delete: { data: cards('deleted', 1) },
});

describe('owc-pinboard passes axe', () => {
  it('by default', async () => {
    const { el } = await boardFixture();
    await expectAccessible(el);
  });

  it('with controls in its cards and a column without cards', async () => {
    const { el } = await boardFixture({
      data: [cards('todo', 3), [], cards('review', 2)],
      fieldMapper: withControls,
    });
    await expectAccessible(el);
  });

  it('with dropzones, closed and with their lists open', async () => {
    const { el } = await boardFixture({ dropZones: dropZones() });
    await expectAccessible(el);

    dropzone(el, 'success').click();
    dropzone(el, 'delete').click();
    await dropzoneSettled(el);
    expect(dropzone(el, 'success').getAttribute('aria-expanded')).to.equal('true');
    expect(dropzone(el, 'delete').getAttribute('aria-expanded')).to.equal('true');
    await expectAccessible(el);
  });

  it('with a column of 1000 cards, which renders only some of them', async () => {
    const { el } = await boardFixture({
      data: [cards('todo', 1000), cards('doing', 2), []],
      boxStyle: 'height: 400px; overflow: auto',
    });
    await expectAccessible(el);
  });

  it('during pick-up, over a column that can take the card, one that can not, and a dropzone', async () => {
    const { el } = await focusedBoard({
      dropZones: dropZones(),
      canDrop: (card, column) => column !== 'review',
    });
    await press('Space');
    expect(el.shadowRoot.querySelectorAll('.cannot-drop')).to.have.length(1);
    await expectAccessible(el);
    await press('ArrowRight');
    await expectAccessible(el);
    await press('ArrowRight');
    await expectAccessible(el);
    await press('ArrowRight');
    expect(el.shadowRoot.querySelector('.dropzone.drop-hover')).to.exist;
    await expectAccessible(el);
    expect(focusAt(el)).to.equal('Todo:0');
  });

  it('with the Move to… menu open', async () => {
    const { el } = await focusedBoard({
      dropZones: dropZones(),
      canDrop: (card, column) => column !== 'review',
    });
    await press('Shift+F10');
    await waitUntil(
      () => deepActiveElement()?.getAttribute('role') === 'menuitem',
      'the menu did not open',
      { timeout: 1500 },
    );
    await expectAccessible(el);
  });
});
