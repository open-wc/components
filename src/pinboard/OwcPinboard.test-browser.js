import { fixture, html, expect, aTimeout, waitUntil } from '@open-wc/testing';
import { OwcPinboard } from './OwcPinboard.js';

customElements.define('owc-pinboard', OwcPinboard);

// The virtualizer's ResizeObserver occasionally reports this benign browser
// limitation; without suppression the runner counts it as an uncaught error.
window.addEventListener('error', ev => {
  if (ev.message?.includes('ResizeObserver loop completed')) {
    ev.stopImmediatePropagation();
    ev.preventDefault();
  }
});

const columns = [
  { label: 'Todo', value: 'todo' },
  { label: 'Done', value: 'done' },
];

/**
 * @param {object} [overrides]
 */
async function pinboardFixture(overrides = {}) {
  const el = await fixture(
    html`<owc-pinboard
      .columns=${columns}
      .data=${overrides.data ?? [[{ id: 'a', title: 'Task A' }], [{ id: 'b', title: 'Task B' }]]}
      .keyFunction=${row => row.id}
      .sorter=${overrides.sorter ?? (() => 0)}
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

const manyCards = (prefix, count = 60) =>
  Array.from({ length: count }, (_, index) => ({ id: `${prefix}-${index}`, title: `${prefix} ${index}` }));

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
        image: { src: () => '/img.png', alt: row => row.title },
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

  it('uses bounded virtual DOM only for large columns', async () => {
    const el = await pinboardFixture({ data: [manyCards('todo'), [{ id: 'small', title: 'Small' }]] });
    await waitUntil(
      () => columnEls(el)[0]?.querySelector('.virtual-list'),
      'large column never virtualized',
    );
    expect(columnEls(el)[0].querySelectorAll('owc-card').length).to.be.lessThan(60);
    expect(columnEls(el)[1].querySelector('.virtual-list')).not.to.exist;
    expect(columnEls(el)[1].querySelectorAll('owc-card').length).to.equal(1);
  });

  it('keeps large columns and populated drop-zone lists independent', async () => {
    const el = await pinboardFixture({
      data: [manyCards('todo'), manyCards('done')],
      dropZones: { delete: { onDrop: () => {}, data: manyCards('deleted') } },
    });
    await waitUntil(
      () => el.shadowRoot.querySelectorAll('.virtual-list').length === 3,
      'independent lists never rendered',
    );
    el.data = [manyCards('todo', 61), manyCards('done', 61)];
    await el.updateComplete;
    expect(el.shadowRoot.querySelectorAll('.virtual-list').length).to.equal(3);
  });

  it('sorts before rendering cards with stable virtual keys', async () => {
    const el = await pinboardFixture({
      data: [[...manyCards('card')].reverse(), []],
      sorter: (a, b) => a.id.localeCompare(b.id),
    });
    await waitUntil(() => columnEls(el)[0]?.querySelector('.virtual-item'), 'items never rendered');
    const firstCard = columnEls(el)[0].querySelector('owc-card');
    expect(firstCard.data.id).to.equal('card-0');
  });

  it('remeasures cards whose height changes without reusing another card state', async () => {
    const data = manyCards('card').map((card, index) => ({
      ...card,
      title: index === 0 ? 'short' : `card ${index}`,
    }));
    const el = await pinboardFixture({ data: [data, []] });
    await waitUntil(() => columnEls(el)[0]?.querySelector('.virtual-item'), 'items never rendered');
    data[0] = { ...data[0], title: 'a '.repeat(500) };
    el.data = [[...data], []];
    await el.updateComplete;
    await aTimeout(0);
    const items = [...columnEls(el)[0].querySelectorAll('.virtual-item')];
    expect(items.map(item => item.style.transform)).to.have.lengthOf(new Set(items.map(item => item.style.transform)).size);
    expect(columnEls(el)[0].querySelector('owc-card').data.id).to.equal('card-0');
  });

  it('uses window scrolling by default', async () => {
    const initialScrollY = window.scrollY;
    const el = await pinboardFixture({ data: [manyCards('todo'), []] });
    el.style.marginTop = '2000px';
    await el.updateComplete;
    window.scrollTo(0, 2000);
    window.dispatchEvent(new Event('scroll'));
    await waitUntil(
      () => Number(columnEls(el)[0]?.querySelector('.virtual-item')?.dataset.index) > 0,
      'window scrolling did not update the rendered range',
    );
    window.scrollTo(0, initialScrollY);
  });

  it('uses an explicit shadow-root scroll target', async () => {
    const scrollTarget = document.createElement('div');
    scrollTarget.style.cssText = 'height: 300px; overflow: auto';
    const el = await pinboardFixture({ data: [manyCards('todo'), []] });
    scrollTarget.append(el);
    document.body.append(scrollTarget);
    el.scrollTarget = scrollTarget;
    await el.updateComplete;
    await waitUntil(() => columnEls(el)[0]?.querySelector('.virtual-list'), 'items never virtualized');
    expect(el.scrollTarget).to.equal(scrollTarget);
    scrollTarget.remove();
  });

  it('restores virtual ranges and card measurement after reconnecting', async () => {
    const scrollTarget = document.createElement('div');
    scrollTarget.style.cssText = 'height: 300px; overflow: auto';
    const data = manyCards('todo').map((card, index) => ({
      ...card,
      title: index === 0 ? 'short' : card.title,
    }));
    const el = await pinboardFixture({ data: [data, []] });
    el.scrollTarget = scrollTarget;
    scrollTarget.append(el);
    document.body.append(scrollTarget);
    await el.updateComplete;
    await waitUntil(() => columnEls(el)[0]?.querySelector('.virtual-item'), 'items never virtualized');
    el.remove();
    scrollTarget.append(el);
    await el.updateComplete;
    await waitUntil(
      () => columnEls(el)[0]?.querySelector('.virtual-item'),
      'virtual range was not restored after reconnecting',
    );
    data[0] = { ...data[0], title: 'a '.repeat(500) };
    el.data = [[...data], []];
    await el.updateComplete;
    await aTimeout(0);
    const items = [...columnEls(el)[0].querySelectorAll('.virtual-item')];
    expect(items.map(item => item.style.transform)).to.have.lengthOf(
      new Set(items.map(item => item.style.transform)).size,
    );
    scrollTarget.scrollTop = 1000;
    scrollTarget.dispatchEvent(new Event('scroll'));
    await waitUntil(
      () => Number(columnEls(el)[0]?.querySelector('.virtual-item')?.dataset.index) > 0,
      'reconnected controller did not update the rendered range',
    );
    scrollTarget.remove();
  });
});
