import { fixture, html, expect } from '@open-wc/testing';
import { nothing } from 'lit';
import { OwcTable } from './OwcTable.js';
import {
  expectItemsCover,
  scrollTo,
  untilStable,
} from '../virtualizer/virtualList.test-browser.helpers.js';

customElements.define('owc-table', OwcTable);

/** @typedef {{ id: string, firstName: string, age: number, lines?: string[] }} Row */
/** @typedef {OwcTable<Row>} Table */

const columns = [
  { label: 'First Name', field: 'firstName' },
  { label: 'Age', field: 'age', formatter: 'number' },
];

/** @param {number} count */
function rows(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    firstName: `Person ${index}`,
    age: index,
  }));
}

/** Details animate over a few frames, as they do with a theme. */
const animatedDetails = 'wa-details { --show-duration: 100ms; --hide-duration: 100ms; }';

/** @param {Table} el */
function rowContainers(el) {
  return /** @type {HTMLElement[]} */ ([
    ...(el.shadowRoot?.querySelectorAll('#data-table .table-body .row-container') ?? []),
  ]);
}

/**
 * The rendered row container of a Data Row.
 *
 * @param {Table} el
 * @param {number} index
 */
function rowContainerAt(el, index) {
  return /** @type {HTMLElement | undefined} */ (
    el.shadowRoot?.querySelector(`.row[data-index="${index}"]`)?.closest('.row-container') ??
      undefined
  );
}

/** @param {Table} el */
function renderedIndexes(el) {
  return rowContainers(el).map(container =>
    Number(/** @type {HTMLElement} */ (container.querySelector('.row')).dataset.index),
  );
}

/** @param {Table} el */
function tableBody(el) {
  return /** @type {HTMLElement} */ (el.shadowRoot?.querySelector('#data-table .table-body'));
}

/**
 * Waits until the rendered rows and their heights stay the same for a few
 * frames, and every animation, such as a detail opening, has finished.
 *
 * @param {Table} el
 */
function settle(el) {
  return untilStable(
    el,
    () =>
      rowContainers(el)
        .map(
          container =>
            `${container.querySelector('.row')?.getAttribute('data-index')}:${container.getBoundingClientRect().height}`,
        )
        .join(),
    { maxFrames: 120, animations: true },
  );
}

/** @param {Row} row */
const renderDetailContent = row => html`<p class="detail-content">Details of ${row.firstName}</p>`;

/**
 * Renders a virtualized table with row details in a 300px scroll box.
 *
 * @param {number} count
 * @param {{ renderMode?: string, renderDetail?: (row: Row) => unknown }} [options]
 */
