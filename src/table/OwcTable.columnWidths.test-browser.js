import { fixture, html, expect, nextFrame } from '@open-wc/testing';
import { nothing } from 'lit';
import { OwcTable } from './OwcTable.js';
import { scrollTo, untilStable } from '../virtualizer/virtualList.test-browser.helpers.js';
import '@awesome.me/webawesome/dist/components/details/details.js';

customElements.define('owc-table', OwcTable);

/** @typedef {OwcTable<{ id: string, firstName: string, age: number }>} Table */

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

/**
 * Waits until the rendered rows stay the same for a few frames.
 *
 * @param {Table} el
 */
function settle(el) {
  return untilStable(el, () =>
    [...(el.shadowRoot?.querySelectorAll('.table-body .row') ?? [])]
      .map(row => /** @type {HTMLElement} */ (row).dataset.index)
      .join(),
  );
}

/**
 * @param {Table} el
 * @param {string} selector
 */
function all(el, selector) {
  return /** @type {HTMLElement[]} */ ([...(el.shadowRoot?.querySelectorAll(selector) ?? [])]);
}

/** @param {Element} element */
function horizontalBox(element) {
  const { left, width } = element.getBoundingClientRect();
  return { left, width };
}

/** @param {number} count */
async function frames(count) {
  for (let frame = 0; frame < count; frame++) {
    await nextFrame();
  }
}

/**
 * The widths of the columns, as the header cells show them.
 *
 * @param {Table} el
 */
function columnWidths(el) {
  return all(el, '.table-header .row > .cell').map(cell => cell.getBoundingClientRect().width);
}

/**
 * Rows whose last one has a name far longer than the others.
 *
 * @param {number} count
 */
function rowsEndingInALongName(count) {
  const data = rows(count);
  data[count - 1].firstName = `Person with a far longer name than the others ${count - 1}`;
  return data;
}

/**
 * The labels of header cells that are cut off.
 *
 * @param {Table} el
 */
function clippedHeaderLabels(el) {
  return all(el, 'owc-table-header-cell')
    .filter(cell => {
      const label = /** @type {HTMLElement} */ (cell.shadowRoot?.querySelector('#slot-wrapper'));
      return label.scrollWidth > label.clientWidth;
    })
    .map(cell => cell.textContent?.trim());
}

