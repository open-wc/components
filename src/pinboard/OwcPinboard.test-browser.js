import { fixture, html, expect, aTimeout } from '@open-wc/testing';
import { OwcPinboard } from './OwcPinboard.js';
import {
  expectItemsCover,
  scrollTo,
  untilStable,
} from '../virtualizer/virtualList.test-browser.helpers.js';

customElements.define('owc-pinboard', OwcPinboard);

let originalConsoleError;
beforeEach(() => {
  // eslint-disable-next-line no-console
  originalConsoleError = console.error;
  // eslint-disable-next-line no-console
  console.error = (...args) => {
    if (args.length !== 1 || args[0] !== null) {
      originalConsoleError(...args);
    }
  };
});
afterEach(() => {
  // eslint-disable-next-line no-console
  console.error = originalConsoleError;
});

const columns = [
  { label: 'Todo', value: 'todo' },
  { label: 'Done', value: 'done' },
];

const testImage = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

/**
 * @param {object} [overrides]
 */
async function pinboardFixture(overrides = {}) {
  const el = await fixture(
    html`<owc-pinboard
      .columns=${columns}
      .data=${[[{ id: 'a', title: 'Task A' }], [{ id: 'b', title: 'Task B' }]]}
      .fieldMapper=${{ body: row => row.title, ...overrides.fieldMapper }}
      .dropZones=${overrides.dropZones ?? {}}
      .canDrop=${overrides.canDrop ?? (() => true)}
    ></owc-pinboard>`,
  );
  await el.updateComplete;
  return el;
}

/**
 * @param {OwcPinboard} el
 */
function columnEls(el) {
  return [...el.shadowRoot.querySelectorAll('.column-container .column')];
}

describe('owc-pinboard', () => {
  it('renders a column per config with its cards', async () => {
    const el = await pinboardFixture();
    const cols = columnEls(el);
    expect(cols.length).to.equal(2);
    expect(cols[0].querySelector('.column-header-cell').textContent).to.equal('Todo');
    expect(cols[0].textContent).to.contain('Task A');
    expect(cols[1].textContent).to.contain('Task B');
  });

  it('renders card images into the media slot (regression)', async () => {
    const el = await pinboardFixture({
      fieldMapper: {
        body: row => row.title,
        image: { src: () => testImage, alt: row => row.title },
      },
    });
    const img = el.shadowRoot.querySelector('owc-card img');
    // it was slotted as "image", which owc-card does not have
    expect(img.getAttribute('slot')).to.equal('media');
  });

  it('renders configured drop zones', async () => {
    const el = await pinboardFixture({
      dropZones: { delete: { onDrop: () => {} }, success: { onDrop: () => {} } },
    });
    expect(el.shadowRoot.querySelector('.dropzone.delete')).to.exist;
    expect(el.shadowRoot.querySelector('.dropzone.success')).to.exist;
  });

  it('moves a card between columns via drag & drop callbacks', async () => {
    const dropped = [];
    const lifted = [];
    const el = await pinboardFixture();
    el.columns = [
      {
        label: 'Todo',
        value: 'todo',
        onDrop: (data, col) => dropped.push([data.id, col]),
        onLift: (data, col) => lifted.push([data.id, col]),
      },
      {
        label: 'Done',
        value: 'done',
        onDrop: (data, col) => dropped.push([data.id, col]),
        onLift: (data, col) => lifted.push([data.id, col]),
      },
    ];
    await el.updateComplete;

    const [todoCol, doneCol] = columnEls(el);
    const card = todoCol.querySelector('owc-card');
    const dataTransfer = new DataTransfer();

    card.dispatchEvent(new DragEvent('dragstart', { dataTransfer, bubbles: true }));
    doneCol.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }));
    await aTimeout(0);

    expect(lifted).to.deep.equal([['a', 'todo']]);
    expect(dropped).to.deep.equal([['a', 'done']]);
  });

  it('marks columns that reject the dragged card', async () => {
    const el = await pinboardFixture({
      canDrop: (data, column) => column !== 'done',
    });
    const [todoCol, doneCol] = columnEls(el);
    const card = todoCol.querySelector('owc-card');

    card.dispatchEvent(
      new DragEvent('dragstart', { dataTransfer: new DataTransfer(), bubbles: true }),
    );
    await aTimeout(0);
    expect(doneCol.classList.contains('cannot-drop')).to.equal(true);
    expect(todoCol.classList.contains('cannot-drop')).to.equal(false);

    card.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true }));
    await aTimeout(0);
    expect(doneCol.classList.contains('cannot-drop')).to.equal(false);
  });
});

/**
 * @param {string} prefix
 * @param {number} count
 */
function cards(prefix, count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    title: `${prefix} card ${index}`,
  }));
}

