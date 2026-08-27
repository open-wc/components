import { fixture, html, expect, aTimeout, waitUntil } from '@open-wc/testing';
import { setupIgnoreWindowResizeObserverLoopErrors } from '@lit-labs/virtualizer/support/resize-observer-errors.js';
import { OwcPinboard } from './OwcPinboard.js';

customElements.define('owc-pinboard', OwcPinboard);

setupIgnoreWindowResizeObserverLoopErrors(beforeEach, afterEach);

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
      .keyFunction=${row => row.id}
      .fieldMapper=${{ body: row => row.title, ...overrides.fieldMapper }}
      .dropZones=${overrides.dropZones ?? {}}
      .canDrop=${overrides.canDrop ?? (() => true)}
    ></owc-pinboard>`,
  );
  // the virtualizer renders asynchronously, slower under parallel test load
  await waitUntil(() => el.shadowRoot.querySelector('.column owc-card'), 'cards never rendered', {
    timeout: 4000,
  });
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
    await waitUntil(() => columnEls(el)[0]?.querySelector('owc-card'), 'cards never re-rendered', {
      timeout: 4000,
    });

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