describe('owc-table column widths', () => {
  it('spans spacers, group labels, annotations and details across all columns, and their content does not size the columns', async () => {
    // a single word far wider than any column
    const wide = 'w'.repeat(300);
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table
          virtualizer-mode="always"
          render-mode="detail"
          .columns=${columns}
          .groupList=${[{ key: 'all', label: `Everyone ${wide}`, active: true }]}
          .groupSelector=${() => 'all'}
          .data=${rows(50)}
          .openDetails=${['1']}
          .renderAnnotation=${(/** @type {{ id: string }} */ row) =>
            row.id === '1' ? html`Annotation ${wide}` : nothing}
          .renderDetail=${() => html`<p>Detail ${wide}</p>`}
        ></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    await el.recalculateColumnWidths();

    const header = horizontalBox(all(el, '.table-header .row')[0]);
    // "First Name" and "Person 49", "Age" and "49", far narrower than the wide words
    expect(header.width, 'width of the columns').to.be.below(400);
    const spanning = {
      spacers: all(el, '.virtualizer-spacer'),
      'group labels': all(el, '.group-label-container'),
      annotations: all(el, '.row-annotation'),
      details: all(el, 'wa-details'),
    };
    for (const [name, elements] of Object.entries(spanning)) {
      expect(elements, name).to.not.be.empty;
      for (const element of elements) {
        expect(horizontalBox(element), name).to.deep.equal(header);
      }
    }
  });

  it('fits columns without a width to the header and the first rendered rows, at least 50px wide', async () => {
    /** @param {number} width */
    const block = width => html`<span style="display: inline-block; width: ${width}px"></span>`;
    // widths of the first rows' content; the last row, far below, is wider still
    const data = rows(1_000).map((row, index) => ({
      ...row,
      size: index === 999 ? 400 : [100, 180, 120][index % 3],
    }));
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table
          .columns=${[
            {
              label: 'Content',
              field: 'size',
              formatter: (/** @type {{ size: number }} */ row) => block(row.size),
            },
            { label: () => block(150), field: 'header', formatter: () => block(10) },
            { label: '', field: 'empty', headerSort: false, formatter: () => '' },
          ]}
          .data=${data}
        ></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);

    expect(columnWidths(el)).to.deep.equal([
      // the widest rendered content, the cell's padding (2 × 18px) and the table's left border
      180 + 36 + 1,
      // the header label, the gap and sort button (4 + 13px), the padding (18 + 2px) and the resize handle (20px)
      150 + 17 + 20 + 20,
      // the minimum
      50,
    ]);
  });

  it('keeps a header label that can wrap on one line, and wraps cell content that can wrap at its widest word', async () => {
    // an inline element in content that can wrap, so its client rects are its lines
    const wrapping = (/** @type {string} */ text) =>
      html`<span style="white-space: normal"><span class="wrapping">${text}</span></span>`;
    const el = /** @type {Table} */ (
      await fixture(html`
        <owc-table
          .columns=${[
            { label: () => wrapping('A label with several words'), field: 'firstName' },
            {
              label: 'Text',
              field: 'text',
              formatter: () => wrapping('Cell content with several words and one long word'),
            },
          ]}
          .data=${rows(3)}
        ></owc-table>
      `)
    );
    await settle(el);

    const [label, ...cells] = all(el, '.wrapping');
    expect(label.getClientRects().length, 'lines of the header label').to.equal(1);
    for (const cell of cells) {
      expect(cell.getClientRects().length, 'lines of the cell content').to.be.above(1);
    }
  });

  it('sizes the columns the same with and without virtualization', async () => {
    const data = rows(20);
    data[5].firstName = 'Person with a longer name';
    /** @type {number[][]} */
    const widths = [];
    for (const mode of ['never', 'always']) {
      const box = await fixture(html`
        <div style="height: 300px; overflow: auto">
          <owc-table virtualizer-mode=${mode} .columns=${columns} .data=${data}></owc-table>
        </div>
      `);
      const el = /** @type {Table} */ (box.querySelector('owc-table'));
      await settle(el);
      widths.push(columnWidths(el));
    }

    expect(widths[1], 'virtualized').to.deep.equal(widths[0]);
  });

  it('keeps the column widths while scrolling to rows with wider content', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table .columns=${columns} .data=${rowsEndingInALongName(1_000)}></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    const widths = columnWidths(el);

    await scrollTo(box, box.scrollHeight);
    await settle(el);

    expect(all(el, '.table-body .row').at(-1)?.textContent).to.include('far longer name');
    expect(columnWidths(el)).to.deep.equal(widths);
  });

  it('keeps the column widths when only the height of the window changes, like a mobile toolbar hiding while scrolling', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table .columns=${columns} .data=${rowsEndingInALongName(1_000)}></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    const widths = columnWidths(el);
    await scrollTo(box, box.scrollHeight);
    await settle(el);

    // the window's width stays the same
    window.dispatchEvent(new Event('resize'));
    await frames(3);
    await settle(el);

    expect(columnWidths(el)).to.deep.equal(widths);
  });

  it('sizes the columns of a table rendered while hidden once it becomes visible, and keeps them while scrolling', async () => {
    const box = /** @type {HTMLElement} */ (
      await fixture(html`
        <div style="height: 300px; overflow: auto; display: none">
          <owc-table .columns=${columns} .data=${rowsEndingInALongName(1_000)}></owc-table>
        </div>
      `)
    );
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await el.recalculateColumnWidths();

    box.style.display = 'block';
    // one frame to lay the table out and notice its size, one to size the columns
    await frames(3);
    await el.updateComplete;
    expect(clippedHeaderLabels(el)).to.deep.equal([]);
    const widths = columnWidths(el);

    await scrollTo(box, box.scrollHeight);
    await settle(el);
    expect(all(el, '.table-body .row').at(-1)?.textContent).to.include('far longer name');
    expect(columnWidths(el)).to.deep.equal(widths);
  });

  it('fits full-width columns to a narrower host while scrolled down, keeping the rendered rows in place', async () => {
    const wrapper = /** @type {HTMLElement} */ (
      await fixture(html`
        <div style="width: 1000px">
          <div style="height: 300px; overflow: auto">
            <owc-table grow-full-width .columns=${columns} .data=${rows(10_000)}></owc-table>
          </div>
        </div>
      `)
    );
    const box = /** @type {HTMLElement} */ (wrapper.firstElementChild);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    await scrollTo(box, 100_000);
    await settle(el);
    const rendered = all(el, '.table-body .row-container');
    const tops = rendered.map(container => container.getBoundingClientRect().top);

    wrapper.style.width = '600px';
    await frames(3);
    await settle(el);

    const header = all(el, '.table-header .row')[0];
    expect(header.getBoundingClientRect().width, 'width of the columns').to.equal(el.clientWidth);
    const after = all(el, '.table-body .row-container');
    expect(after.length, 'rendered rows').to.equal(rendered.length);
    expect(
      after.every((container, index) => container === rendered[index]),
      'the same row elements',
    ).to.equal(true);
    expect(after.map(container => container.getBoundingClientRect().top)).to.deep.equal(tops);
  });

  it('measures the rows again when narrower columns make them wrap', async () => {
    const text = 'Some words that wrap once the column gets narrow enough.';
    const wrapper = /** @type {HTMLElement} */ (
      await fixture(html`
        <div style="width: 1200px">
          <div style="height: 300px; overflow: auto">
            <owc-table
              grow-full-width
              .columns=${[
                {
                  label: 'Text',
                  field: 'text',
                  formatter: () => html`<span style="white-space: normal">${text}</span>`,
                },
              ]}
              .data=${rows(1_000).map(row => ({ ...row, text }))}
            ></owc-table>
          </div>
        </div>
      `)
    );
    const box = /** @type {HTMLElement} */ (wrapper.firstElementChild);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    // measure more rows than are rendered at the end
    await scrollTo(box, 3_000);
    await settle(el);
    await scrollTo(box, 0);
    await settle(el);
    const rowHeight = all(el, '.row-container')[0].getBoundingClientRect().height;

    wrapper.style.width = '300px';
    await frames(3);
    await settle(el);

    const wrappedHeight = all(el, '.row-container')[0].getBoundingClientRect().height;
    expect(wrappedHeight, 'height of a wrapped row').to.be.above(rowHeight);
    // every row is alike, so the list is as tall as 1,000 wrapped rows
    const bodyHeight = all(el, '.table-body')[0].getBoundingClientRect().height;
    expect(bodyHeight).to.be.closeTo(1_000 * wrappedHeight, 1);
  });

  it('keeps a dragged width and restores the configured or fitting width on double-click', async () => {
    const el = /** @type {Table} */ (
      await fixture(html`
        <owc-table
          .columns=${[{ ...columns[0], width: 160 }, columns[1]]}
          .data=${rows(3)}
        ></owc-table>
      `)
    );
    await settle(el);
    const widths = columnWidths(el);
    expect(widths[0], 'configured width').to.equal(160);

    for (const index of [0, 1]) {
      const handle = /** @type {HTMLElement} */ (
        el.shadowRoot?.querySelector(`.cell-resize[data-visible-column-index="${index}"]`)
      );
      // the first move takes the column's width, the release adds the distance
      handle.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, composed: true, clientX: 100 }),
      );
      el.dispatchEvent(new MouseEvent('mousemove', { clientX: 120 }));
      el.dispatchEvent(new MouseEvent('mouseup', { clientX: 140 }));
      await el.updateComplete;
      expect(columnWidths(el)[index], `dragged column ${index}`).to.equal(widths[index] + 40);

      handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
      await el.recalculateColumnWidths();
      expect(columnWidths(el)[index], `reset column ${index}`).to.equal(widths[index]);
    }
  });

  it('sizes the columns again when the columns change, and keeps the new widths while scrolling', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table .columns=${columns} .data=${rowsEndingInALongName(1_000)}></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    const widths = columnWidths(el);

    el.columns = [{ ...columns[0], label: 'First name of the person' }, columns[1]];
    await frames(2);
    await settle(el);
    const resized = columnWidths(el);
    expect(resized[0], 'column with the longer label').to.be.above(widths[0]);
    expect(clippedHeaderLabels(el)).to.deep.equal([]);

    // the row with the long name doesn't widen the sized column
    await scrollTo(box, box.scrollHeight);
    await settle(el);
    expect(all(el, '.table-body .row').at(-1)?.textContent).to.include('far longer name');
    expect(columnWidths(el), 'scrolled').to.deep.equal(resized);
  });

  it('sizes the columns again when the overrides reorder them, and keeps the new widths while scrolling', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table .columns=${columns} .data=${rowsEndingInALongName(1_000)}></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    const [firstName, age] = columnWidths(el);

    el.overrides = { visibility: {}, order: ['age', 'firstName'] };
    await frames(2);
    await settle(el);
    expect(columnWidths(el), 'reordered').to.deep.equal([age, firstName]);

    // the row with the long name doesn't widen the sized column
    await scrollTo(box, box.scrollHeight);
    await settle(el);
    expect(all(el, '.table-body .row').at(-1)?.textContent).to.include('far longer name');
    expect(columnWidths(el), 'scrolled').to.deep.equal([age, firstName]);
  });

  it('sizes the columns again when sorting, filtering or new data change the first rows, but not while scrolling', async () => {
    const box = await fixture(html`
      <div style="height: 300px; overflow: auto">
        <owc-table .columns=${columns} .data=${rowsEndingInALongName(1_000)}></owc-table>
      </div>
    `);
    const el = /** @type {Table} */ (box.querySelector('owc-table'));
    await settle(el);
    const widths = columnWidths(el);

    // the row with the long name comes first
    el.jsonSorters = [{ field: 'age', order: 'desc' }];
    await frames(2);
    await settle(el);
    expect(columnWidths(el)[0], 'sorted').to.be.above(widths[0]);

    el.jsonFilters = [{ field: 'age', operator: 'lessThan', value: 999 }];
    await frames(2);
    await settle(el);
    expect(columnWidths(el), 'filtered').to.deep.equal(widths);

    el.data = rowsEndingInALongName(1_000).reverse();
    await frames(2);
    await settle(el);
    expect(columnWidths(el), 'new data, filtered').to.deep.equal(widths);

    el.jsonFilters = [];
    await frames(2);
    await settle(el);
    const unfiltered = columnWidths(el);
    expect(unfiltered[0], 'new data').to.be.above(widths[0]);

    // scrolling away from the long name keeps its width
    await scrollTo(box, box.scrollHeight);
    await settle(el);
    expect(columnWidths(el), 'scrolled').to.deep.equal(unfiltered);
  });
});