/**
 * @param {Element} list a column, or anything else that holds one list of cards
 */
function renderedCards(list) {
  return [...list.querySelectorAll('.column-item')];
}

/**
 * The element that holds a virtualized list, spacers included.
 *
 * @param {Element} column
 */
function listOf(column) {
  return column.querySelector('.virtualizer-spacer').parentElement;
}

/**
 * @param {Element} list
 */
function renderedIds(list) {
  return renderedCards(list)
    .map(item => item.querySelector('owc-card').data.id)
    .join();
}

describe('owc-pinboard virtualization', () => {
  /**
   * A board in a 400px scroll box.
   *
   * @param {object} options
   * @param {object[][]} options.data
   * @param {object} [options.dropZones]
   * @param {string} [options.virtualizerMode]
   */
  async function boardFixture({ data, dropZones = {}, virtualizerMode = 'auto' }) {
    const box = await fixture(html`
      <div style="height: 400px; overflow: auto">
        <owc-pinboard
          .columns=${columns}
          .data=${data}
          .fieldMapper=${{ body: row => row.title }}
          .dropZones=${dropZones}
          virtualizer-mode=${virtualizerMode}
        ></owc-pinboard>
      </div>
    `);
    const el = /** @type {OwcPinboard} */ (box.querySelector('owc-pinboard'));
    await el.updateComplete;
    return { box, el };
  }

  it('renders every card of a column below 300 cards', async () => {
    const { el } = await boardFixture({ data: [cards('todo', 299), cards('done', 2)] });
    const [todoCol] = columnEls(el);
    expect(renderedCards(todoCol).length).to.equal(299);
    expect(el.shadowRoot.querySelector('.virtualizer-spacer')).to.equal(null);
  });

  it('renders every card with virtualizer-mode="never"', async () => {
    const { el } = await boardFixture({
      data: [cards('todo', 1000), cards('done', 2)],
      virtualizerMode: 'never',
    });
    expect(renderedCards(columnEls(el)[0]).length).to.equal(1000);
  });

  it('renders only the cards around the visible area of a large column', async () => {
    const { box, el } = await boardFixture({ data: [cards('todo', 1000), cards('done', 2)] });
    const [todoCol, doneCol] = columnEls(el);
    const list = listOf(todoCol);
    await untilStable(el, () => renderedIds(list));

    expect(renderedCards(todoCol).length).to.be.within(1, 100);
    expect(renderedCards(doneCol).length, 'small columns render every card').to.equal(2);
    expectItemsCover(box, list, renderedCards(list));
  });

  it('keeps the visible area of a large column covered while scrolling', async () => {
    const { box, el } = await boardFixture({ data: [cards('todo', 1000), cards('done', 2)] });
    const list = listOf(columnEls(el)[0]);
    await untilStable(el, () => renderedIds(list));

    for (const top of [5000, 40000, box.scrollHeight, 1200]) {
      await scrollTo(box, top);
      await untilStable(el, () => renderedIds(list));
      expectItemsCover(box, list, renderedCards(list));
    }
    await scrollTo(box, box.scrollHeight);
    await untilStable(el, () => renderedIds(list));
    expect(renderedIds(list)).to.contain('todo-999');
  });

  it('moves a card out of a virtualized column', async () => {
    const todo = cards('todo', 1000);
    const { el } = await boardFixture({ data: [todo, cards('done', 2)] });
    const [todoCol, doneCol] = columnEls(el);
    const card = todoCol.querySelector('owc-card');
    expect(card.data.id).to.equal('todo-0');

    const dataTransfer = new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart', { dataTransfer, bubbles: true }));
    doneCol.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true }));
    await aTimeout(0);
    await el.updateComplete;

    expect(el.data[0].length).to.equal(999);
    expect(renderedIds(listOf(todoCol))).to.not.contain('todo-0,');
    expect(renderedIds(doneCol)).to.equal('done-0,done-1,todo-0');
  });

  it('virtualizes a large dropzone list inside its details', async () => {
    const { el } = await boardFixture({
      data: [cards('todo', 2), cards('done', 2)],
      dropZones: { success: { onDrop: () => {}, data: cards('success', 500), liftable: true } },
    });
    const details = el.shadowRoot.querySelector('.success-container .dropzone-details');
    details.open = true;
    const list = listOf(details.querySelector('.column'));
    await untilStable(el, () => renderedIds(list), { animations: true });

    expect(renderedCards(list).length).to.be.within(1, 100);
    expectItemsCover(details, list, renderedCards(list));

    await scrollTo(details, 20000);
    await untilStable(el, () => renderedIds(list));
    expectItemsCover(details, list, renderedCards(list));
  });
});
