import { fixture, html, expect, nextFrame, waitUntil } from '@open-wc/testing';
import { deepActiveElement } from '../a11y/controls.js';
import { visibleArea } from '../virtualizer/virtualList.test-browser.helpers.js';
import {
  columns,
  data,
  rows,
  tableFixture,
  settle,
  headerRow,
  bodyRows,
  cellsOf,
  betweenButtons,
  focusedTable,
  press,
  focusedCell,
  focusAt,
  cellHasFocus,
  tabStops,
  liveRegion,
  containers,
  clickOn,
} from './OwcTable.test-browser.helpers.js';

/** @typedef {import('./OwcTable.test-browser.helpers.js').Table} Table */

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table headers', () => {
  /** @param {Table} el */
  function sortStates(el) {
    return cellsOf(headerRow(el)).map(cell => cell.getAttribute('aria-sort'));
  }

  /**
   * The order each column's sort button shows, which is what a pointer user sees.
   *
   * @param {Table} el
   */
  function shownOrders(el) {
    return [...headerRow(el).querySelectorAll('owc-table-header-cell')].map(cell =>
      cell.getAttribute('order'),
    );
  }

  /** @param {Table} el */
  function firstNames(el) {
    return bodyRows(el).map(row => cellsOf(row)[0].textContent.trim());
  }

  /**
   * Collects every key that is pressed, to tell afterwards whether the page
   * still got it: the grid keeps the keys it handles.
   *
   * @returns {{ left: (...keys: string[]) => boolean[] }} `left`: for each press of these keys, whether it was left to the page
   */
  function keysOfPage() {
    /** @type {KeyboardEvent[]} */
    const events = [];
    /** @param {KeyboardEvent} event */
    const listener = event => events.push(event);
    // on its way down, so it sees keys that are stopped further in
    window.addEventListener('keydown', listener, { capture: true });
    cleanups.push(() => window.removeEventListener('keydown', listener, { capture: true }));
    return {
      left: (...keys) =>
        events.filter(event => keys.includes(event.key)).map(event => !event.defaultPrevented),
    };
  }

  /** @type {Array<() => void>} */
  const cleanups = [];
  afterEach(() => {
    cleanups.splice(0).forEach(cleanup => cleanup());
  });

  describe('sort state', () => {
    it("is none on sortable columns that aren't sorted, and not there on columns that can't be sorted", async () => {
      const el = await tableFixture(
        html`<owc-table
          selectable
          render-mode="linkWithDetail"
          .columns=${[
            { label: '#', field: 'rownum', formatter: 'rownum' },
            columns[0],
            { ...columns[1], headerSort: false },
            columns[2],
          ]}
          .data=${data}
        ></owc-table>`,
      );
      // the columns of the detail toggle, of the selection and of the row numbers can't be sorted
      expect(sortStates(el)).to.deep.equal([null, null, null, 'none', null, 'none']);
    });

    it('is ascending or descending on the sorted column', async () => {
      const el = await tableFixture(
        html`<owc-table
          .columns=${columns}
          .data=${data}
          .jsonSorters=${[{ field: 'age', order: 'desc' }]}
        ></owc-table>`,
      );
      expect(sortStates(el)).to.deep.equal(['none', 'descending', 'none']);
      expect(shownOrders(el)).to.deep.equal([null, 'desc', null]);
      expect(firstNames(el)).to.deep.equal(['Sarah', 'Robert', 'Grace']);

      el.jsonSorters = [{ field: 'firstName', order: 'asc' }];
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['ascending', 'none', 'none']);
      expect(shownOrders(el)).to.deep.equal(['asc', null, null]);

      el.jsonSorters = [];
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['none', 'none', 'none']);
      expect(shownOrders(el)).to.deep.equal([null, null, null]);
    });

    it('stays with its column when the columns change their order', async () => {
      const el = await tableFixture(
        html`<owc-table
          .columns=${columns}
          .data=${data}
          .jsonSorters=${[{ field: 'age', order: 'asc' }]}
        ></owc-table>`,
      );
      el.overrides = { order: ['city', 'firstName', 'age'], visibility: {} };
      await settle(el);
      expect(cellsOf(headerRow(el)).map(cell => cell.textContent.trim())).to.deep.equal([
        'City',
        'First Name',
        'Age',
      ]);
      expect(sortStates(el)).to.deep.equal(['none', 'none', 'ascending']);
      expect(shownOrders(el)).to.deep.equal([null, null, 'asc']);
    });

    it('is on the column whose own sorter sorts the rows', async () => {
      const el = await tableFixture(
        html`<owc-table
          .columns=${[
            columns[0],
            { label: 'Born', field: 'born', sorter: [{ field: 'age', order: 'desc' }] },
            columns[2],
          ]}
          .data=${data}
        ></owc-table>`,
      );
      // a column's sorters sort the rows from the start
      expect(sortStates(el)).to.deep.equal(['none', 'descending', 'none']);
      expect(shownOrders(el)).to.deep.equal([null, 'desc', null]);
      expect(firstNames(el)).to.deep.equal(['Sarah', 'Robert', 'Grace']);
    });
  });

  describe('sorting', () => {
    const plainTable = html`<owc-table .columns=${columns} .data=${data}></owc-table>`;

    it('cycles the sort of the focused column with Enter and Space', async () => {
      const el = await focusedTable(plainTable);
      const page = keysOfPage();
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('header:0');

      await press('Enter');
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['ascending', 'none', 'none']);
      expect(firstNames(el)).to.deep.equal(['Grace', 'Robert', 'Sarah']);
      expect(el.jsonSorters).to.deep.equal([{ field: 'firstName', order: 'asc' }]);

      await press('Space');
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['descending', 'none', 'none']);
      expect(firstNames(el)).to.deep.equal(['Sarah', 'Robert', 'Grace']);

      await press('Enter');
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['none', 'none', 'none']);

      // the focus stays where it is, and the page doesn't get the keys: Space would scroll it
      expect(focusAt(el)).to.equal('header:0');
      expect(cellHasFocus(el)).to.be.true;
      expect(page.left('Enter', ' ')).to.deep.equal([false, false, false]);
    });

    it('goes on from where a click left the sort, and a click from where a key left it', async () => {
      const el = await focusedTable(plainTable);
      const label = headerRow(el).querySelectorAll('owc-table-header-cell')[1];
      await clickOn(label);
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['none', 'ascending', 'none']);
      expect(focusAt(el), 'the click moved the focus to the header cell').to.equal('header:1');

      await press('Enter');
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['none', 'descending', 'none']);
      expect(firstNames(el)).to.deep.equal(['Sarah', 'Robert', 'Grace']);

      await clickOn(label);
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['none', 'none', 'none']);
    });

    it('sorts by one column at a time', async () => {
      const el = await focusedTable(plainTable);
      await press('ArrowUp');
      await press('Enter');
      await press('ArrowRight');
      await press('Space');
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['none', 'ascending', 'none']);
      expect(firstNames(el)).to.deep.equal(['Grace', 'Robert', 'Sarah']);
      expect(focusAt(el)).to.equal('header:1');
    });

    it('goes on from a sort that was set from outside', async () => {
      const el = await focusedTable(plainTable);
      await press('ArrowUp');
      await press('ArrowRight');
      el.jsonSorters = [{ field: 'age', order: 'desc' }];
      await settle(el);
      expect(focusAt(el)).to.equal('header:1');
      await press('Enter');
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['none', 'none', 'none']);

      el.jsonSorters = [{ field: 'firstName', order: 'asc' }];
      await settle(el);
      await press('Enter');
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['none', 'ascending', 'none']);
    });

    it("leaves Enter and Space to the page on a column that can't be sorted", async () => {
      const el = await focusedTable(
        html`<owc-table
          .columns=${[{ ...columns[0], headerSort: false }, columns[1], columns[2]]}
          .data=${data}
        ></owc-table>`,
      );
      const page = keysOfPage();
      let sorts = 0;
      el.shadowRoot.addEventListener('sort-changed', () => sorts++);
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('header:0');
      await press('Enter');
      await press('Space');
      await settle(el);
      expect(sorts).to.equal(0);
      expect(el.jsonSorters).to.deep.equal([]);
      expect(page.left('Enter', ' ')).to.deep.equal([true, true]);
      expect(focusAt(el)).to.equal('header:0');
    });

    it('keeps the sort button for the pointer only', async () => {
      const { el, before, after } = await betweenButtons(plainTable);
      const buttons = [...headerRow(el).querySelectorAll('owc-table-header-cell')].map(cell =>
        cell.shadowRoot.querySelector('button'),
      );
      expect(buttons).to.have.length(3);
      // the header cell says how its column is sorted, and is named by its label alone
      expect(buttons.map(button => button.getAttribute('aria-hidden'))).to.deep.equal([
        'true',
        'true',
        'true',
      ]);
      expect(await tabStops(el, before, after)).to.deep.equal(['0:0']);
      await expect(el).to.be.accessible();

      await clickOn(buttons[2]);
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['none', 'none', 'ascending']);
      expect(firstNames(el)).to.deep.equal(['Sarah', 'Grace', 'Robert']);
      expect(focusAt(el), 'the header cell has the focus, not the button').to.equal('header:2');
      expect(cellHasFocus(el)).to.be.true;
    });

    it('keeps the focus on a sortable header cell that has a control, which F2 reaches', async () => {
      const { el, before, after } = await betweenButtons(
        html`<owc-table
          .columns=${[
            {
              label: () => html`First Name <button class="info">Info</button>`,
              field: 'firstName',
            },
            columns[1],
          ]}
          .data=${data}
        ></owc-table>`,
      );
      expect(await tabStops(el, before, after)).to.deep.equal(['0:0']);
      before.focus();
      await press('Tab');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('header:0');
      expect(cellHasFocus(el), 'the cell has the focus, not its button').to.be.true;

      await press('Enter');
      await press('Space');
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['descending', 'none']);
      expect(cellHasFocus(el)).to.be.true;

      await press('F2');
      expect(deepActiveElement().className).to.equal('info');
      expect(focusAt(el)).to.equal('header:0');
      await waitUntil(() => liveRegion(el).textContent, 'the live region says how to leave');
      expect(liveRegion(el).textContent).to.equal('Press Escape to return to the table');
      await press('Escape');
      expect(cellHasFocus(el)).to.be.true;
      expect(focusAt(el)).to.equal('header:0');
    });

    it('only sorts with Enter and Space on their own', async () => {
      const el = await focusedTable(plainTable);
      await press('ArrowUp');
      for (const key of ['Control+Enter', 'Shift+Enter', 'Alt+Enter', 'Shift+Space', 'F2']) {
        await press(key);
      }
      await settle(el);
      expect(sortStates(el)).to.deep.equal(['none', 'none', 'none']);
      expect(focusAt(el)).to.equal('header:0');
    });
  });

  describe('that stick', () => {
    /**
     * Where the part of the scroll container starts that nothing of the table
     * sticks over: below the header row, which sticks below the info block.
     *
     * @param {Table} el
     */
    function belowSticky(el) {
      return headerRow(el).getBoundingClientRect().bottom;
    }

    /**
     * Moves the focus up from the last row, row by row and then page by page,
     * through more rows than the scroll container shows, and tells where the
     * focused cell's top was against the top of the part nothing sticks over.
     *
     * @param {Table} el
     * @param {() => number} visibleTop
     */
    async function tops(el, visibleTop) {
      await press('Control+End');
      await waitUntil(() => focusAt(el) === '199:2', 'the last row gets the focus');
      /** @type {number[]} */
      const distances = [];
      const note = () =>
        distances.push(Math.round(focusedCell(el).getBoundingClientRect().top - visibleTop()));
      for (let row = 198; row >= 170; row--) {
        await press('ArrowUp');
        await waitUntil(() => focusAt(el) === `${row}:2`, `focus at ${row}:2`);
        note();
      }
      for (let pages = 0; pages < 3; pages++) {
        const from = focusAt(el);
        await press('PageUp');
        await waitUntil(() => /^\d+:2$/.test(focusAt(el)) && focusAt(el) !== from, 'a page up');
        note();
      }
      return distances;
    }

    for (const [name, container] of Object.entries(containers)) {
      for (const mode of ['never', 'always']) {
        describe(`in a table scrolled by ${name} (virtualizer-mode="${mode}")`, () => {
          /** @param {{ info?: boolean, sticky?: boolean, label?: unknown }} [options] */
          async function scrolledTable({ info = false, sticky = true, label = 'City' } = {}) {
            const result = await container(
              html`<owc-table
                ?sticky-header=${sticky}
                virtualizer-mode=${mode}
                .showInfo=${info}
                .columns=${[columns[0], columns[1], { ...columns[2], label }]}
                .data=${rows(200)}
              ></owc-table>`,
            );
            /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
            await press('Tab');
            return result;
          }

          for (const info of [false, true]) {
            it(`keeps the focused cell right below the header when the focus moves up${
              info ? ', with the info block' : ''
            }`, async () => {
              const { el, scroller } = await scrolledTable({ info });
              const distances = await tops(el, () => belowSticky(el));
              // never under the header, and right below it whenever the table had to scroll
              expect(Math.min(...distances), `tops: ${distances}`).to.equal(0);
              expect(distances.slice(-4)).to.deep.equal([0, 0, 0, 0]);

              const header = headerRow(el).getBoundingClientRect();
              const infoBlock = el.shadowRoot.querySelector('#info-outer-wrapper');
              const stuckAt = info
                ? infoBlock.getBoundingClientRect().bottom
                : visibleArea(scroller).top;
              expect(header.top, 'the header row sticks').to.be.closeTo(stuckAt, 0.5);
              if (info) {
                expect(
                  infoBlock.getBoundingClientRect().top,
                  'the info block sticks',
                ).to.be.closeTo(visibleArea(scroller).top, 0.5);
              }
            });
          }

          it('keeps the focused cell below a header that is taller than usual', async () => {
            const { el } = await scrolledTable({
              label: () => html`<div style="height: 140px">City</div>`,
            });
            expect(headerRow(el).getBoundingClientRect().height).to.be.above(140);
            const distances = await tops(el, () => belowSticky(el));
            expect(Math.min(...distances), `tops: ${distances}`).to.equal(0);
            expect(distances.slice(-4)).to.deep.equal([0, 0, 0, 0]);
          });

          it('scrolls the focused cell to the top when the header does not stick', async () => {
            const { el, scroller } = await scrolledTable({ sticky: false });
            const distances = await tops(el, () => visibleArea(scroller).top);
            expect(Math.min(...distances), `tops: ${distances}`).to.equal(0);
            expect(distances.slice(-4)).to.deep.equal([0, 0, 0, 0]);
          });
        });
      }
    }
  });

  describe('resizing', () => {
    const sizedTable = html`<owc-table
      .columns=${[
        { ...columns[0], width: 200 },
        { ...columns[1], width: 60 },
        { ...columns[2], width: 150, resizable: false },
      ]}
      .data=${data}
    ></owc-table>`;

    /**
     * The widths of the columns, as the header row and the first body row show them.
     *
     * @param {Table} el
     */
    function columnWidths(el) {
      const widths = cellsOf(headerRow(el)).map(cell => cell.getBoundingClientRect().width);
      expect(
        cellsOf(bodyRows(el)[0]).map(cell => cell.getBoundingClientRect().width),
        'the body cells are as wide as their header cells',
      ).to.deep.equal(widths);
      return widths;
    }

    /**
     * Waits for the live region to say something, and returns it.
     *
     * @param {Table} el
     * @param {string} [after] what it said before
     */
    async function announced(el, after = '') {
      await waitUntil(
        () => ![after, ''].includes(liveRegion(el).textContent),
        `the live region says something new after "${after}"`,
      );
      return liveRegion(el).textContent;
    }

    /**
     * Collects what the live region says from now on, also what it says twice.
     *
     * @param {Table} el
     */
    function announcements(el) {
      /** @type {string[]} */
      const said = [];
      const observer = new MutationObserver(() => {
        if (liveRegion(el).textContent) {
          said.push(liveRegion(el).textContent);
        }
      });
      observer.observe(liveRegion(el), { childList: true, characterData: true, subtree: true });
      cleanups.push(() => observer.disconnect());
      return said;
    }

    it('makes the focused column 10px wider with Shift+→ and narrower with Shift+←, and says its width', async () => {
      const el = await focusedTable(sizedTable);
      const page = keysOfPage();
      await press('ArrowUp');
      expect(columnWidths(el)).to.deep.equal([200, 60, 150]);

      await press('Shift+ArrowRight');
      await el.updateComplete;
      expect(columnWidths(el)).to.deep.equal([210, 60, 150]);
      expect(await announced(el)).to.equal('210 pixels wide');

      await press('Shift+ArrowLeft');
      await press('Shift+ArrowLeft');
      await el.updateComplete;
      expect(columnWidths(el)).to.deep.equal([190, 60, 150]);
      expect(await announced(el, '210 pixels wide')).to.equal('190 pixels wide');

      expect(el.visibleColumns.map(column => column.width)).to.deep.equal([190, 60, 150]);
      expect(focusAt(el)).to.equal('header:0');
      expect(cellHasFocus(el)).to.be.true;
      expect(page.left('ArrowRight', 'ArrowLeft')).to.deep.equal([false, false, false]);
    });

    it("doesn't make a column narrower than the minimum width, and says the width again", async () => {
      const el = await focusedTable(sizedTable);
      const said = announcements(el);
      await press('ArrowUp');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('header:1');

      await press('Shift+ArrowLeft');
      await el.updateComplete;
      expect(columnWidths(el)).to.deep.equal([200, 50, 150]);
      await waitUntil(() => said.length === 1, 'the width is announced');

      await press('Shift+ArrowLeft');
      await el.updateComplete;
      expect(columnWidths(el)).to.deep.equal([200, 50, 150]);
      await waitUntil(() => said.length === 2, 'the width is announced again');
      expect(said).to.deep.equal(['50 pixels wide', '50 pixels wide']);
    });

    it('resizes a column that fits its content from the width it has', async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      await el.recalculateColumnWidths();
      const [firstName, age, city] = columnWidths(el);
      await press('ArrowUp');
      await press('ArrowRight');
      await press('Shift+ArrowRight');
      await press('Shift+ArrowRight');
      await el.updateComplete;
      expect(columnWidths(el)).to.deep.equal([firstName, age + 20, city]);
      expect(await announced(el)).to.equal(`${age + 20} pixels wide`);

      // the other columns still fit their content when the table sizes them again
      await el.recalculateColumnWidths();
      expect(columnWidths(el)).to.deep.equal([firstName, age + 20, city]);
    });

    it('says the width in the language of the table', async () => {
      const el = await focusedTable(
        html`<owc-table
          lang="de"
          .columns=${[{ ...columns[0], width: 200 }, columns[1], columns[2]]}
          .data=${data}
        ></owc-table>`,
      );
      await press('ArrowUp');
      await press('Shift+ArrowRight');
      expect(await announced(el)).to.equal('210 Pixel breit');
    });

    it("leaves the keys to the page on a column that can't be resized", async () => {
      const el = await focusedTable(sizedTable);
      const page = keysOfPage();
      await press('ArrowUp');
      await press('End');
      expect(focusAt(el)).to.equal('header:2');
      for (const key of ['Shift+ArrowRight', 'Shift+ArrowLeft', 'Shift+Backspace']) {
        await press(key);
      }
      await el.recalculateColumnWidths();
      expect(columnWidths(el)).to.deep.equal([200, 60, 150]);
      expect(page.left('ArrowRight', 'ArrowLeft', 'Backspace')).to.deep.equal([true, true, true]);
      expect(focusAt(el)).to.equal('header:2');
      await nextFrame();
      expect(liveRegion(el).textContent).to.equal('');
    });

    it('leaves the keys to the page in the body', async () => {
      const el = await focusedTable(sizedTable);
      const page = keysOfPage();
      for (const key of ['Shift+ArrowRight', 'Shift+ArrowLeft', 'Shift+Backspace']) {
        await press(key);
      }
      await el.recalculateColumnWidths();
      expect(columnWidths(el)).to.deep.equal([200, 60, 150]);
      expect(page.left('ArrowRight', 'ArrowLeft', 'Backspace')).to.deep.equal([true, true, true]);
      expect(focusAt(el)).to.equal('0:0');
    });

    it('resets a column to its configured width with Shift+Backspace, and says the width', async () => {
      const el = await focusedTable(sizedTable);
      const page = keysOfPage();
      await press('ArrowUp');
      await press('Shift+ArrowRight');
      await press('Shift+ArrowRight');
      await el.updateComplete;
      expect(columnWidths(el)).to.deep.equal([220, 60, 150]);
      expect(await announced(el)).to.equal('220 pixels wide');

      await press('Shift+Backspace');
      expect(await announced(el, '220 pixels wide')).to.equal('200 pixels wide');
      expect(columnWidths(el)).to.deep.equal([200, 60, 150]);
      expect(page.left('Backspace')).to.deep.equal([false]);
      expect(focusAt(el)).to.equal('header:0');
    });

    it('resets a column that fits its content to the width that fits, and says the width', async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      await el.recalculateColumnWidths();
      const fitting = columnWidths(el);
      await press('ArrowUp');
      await press('Shift+ArrowLeft');
      await press('Shift+ArrowLeft');
      await el.updateComplete;
      expect(columnWidths(el)[0]).to.equal(fitting[0] - 20);
      expect(await announced(el)).to.equal(`${fitting[0] - 20} pixels wide`);

      await press('Shift+Backspace');
      expect(await announced(el, `${fitting[0] - 20} pixels wide`)).to.equal(
        `${fitting[0]} pixels wide`,
      );
      expect(columnWidths(el)).to.deep.equal(fitting);
      expect(el.visibleColumns[0].width, 'the width is the measured one again').to.equal(undefined);
    });

    it('fits the other columns of a full-width table to its container again, as dragging does', async () => {
      const wrapper = await fixture(html`
        <div style="width: 600px">
          <button id="before">before</button>
          <owc-table grow-full-width .columns=${columns} .data=${data}></owc-table>
        </div>
      `);
      const el = /** @type {Table} */ (wrapper.querySelector('owc-table'));
      await settle(el);
      await el.recalculateColumnWidths();
      const fitted = columnWidths(el);
      expect(fitted.reduce((sum, width) => sum + width)).to.equal(600);

      /** @type {HTMLElement} */ (wrapper.querySelector('#before')).focus();
      await press('Tab');
      await press('ArrowUp');
      await press('Shift+ArrowRight');
      await press('Shift+ArrowRight');
      await press('Shift+ArrowRight');
      await el.recalculateColumnWidths();
      const resized = columnWidths(el);
      expect(resized[0]).to.equal(fitted[0] + 30);
      expect(resized.reduce((sum, width) => sum + width)).to.equal(600);
      expect(await announced(el)).to.equal(`${fitted[0] + 30} pixels wide`);
    });

    it("resizes from a header cell's control", async () => {
      const el = await focusedTable(
        html`<owc-table
          .columns=${[
            {
              label: () => html`<button class="info">First Name</button>`,
              field: 'firstName',
              headerSort: false,
              width: 200,
            },
            columns[1],
          ]}
          .data=${data}
        ></owc-table>`,
      );
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('header:0');
      expect(deepActiveElement().className).to.equal('info');
      await press('Shift+ArrowRight');
      await el.updateComplete;
      expect(columnWidths(el)[0]).to.equal(210);
      expect(deepActiveElement().className).to.equal('info');
    });
  });
});