async function detailTable(
  count,
  { renderMode = 'detail', renderDetail = renderDetailContent } = {},
) {
  const box = /** @type {HTMLElement} */ (
    await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table
          render-mode=${renderMode}
          .customStyles=${animatedDetails}
          .columns=${columns}
          .data=${rows(count)}
          .renderDetail=${renderDetail}
        ></owc-table>
      </div>
    `)
  );
  const el = /** @type {Table} */ (box.querySelector('owc-table'));
  await settle(el);
  return { box, el };
}

/**
 * Asserts that the rendered rows cover the visible part of the table body.
 *
 * @param {Table} el
 * @param {Element} box
 */
function expectCovered(el, box) {
  expectItemsCover(box, tableBody(el), rowContainers(el));
}

/**
 * @param {HTMLElement | undefined} element
 * @returns {DOMRect}
 */
function rectOf(element) {
  expect(element, 'rendered element').to.exist;
  return /** @type {HTMLElement} */ (element).getBoundingClientRect();
}

/**
 * The row container at the top of the visible area of a scroll box.
 *
 * @param {Table} el
 * @param {Element} box
 */
function firstVisibleRow(el, box) {
  const top = box.getBoundingClientRect().top;
  return /** @type {HTMLElement} */ (
    rowContainers(el).find(container => container.getBoundingClientRect().top >= top)
  );
}

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table row heights', () => {
  it('moves the rows after a detail down when it opens and back up when it closes', async () => {
    const { box, el } = await detailTable(1_000);
    const closedHeight = rectOf(rowContainerAt(el, 2)).height;

    el.openDetails = ['2'];
    await settle(el);
    const opened = rectOf(rowContainerAt(el, 2));
    expect(opened.height, 'open row').to.be.above(closedHeight + 100);
    expect(rectOf(rowContainerAt(el, 3)).top, 'next row').to.be.closeTo(opened.bottom, 0.5);

    el.openDetails = [];
    await settle(el);
    const closed = rectOf(rowContainerAt(el, 2));
    expect(closed.height, 'closed row').to.be.closeTo(closedHeight, 0.5);
    expect(rectOf(rowContainerAt(el, 3)).top, 'next row').to.be.closeTo(closed.bottom, 0.5);
    expectCovered(el, box);
  });

  it('measures detail content that arrives asynchronously', async () => {
    /** @type {(content: unknown) => void} */
    let resolveDetail = () => {};
    const loading = new Promise(resolve => {
      resolveDetail = resolve;
    });
    const { box, el } = await detailTable(1_000, {
      renderDetail: row => (row.id === '0' ? loading : html`<p>Details of ${row.firstName}</p>`),
    });
    el.openDetails = ['0'];
    await settle(el);
    const loadingHeight = rectOf(rowContainerAt(el, 0)).height;

    resolveDetail(html`<div style="height: 400px">Loaded</div>`);
    await settle(el);
    const loaded = rectOf(rowContainerAt(el, 0));
    expect(loaded.height, 'row with the loaded detail').to.be.above(loadingHeight + 200);
    expect(rectOf(rowContainerAt(el, 1)).top, 'next row').to.be.closeTo(loaded.bottom, 0.5);

    // the table keeps its height once the row has left the rendered range, so its size was measured
    const bodyHeight = tableBody(el).getBoundingClientRect().height;
    await scrollTo(box, 20_000);
    await settle(el);
    expect(rowContainerAt(el, 0), 'row 0 after scrolling away').to.equal(undefined);
    expect(tableBody(el).getBoundingClientRect().height).to.be.closeTo(bodyHeight, 1);
  });

  it('keeps the visible rows in place when a detail above them closes or opens', async () => {
    const { box, el } = await detailTable(1_000);
    el.openDetails = ['20'];
    await settle(el);
    // scroll on until the open row is above the visible area, but still rendered
    await scrollTo(box, box.scrollTop + 500);
    await settle(el);
    expect(rectOf(rowContainerAt(el, 20)).bottom, 'open row').to.be.below(
      box.getBoundingClientRect().top,
    );
    let row = firstVisibleRow(el, box);
    let top = row.getBoundingClientRect().top;

    el.openDetails = [];
    await settle(el);
    expect(row.getBoundingClientRect().top, 'after closing a rendered detail').to.be.closeTo(
      top,
      1,
    );

    // a row far above, which isn't rendered
    await scrollTo(box, 30_000);
    await settle(el);
    row = firstVisibleRow(el, box);
    top = row.getBoundingClientRect().top;
    expect(rowContainerAt(el, 5), 'row 5').to.equal(undefined);

    el.openDetails = ['5'];
    await settle(el);
    expect(row.getBoundingClientRect().top, 'after opening a detail far above').to.be.closeTo(
      top,
      1,
    );

    el.openDetails = [];
    await settle(el);
    expect(row.getBoundingClientRect().top, 'after closing a detail far above').to.be.closeTo(
      top,
      1,
    );
    expectCovered(el, box);
  });

  it('scrolls up through rows with annotations and multi-line cells without jumps, and reaches the last row', async () => {
    // every 7th row has an annotation, and every 5th row a cell with three lines
    const data = rows(10_000).map((row, index) => ({
      ...row,
      lines: index % 5 === 0 ? ['first', 'second', 'third'] : ['single'],
    }));
    const box = /** @type {HTMLElement} */ (
      await fixture(html`
        <div style="height: 300px; overflow: auto">
          <owc-table
            .columns=${[
              ...columns,
              {
                label: 'Lines',
                field: 'lines',
                formatter: (/** @type {Row} */ row) =>
                  html`${row.lines?.map(line => html`<div>${line}</div>`)}`,
              },
            ]}
            .data=${data}
            .renderAnnotation=${(/** @type {Row} */ row) =>
              Number(row.id) % 7 === 0 ? html`<span>Note on ${row.firstName}</span>` : nothing}
          ></owc-table>
        </div>
      `)
    );
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    const scrollToEnd = async () => {
      // the first jump shows rows that may turn out taller than estimated, and push the end down
      for (
        let attempt = 0;
        attempt < 3 && box.scrollTop < box.scrollHeight - box.clientHeight;
        attempt++
      ) {
        await scrollTo(box, box.scrollHeight);
        await settle(el);
      }
      expect(renderedIndexes(el).at(-1), 'last rendered row').to.equal(9_999);
      expect(rectOf(rowContainerAt(el, 9_999)).bottom, 'bottom of the last row').to.be.closeTo(
        box.getBoundingClientRect().bottom,
        1,
      );
    };

    await scrollToEnd();
    for (let step = 0; step < 8; step++) {
      const row = firstVisibleRow(el, box);
      const top = row.getBoundingClientRect().top;
      await scrollTo(box, box.scrollTop - 250);
      await settle(el);
      expect(row.getBoundingClientRect().top, `row ${step}`).to.be.closeTo(top + 250, 1);
      expectCovered(el, box);
    }
    await scrollToEnd();
  });

  it('renders the closed detail content of every rendered row in detail mode, so find in page sees it', async () => {
    const { box, el } = await detailTable(1_000);

    for (const top of [0, 25_000]) {
      await scrollTo(box, top);
      await settle(el);
      const containers = rowContainers(el);
      const withContent = containers.filter(container =>
        container.querySelector('wa-details:not([open]) .detail-content'),
      );
      expect(withContent.length, `rows with closed detail content at ${top}px`).to.equal(
        containers.length,
      );
    }
  });

  it('renders detail content only once a detail opened in detailDeferred mode, and keeps it', async () => {
    const { el } = await detailTable(1_000, { renderMode: 'detailDeferred' });
    const detailContents = () => el.shadowRoot?.querySelectorAll('.detail-content') ?? [];
    expect(detailContents().length, 'before opening').to.equal(0);

    el.openDetails = ['1'];
    await settle(el);
    expect(rowContainerAt(el, 1)?.querySelector('.detail-content'), 'open').to.exist;

    el.openDetails = [];
    await settle(el);
    expect(rowContainerAt(el, 1)?.querySelector('.detail-content'), 'closed again').to.exist;
    expect(detailContents().length, 'rows with detail content').to.equal(1);
  });

  it('keeps a detail open when its row leaves the rendered range and comes back', async () => {
    const { box, el } = await detailTable(1_000);
    el.openDetails = ['3'];
    await settle(el);
    const openHeight = rectOf(rowContainerAt(el, 3)).height;

    await scrollTo(box, 30_000);
    await settle(el);
    expect(rowContainerAt(el, 3), 'row 3 after scrolling away').to.equal(undefined);
    await scrollTo(box, 0);
    await settle(el);

    const container = /** @type {HTMLElement} */ (rowContainerAt(el, 3));
    expect(container.querySelector('wa-details')?.hasAttribute('open'), 'open').to.equal(true);
    expect(rectOf(container).height, 'height of the open row').to.be.closeTo(openHeight, 1);
  });

  it('estimates an unrendered row with an open detail with the typical detail height added', async () => {
    const { el } = await detailTable(1_000);
    el.openDetails = ['0'];
    await settle(el);
    const detailHeight =
      rectOf(rowContainerAt(el, 0)).height - rectOf(rowContainerAt(el, 1)).height;
    const bodyHeight = tableBody(el).getBoundingClientRect().height;
    expect(detailHeight, 'height of the open detail').to.be.above(100);
    expect(renderedIndexes(el), 'rendered rows').to.not.include(900);

    el.openDetails = ['0', '900'];
    await settle(el);

    expect(tableBody(el).getBoundingClientRect().height).to.be.closeTo(
      bodyHeight + detailHeight,
      1,
    );
  });
});
