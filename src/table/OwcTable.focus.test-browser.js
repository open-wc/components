import { html, expect, nextFrame, waitUntil } from '@open-wc/testing';
import { deepActiveElement } from '../a11y/controls.js';
import {
  columns,
  data,
  rows,
  settle,
  grid,
  bodyRows,
  betweenButtons,
  focusedTable,
  press,
  focusedCell,
  focusAt,
  cellHasFocus,
  liveRegion,
  isInView,
  editableColumns,
  containers,
} from './OwcTable.test-browser.helpers.js';

/** @typedef {import('./OwcTable.test-browser.helpers.js').Table} Table */

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table focus that outlives its row', () => {
  /**
   * Scrolls and waits until the table has rendered the rows there.
   *
   * @param {Table} el
   * @param {Element} scroller
   * @param {number} top
   */
  async function scrollTo(el, scroller, top) {
    scroller.scrollTop = top;
    await settle(el);
  }

  /** Whether the grid element itself has the focus. @param {Table} el */
  function gridHasFocus(el) {
    return deepActiveElement() === grid(el);
  }

  describe('when the data is replaced', () => {
    it('stays on its row when new objects with the same ids replace the rows', async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      await press('ArrowDown');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('1:1');
      expect(focusedCell(el).textContent.trim()).to.equal('65');

      el.data = data.map(row => ({ ...row }));
      await settle(el);
      expect(focusAt(el)).to.equal('1:1');

      // Sarah comes first now
      el.data = [data[1], data[0], data[2]].map(row => ({ ...row }));
      await settle(el);
      expect(focusAt(el)).to.equal('0:1');
      expect(focusedCell(el).textContent.trim()).to.equal('65');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:1');
      expect(focusedCell(el).textContent.trim()).to.equal('34');
    });
  });

  describe('by what identifies a row', () => {
    it('asks getRowId, not the id field', async () => {
      const people = [
        { id: 'a', key: 'k1', firstName: 'Robert', age: 34, city: 'Vienna' },
        { id: 'b', key: 'k2', firstName: 'Sarah', age: 65, city: 'Graz' },
        { id: 'c', key: 'k3', firstName: 'Grace', age: 25, city: 'Linz' },
      ];
      const el = await focusedTable(
        html`<owc-table
          .columns=${columns}
          .data=${people}
          .getRowId=${row => row.key}
        ></owc-table>`,
      );
      await press('ArrowDown');
      expect(focusedCell(el).textContent.trim()).to.equal('Sarah');
      // the ids are shuffled, the keys stay with their rows
      el.data = [
        { ...people[2], id: 'b' },
        { ...people[0], id: 'c' },
        { ...people[1], id: 'a' },
      ];
      await settle(el);
      expect(focusAt(el)).to.equal('2:0');
      expect(focusedCell(el).textContent.trim()).to.equal('Sarah');
    });

    it('follows an insert row by its id, and by its object until it has one', async () => {
      const first = { id: 'new-1', firstName: '', age: 1, city: '' };
      const second = { id: 'new-2', firstName: '', age: 2, city: '' };
      const el = await focusedTable(
        html`<owc-table
          .columns=${editableColumns}
          .data=${data}
          .insertData=${[first, second]}
        ></owc-table>`,
      );
      await press('Control+End');
      await press('ArrowLeft');
      expect(focusAt(el)).to.equal('4:1');
      expect(focusedCell(el).textContent.trim()).to.equal('2');

      // one Data Row less, as new objects: the insert rows move up
      el.data = data.slice(0, 2).map(row => ({ ...row }));
      await settle(el);
      expect(focusAt(el)).to.equal('3:1');
      expect(focusedCell(el).textContent.trim()).to.equal('2');

      // new objects with the same ids are the same rows
      el.insertData = [{ ...second }, { ...first }];
      await settle(el);
      expect(focusAt(el)).to.equal('2:1');
      expect(focusedCell(el).textContent.trim()).to.equal('2');
    });

    it('stays on an insert row without an id that is saved and comes back as a new object with its id', async () => {
      const draft = { id: '', firstName: '', age: 9, city: '' };
      const el = await focusedTable(
        html`<owc-table
          .columns=${editableColumns}
          .data=${data}
          .insertData=${[draft]}
        ></owc-table>`,
      );
      await press('Control+End');
      await press('ArrowLeft');
      expect(focusAt(el)).to.equal('3:1');

      // saved: the row gets its id, and the consumer rebuilds its rows
      draft.id = '9';
      el.data = [{ ...draft }, ...data.map(row => ({ ...row }))];
      el.insertData = [];
      await settle(el);
      expect(focusAt(el)).to.equal('0:1');
      expect(focusedCell(el).textContent.trim()).to.equal('9');
    });
  });

  describe('in a grouped table', () => {
    const people = [
      { id: '1', firstName: 'Robert', age: 34, city: 'Vienna' },
      { id: '2', firstName: 'Sarah', age: 65, city: 'Graz' },
      { id: '3', firstName: 'Grace', age: 25, city: 'Vienna' },
      { id: '4', firstName: 'Ada', age: 36, city: 'Linz' },
    ];
    /** @param {string[]} collapsed */
    const groups = (collapsed = []) =>
      ['Vienna', 'Graz', 'Linz'].map(key => ({
        key,
        label: key,
        active: !collapsed.includes(key),
      }));

    /** The focus on Grace's age, in the second row of the first group. */
    async function tableWithFocusOnGrace() {
      const el = await focusedTable(
        html`<owc-table
          .columns=${columns}
          .data=${people}
          .groupSelector=${row => row.city}
          .groupList=${groups()}
        ></owc-table>`,
      );
      // from the header of the first group
      await press('ArrowDown');
      await press('ArrowDown');
      await press('ArrowRight');
      expect(focusedCell(el).textContent.trim()).to.equal('25');
      return el;
    }

    it('follows its row when sorting moves it within its group', async () => {
      const el = await tableWithFocusOnGrace();
      el.jsonSorters = [{ field: 'firstName', order: 'asc' }];
      await settle(el);
      // Vienna: Grace, Robert
      expect(focusedCell(el).textContent.trim()).to.equal('25');
      expect(focusAt(el)).to.equal('1:1');
      await press('ArrowDown');
      expect(focusedCell(el).textContent.trim()).to.equal('34');
      expect(focusAt(el)).to.equal('2:1');
    });

    it('stays on its row when a group before it is collapsed', async () => {
      const el = await tableWithFocusOnGrace();
      await press('Control+End');
      await press('ArrowLeft');
      expect(focusedCell(el).textContent.trim()).to.equal('36');
      el.groupList = groups(['Vienna']);
      await settle(el);
      expect(focusedCell(el).textContent.trim()).to.equal('36');
      expect(cellHasFocus(el)).to.be.true;
    });

    it('goes to the next row when the group of its row is collapsed', async () => {
      const el = await tableWithFocusOnGrace();
      el.groupList = groups(['Vienna']);
      await settle(el);
      // Vienna, Graz, Sarah, Linz, Ada: Sarah is at the place Grace had in the list
      expect(focusedCell(el).textContent.trim()).to.equal('65');
      expect(focusAt(el)).to.equal('2:1');
    });
  });

  describe('when the rows are sorted or filtered', () => {
    /** The focus on Sarah's age, the second cell of the second row. */
    async function tableWithFocusOnSarah({ selectable = false } = {}) {
      const el = await focusedTable(
        html`<owc-table ?selectable=${selectable} .columns=${columns} .data=${data}></owc-table>`,
      );
      await press('ArrowDown');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('1:1');
      return el;
    }

    it('follows its row to where sorting moves it', async () => {
      const el = await tableWithFocusOnSarah();
      expect(focusedCell(el).textContent.trim()).to.equal('65');
      // Grace, Robert, Sarah
      el.jsonSorters = [{ field: 'firstName', order: 'asc' }];
      await settle(el);
      expect(focusAt(el)).to.equal('2:1');
      expect(focusedCell(el).textContent.trim()).to.equal('65');
      expect(cellHasFocus(el)).to.be.true;

      // Sarah, Robert, Grace
      el.jsonSorters = [{ field: 'firstName', order: 'desc' }];
      await settle(el);
      expect(focusAt(el)).to.equal('0:1');
      expect(focusedCell(el).textContent.trim()).to.equal('65');
      await press('ArrowDown');
      expect(focusedCell(el).textContent.trim()).to.equal('34');
    });

    it('stays on its row when filtering removes other rows', async () => {
      const el = await tableWithFocusOnSarah();
      el.filter = row => row.firstName !== 'Robert';
      await settle(el);
      expect(focusAt(el)).to.equal('0:1');
      expect(focusedCell(el).textContent.trim()).to.equal('65');
    });

    it('goes to the row now at its place when filtering removes its row', async () => {
      const el = await tableWithFocusOnSarah();
      el.filter = row => row.firstName !== 'Sarah';
      await settle(el);
      // Robert, Grace
      expect(focusAt(el)).to.equal('1:1');
      expect(focusedCell(el).textContent.trim()).to.equal('25');

      // Grace was the last row: the row that is last now takes her place
      el.filter = row => row.firstName === 'Robert';
      await settle(el);
      expect(focusAt(el)).to.equal('0:1');
      expect(focusedCell(el).textContent.trim()).to.equal('34');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('0:2');
    });

    it('goes to the message when filtering leaves no rows, and back to a row when there are rows again', async () => {
      const el = await tableWithFocusOnSarah();
      el.filter = () => false;
      await settle(el);
      expect(focusAt(el)).to.equal('empty');
      expect(cellHasFocus(el)).to.be.true;

      el.filter = null;
      await settle(el);
      expect(focusAt(el)).to.equal('0:1');
      expect(cellHasFocus(el)).to.be.true;
    });

    it("follows its row with the focus on the cell's control", async () => {
      const el = await tableWithFocusOnSarah({ selectable: true });
      await press('ArrowLeft');
      expect(focusAt(el)).to.equal('1:0');
      expect(deepActiveElement().matches('input[type="checkbox"]')).to.be.true;

      el.jsonSorters = [{ field: 'firstName', order: 'asc' }];
      await settle(el);
      expect(focusAt(el)).to.equal('2:0');
      expect(deepActiveElement().matches('input[type="checkbox"]')).to.be.true;
      await press('ArrowRight');
      expect(focusedCell(el).textContent.trim()).to.equal('Sarah');
    });
  });

  describe('when the focus is outside the table', () => {
    it("isn't taken back when the rows are sorted, filtered or replaced", async () => {
      const { el } = await betweenButtons(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
      await press('Tab');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:0');
      await press('Tab');
      expect(focusAt(el)).to.equal('#after');

      /** @type {Array<[string, Partial<Table>]>} */
      const changes = [
        ['a sort', { jsonSorters: [{ field: 'firstName', order: 'asc' }] }],
        ['a filter without its row', { filter: row => row.firstName !== 'Sarah' }],
        ['a filter without any row', { filter: () => false }],
        ['no filter', { filter: null }],
        ['new row objects', { data: data.map(row => ({ ...row })) }],
        ['a render', {}],
      ];
      for (const [name, change] of changes) {
        Object.assign(el, change);
        el.requestUpdate();
        await settle(el);
        await nextFrame();
        expect(focusAt(el), `after ${name}`).to.equal('#after');
      }
      // and the table still knows its row: Grace, Robert, Sarah
      await press('Shift+Tab');
      expect(focusAt(el)).to.equal('2:0');
      expect(focusedCell(el).textContent.trim()).to.equal('Sarah');
    });

    it("isn't taken back when a detail finishes loading", async () => {
      /** @type {(detail: unknown) => void} */
      let resolveDetail;
      const detail = new Promise(resolve => {
        resolveDetail = resolve;
      });
      const { el } = await betweenButtons(
        html`<owc-table
          render-mode="detailDeferred"
          .columns=${columns}
          .data=${data}
          .renderDetail=${() => detail}
        ></owc-table>`,
      );
      /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
      await press('Tab');
      expect(focusAt(el)).to.equal('0:0');
      el.openDetails = ['1'];
      await settle(el);
      expect(el.shadowRoot.querySelector('wa-details[open] wa-spinner')).to.exist;
      expect(focusAt(el), 'opening a detail leaves the focus on its cell').to.equal('0:0');

      await press('Tab');
      expect(focusAt(el)).to.equal('#after');
      resolveDetail(html`<p class="loaded">Loaded <button>Action</button></p>`);
      await waitUntil(() => el.shadowRoot.querySelector('.loaded'), 'the detail has loaded');
      await settle(el);
      await nextFrame();
      expect(focusAt(el)).to.equal('#after');
    });
  });

  for (const [name, container] of Object.entries(containers)) {
    describe(`in a table of 100,000 rows scrolled by ${name}`, () => {
      /** @returns {Promise<{ el: Table, scroller: Element }>} */
      async function largeTable() {
        const result = await container(
          html`<owc-table .columns=${columns} .data=${rows(100_000)}></owc-table>`,
        );
        /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
        await press('Tab');
        await press('ArrowDown');
        await press('ArrowDown');
        await press('ArrowRight');
        expect(focusAt(result.el)).to.equal('2:1');
        return result;
      }

      it('parks the focus on the grid when the focused row is scrolled away, and ↓ goes on from that row', async () => {
        const { el, scroller } = await largeTable();
        await scrollTo(el, scroller, 500_000);
        expect(Number(bodyRows(el)[0].dataset.index)).to.be.above(1000);
        expect(gridHasFocus(el), `the focus is on ${focusAt(el)}`).to.be.true;
        // parking neither scrolls nor says anything
        expect(scroller.scrollTop).to.equal(500_000);
        expect(liveRegion(el).textContent).to.equal('');

        await press('ArrowDown');
        await waitUntil(() => focusAt(el) === '3:1', 'the next row gets the focus');
        expect(focusedCell(el).textContent.trim()).to.equal('3');
        expect(isInView(focusedCell(el), scroller)).to.be.true;
      });

      it('moves the focus straight from the cell to the grid, not by way of the page', async () => {
        const { el, scroller } = await largeTable();
        const cell = focusedCell(el);
        /** @type {Array<EventTarget | null>} */
        const cameFrom = [];
        grid(el).addEventListener('focusin', event => {
          if (event.target === grid(el)) {
            cameFrom.push(event.relatedTarget);
          }
        });
        await scrollTo(el, scroller, 500_000);
        expect(gridHasFocus(el)).to.be.true;
        expect(cameFrom).to.have.length(1);
        expect(cameFrom[0] === cell, 'the grid got the focus from the cell').to.be.true;
      });

      it('parks the focus when sorting moves its row out of the rendered rows, and ↓ goes on from where the row is now', async () => {
        const { el, scroller } = await largeTable();
        el.jsonSorters = [{ field: 'age', order: 'desc' }];
        await settle(el);
        expect(bodyRows(el)[0].textContent).to.contain('Person 99999');
        expect(gridHasFocus(el), `the focus is on ${focusAt(el)}`).to.be.true;
        expect(scroller.scrollTop).to.equal(0);

        // Person 2 is the third last row now, and Person 1 the one after it
        await press('ArrowDown');
        await waitUntil(() => focusAt(el) === '99998:1', 'the next row gets the focus');
        expect(focusedCell(el).textContent.trim()).to.equal('1');
        expect(isInView(focusedCell(el), scroller)).to.be.true;
      });

      it('goes to the row now at its place when filtering removes its row', async () => {
        const { el } = await largeTable();
        el.filter = row => row.age !== 2;
        await settle(el);
        expect(focusAt(el)).to.equal('2:1');
        expect(focusedCell(el).textContent.trim()).to.equal('3');
      });

      it('stays on its row when new objects with the same ids replace the rows', async () => {
        const { el, scroller } = await largeTable();
        el.data = rows(100_000);
        await settle(el);
        expect(focusAt(el)).to.equal('2:1');
        expect(focusedCell(el).textContent.trim()).to.equal('2');

        // also while its row isn't rendered
        await scrollTo(el, scroller, 500_000);
        el.data = rows(100_000);
        await settle(el);
        expect(gridHasFocus(el), `the focus is on ${focusAt(el)}`).to.be.true;
        await press('ArrowUp');
        await waitUntil(() => focusAt(el) === '1:1', 'the row before gets the focus');
        expect(focusedCell(el).textContent.trim()).to.equal('1');
      });

      it('takes the focus back on its cell when its row is scrolled back in', async () => {
        const { el, scroller } = await largeTable();
        await scrollTo(el, scroller, 500_000);
        expect(gridHasFocus(el)).to.be.true;
        await scrollTo(el, scroller, 0);
        expect(focusAt(el)).to.equal('2:1');
        expect(cellHasFocus(el)).to.be.true;
        expect(scroller.scrollTop).to.equal(0);
        // the grid can't take the focus anymore
        expect(grid(el).hasAttribute('tabindex')).to.be.false;
      });

      it('takes the focus back on the control of its cell, also in rows that are new', async () => {
        const result = await container(
          html`<owc-table selectable .columns=${columns} .data=${rows(100_000)}></owc-table>`,
        );
        const { el, scroller } = result;
        /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
        await press('Tab');
        await press('ArrowDown');
        expect(focusAt(el)).to.equal('1:0');
        const onCheckbox = () => deepActiveElement().matches('input[type="checkbox"]');
        expect(onCheckbox()).to.be.true;

        await scrollTo(el, scroller, 500_000);
        expect(gridHasFocus(el)).to.be.true;
        await scrollTo(el, scroller, 0);
        await waitUntil(onCheckbox, 'the checkbox gets the focus');
        expect(focusAt(el)).to.equal('1:0');

        el.data = rows(100_000);
        await settle(el);
        await waitUntil(onCheckbox, 'the checkbox of the new row gets the focus');
        expect(focusAt(el)).to.equal('1:0');
        await press('Space');
        expect(el.selectedData.map(row => row.id)).to.deep.equal(['2']);
      });

      it("doesn't take the focus back when it left while a row was brought in", async () => {
        const { el, scroller } = await largeTable();
        await press('Control+End');
        await press('Shift+Tab');
        expect(focusAt(el)).to.equal('#before');
        await settle(el);
        await nextFrame();
        expect(focusAt(el)).to.equal('#before');
        if (scroller !== document.scrollingElement) {
          expect(bodyRows(el).at(-1).dataset.index, 'the table went to its end').to.equal('99999');
        }

        // the cell the focus was on its way to is the one that comes back
        await press('Tab');
        await waitUntil(() => focusAt(el) === '99999:2', 'the last cell gets the focus');
        expect(isInView(focusedCell(el), scroller)).to.be.true;
      });

      it("isn't taken back from outside the table by scrolling, sorting or new rows", async () => {
        const { el, scroller } = await largeTable();
        await press('Tab');
        expect(focusAt(el)).to.equal('#after');
        await scrollTo(el, scroller, 500_000);
        expect(focusAt(el)).to.equal('#after');
        await scrollTo(el, scroller, 0);
        expect(focusAt(el)).to.equal('#after');
        el.jsonSorters = [{ field: 'age', order: 'desc' }];
        await settle(el);
        expect(focusAt(el)).to.equal('#after');
        el.data = rows(100_000);
        await settle(el);
        await nextFrame();
        expect(focusAt(el)).to.equal('#after');
      });

      it('stays one Tab stop while the focus is parked, and tabbing back in brings the row back', async () => {
        const { el, scroller } = await largeTable();
        await scrollTo(el, scroller, 500_000);
        expect(gridHasFocus(el)).to.be.true;
        await press('Tab');
        expect(focusAt(el)).to.equal('#after');
        await press('Shift+Tab');
        await waitUntil(() => focusAt(el) === '2:1', 'the remembered cell gets the focus');
        expect(focusedCell(el).textContent.trim()).to.equal('2');
        expect(isInView(focusedCell(el), scroller)).to.be.true;

        await scrollTo(el, scroller, 500_000);
        expect(gridHasFocus(el)).to.be.true;
        await press('Shift+Tab');
        expect(focusAt(el)).to.equal('#before');
        // rendering doesn't take the focus back
        el.requestUpdate();
        await settle(el);
        expect(focusAt(el)).to.equal('#before');

        await press('Tab');
        await waitUntil(() => focusAt(el) === '2:1', 'the remembered cell gets the focus again');
        expect(isInView(focusedCell(el), scroller)).to.be.true;
        await press('Shift+Tab');
        expect(focusAt(el)).to.equal('#before');
      });
    });
  }
});
