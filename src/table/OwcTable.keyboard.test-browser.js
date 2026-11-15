import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import { deepActiveElement } from '../a11y/controls.js';
import { composedControlTemplates } from '../a11y/controls.test-browser.helpers.js';
import { visibleArea } from '../virtualizer/virtualList.test-browser.helpers.js';
import {
  columns,
  data,
  rows,
  settle,
  grid,
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
  isInView,
  editableColumns,
  fullTable,
  twoButtons,
  textInput,
  shadowButton,
  containers,
} from './OwcTable.test-browser.helpers.js';

/** @typedef {import('./OwcTable.test-browser.helpers.js').Table} Table */

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table keyboard', () => {
  describe('one Tab stop', () => {
    it('takes the focus on the first cell of the first body row, and Tab leaves it again', async () => {
      const { el, before, after } = await betweenButtons(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      before.focus();
      await press('Tab');
      expect(focusAt(el)).to.equal('0:0');
      expect(cellHasFocus(el)).to.be.true;
      expect(focusedCell(el).textContent.trim()).to.equal('Robert');
      await press('Tab');
      expect(focusAt(el)).to.equal('#after');

      await press('Shift+Tab');
      expect(focusAt(el)).to.equal('0:0');
      await press('Shift+Tab');
      expect(focusAt(el)).to.equal('#before');
      expect(after === document.activeElement).to.be.false;
    });

    it('restores the last focused cell when tabbing back in', async () => {
      const { el } = await betweenButtons(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
      await press('Tab');
      await press('ArrowDown');
      await press('ArrowRight');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('1:2');

      await press('Tab');
      expect(focusAt(el)).to.equal('#after');
      await press('Shift+Tab');
      expect(focusAt(el)).to.equal('1:2');

      await press('Shift+Tab');
      expect(focusAt(el)).to.equal('#before');
      await press('Tab');
      expect(focusAt(el)).to.equal('1:2');
    });

    it('restores a header cell when tabbing back in', async () => {
      const { el } = await betweenButtons(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
      await press('Tab');
      await press('ArrowUp');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('header:1');
      await press('Tab');
      await press('Shift+Tab');
      expect(focusAt(el)).to.equal('header:1');
    });

    it('has no control that Tab reaches in a selectable, editable table with links, details and sortable headers', async () => {
      const { el, before, after } = await betweenButtons(fullTable);
      // selector and detail toggle, the row link, an editable cell and an insert row with open editors
      expect(el.shadowRoot.querySelectorAll('wa-checkbox')).to.have.length(5);
      expect(el.shadowRoot.querySelectorAll('owc-icon-button')).to.have.length(4);
      expect(el.shadowRoot.querySelectorAll('a.row-click')).to.have.length(3);
      expect(el.shadowRoot.querySelectorAll('owc-click-editable-input')).to.have.length(4);
      expect(el.shadowRoot.querySelectorAll('owc-click-editable-input[editable]')).to.have.length(
        1,
      );

      expect(await tabStops(el, before, after)).to.deep.equal(['0:0']);
      expect(await tabStops(el, after, before, 'Shift+Tab')).to.deep.equal(['0:0']);
    });

    it('leaves the grid with Tab and Shift+Tab from every kind of cell', async () => {
      const { el, before, after } = await betweenButtons(fullTable);
      before.focus();
      await press('Tab');
      // The columns: detail toggle, selector, First Name (editable), Age, City.
      const stops = [
        ['ArrowRight', '0:1'], // the row's checkbox
        ['ArrowRight', '0:2'], // an editable cell
        ['ArrowRight', '0:3'], // a plain cell
        ['ArrowUp', 'header:3'], // a sortable header
        ['ArrowLeft', 'header:2'],
        ['ArrowLeft', 'header:1'], // the select-all checkbox
        ['ArrowLeft', 'header:0'],
        ['ArrowDown', '0:0'], // the detail toggle
      ];
      for (const [key, at] of stops) {
        await press(key);
        expect(focusAt(el), `after ${key}`).to.equal(at);
        expect(await tabStops(el, before, after), `Tab with the focus last at ${at}`).to.deep.equal(
          [at],
        );
        expect(
          await tabStops(el, after, before, 'Shift+Tab'),
          `Shift+Tab with the focus last at ${at}`,
        ).to.deep.equal([at]);
        await press('Tab');
        expect(focusAt(el)).to.equal(at);
        await press('Tab');
        expect(focusAt(el), `Tab from ${at}`).to.equal('#after');
        await press('Shift+Tab');
        expect(focusAt(el)).to.equal(at);
        await press('Shift+Tab');
        expect(focusAt(el), `Shift+Tab from ${at}`).to.equal('#before');
        await press('Tab');
      }
    });

    it('has no control that Tab reaches in cells with custom content', async () => {
      const { el, before, after } = await betweenButtons(
        html`<owc-table
          .columns=${[columns[0], twoButtons, textInput, shadowButton]}
          .data=${data}
        ></owc-table>`,
      );
      expect(await tabStops(el, before, after)).to.deep.equal(['0:0']);
      expect(await tabStops(el, after, before, 'Shift+Tab')).to.deep.equal(['0:0']);
    });

    it('keeps controls out of the Tab order that rows bring in while scrolling', async () => {
      const wrapper = await fixture(html`
        <div>
          <button id="before">before</button>
          <div id="box" style="height: 300px; overflow: auto">
            <owc-table
              selectable
              virtualizer-mode="always"
              .columns=${[columns[0], twoButtons]}
              .data=${rows(500)}
            ></owc-table>
          </div>
          <button id="after">after</button>
        </div>
      `);
      const el = /** @type {Table} */ (wrapper.querySelector('owc-table'));
      const box = /** @type {HTMLElement} */ (wrapper.querySelector('#box'));
      await settle(el);
      box.scrollTop = 5000;
      await settle(el);
      expect(Number(bodyRows(el)[0].dataset.index)).to.be.above(50);
      const stops = await tabStops(
        el,
        /** @type {HTMLElement} */ (wrapper.querySelector('#before')),
        /** @type {HTMLElement} */ (wrapper.querySelector('#after')),
      );
      expect(stops).to.have.length(1);
    });

    it("brings the last focused cell back when it isn't rendered anymore", async () => {
      const wrapper = await fixture(html`
        <div>
          <button id="before">before</button>
          <div id="box" style="height: 300px; overflow: auto">
            <owc-table .columns=${columns} .data=${rows(1000)}></owc-table>
          </div>
          <button id="after">after</button>
        </div>
      `);
      const el = /** @type {Table} */ (wrapper.querySelector('owc-table'));
      const box = /** @type {HTMLElement} */ (wrapper.querySelector('#box'));
      const before = /** @type {HTMLElement} */ (wrapper.querySelector('#before'));
      await settle(el);
      before.focus();
      await press('Tab');
      await press('ArrowDown');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('2:0');
      await press('Shift+Tab');
      expect(focusAt(el)).to.equal('#before');

      box.scrollTop = 20_000;
      await settle(el);
      expect(Number(bodyRows(el)[0].dataset.index)).to.be.above(100);

      await press('Tab');
      await waitUntil(() => focusAt(el) === '2:0', 'the last focused cell gets the focus');
      expect(focusedCell(el).textContent.trim()).to.equal('Person 2');
      expect(isInView(focusedCell(el), box)).to.be.true;
      await press('Tab');
      expect(focusAt(el)).to.equal('#after');
    });

    it('takes the focus on the message of an empty table', async () => {
      const { el } = await betweenButtons(
        html`<owc-table .columns=${columns} .data=${[]}></owc-table>`,
      );
      /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
      await press('Tab');
      expect(focusAt(el)).to.equal('empty');
      expect(cellHasFocus(el)).to.be.true;
      await press('Tab');
      expect(focusAt(el)).to.equal('#after');
    });

    it('stays one Tab stop when its rows change', async () => {
      const { el, before, after } = await betweenButtons(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      before.focus();
      await press('Tab');
      await press('ArrowDown');
      expect(focusedCell(el).textContent.trim()).to.equal('Sarah');
      await press('Tab');

      el.jsonSorters = [{ field: 'firstName', order: 'asc' }];
      await settle(el);
      expect(await tabStops(el, before, after)).to.have.length(1);
      // Grace, Robert, Sarah: the remembered row moved, and is still the Tab stop
      await press('Shift+Tab');
      expect(focusedCell(el).textContent.trim()).to.equal('Sarah');
      await press('Tab');

      el.data = [];
      await settle(el);
      expect(await tabStops(el, before, after)).to.deep.equal(['empty']);

      el.data = rows(2);
      await settle(el);
      expect(await tabStops(el, before, after)).to.deep.equal(['0:0']);
    });
  });

  describe('navigation keys', () => {
    const plainTable = html`<owc-table .columns=${columns} .data=${data}></owc-table>`;

    it('moves between cells with the arrow keys', async () => {
      const el = await focusedTable(plainTable);
      const moves = [
        ['ArrowRight', '0:1'],
        ['ArrowDown', '1:1'],
        ['ArrowDown', '2:1'],
        ['ArrowRight', '2:2'],
        ['ArrowUp', '1:2'],
        ['ArrowLeft', '1:1'],
        ['ArrowLeft', '1:0'],
      ];
      for (const [key, at] of moves) {
        await press(key);
        expect(focusAt(el), `after ${key}`).to.equal(at);
        expect(cellHasFocus(el)).to.be.true;
      }
    });

    it("doesn't wrap at the ends of rows and columns", async () => {
      const el = await focusedTable(plainTable);
      await press('ArrowLeft');
      expect(focusAt(el)).to.equal('0:0');
      await press('ArrowRight');
      await press('ArrowRight');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('0:2');
      await press('ArrowDown');
      await press('ArrowDown');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('2:2');
    });

    it('reaches the header row with ↑ from the first body row, and stops there', async () => {
      const el = await focusedTable(plainTable);
      await press('ArrowRight');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('header:1');
      expect(cellHasFocus(el)).to.be.true;
      expect(focusedCell(el).getAttribute('role')).to.equal('columnheader');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('header:1');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('header:2');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('0:2');
    });

    it('goes to the first and last cell of a row with Home and End', async () => {
      const el = await focusedTable(plainTable);
      await press('ArrowDown');
      await press('End');
      expect(focusAt(el)).to.equal('1:2');
      await press('Home');
      expect(focusAt(el)).to.equal('1:0');
      await press('ArrowUp');
      await press('ArrowUp');
      await press('End');
      expect(focusAt(el)).to.equal('header:2');
      await press('Home');
      expect(focusAt(el)).to.equal('header:0');
    });

    it('goes to the last cell of the last row with Ctrl+End, and to the first cell of the first body row with Ctrl+Home', async () => {
      const el = await focusedTable(plainTable);
      await press('Control+End');
      expect(focusAt(el)).to.equal('2:2');
      await press('Control+Home');
      expect(focusAt(el)).to.equal('0:0');
      await press('ArrowUp');
      await press('End');
      expect(focusAt(el)).to.equal('header:2');
      await press('Control+Home');
      expect(focusAt(el)).to.equal('0:0');
    });

    it('moves into insert rows', async () => {
      const el = await focusedTable(
        html`<owc-table
          .columns=${editableColumns}
          .data=${data}
          .insertData=${[{ id: '', firstName: '', age: 0, city: '' }]}
        ></owc-table>`,
      );
      await press('Control+End');
      expect(focusAt(el)).to.equal('3:2');
      await press('ArrowLeft');
      expect(focusAt(el)).to.equal('3:1');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('2:1');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('3:1');
    });

    it('keeps its navigation keys from scrolling the page, and leaves other keys alone', async () => {
      const el = await focusedTable(plainTable);
      /** @type {Record<string, boolean>} */
      const prevented = {};
      /** @param {KeyboardEvent} event */
      const listener = event => {
        if (['Shift', 'Alt', 'Control', 'Meta'].includes(event.key)) {
          return;
        }
        prevented[`${event.shiftKey ? 'Shift+' : ''}${event.altKey ? 'Alt+' : ''}${event.key}`] =
          event.defaultPrevented;
      };
      window.addEventListener('keydown', listener);
      try {
        for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'End', 'PageDown', 'PageUp']) {
          await press(key);
        }
        expect(focusAt(el)).to.equal('0:2');
        await press('Shift+ArrowLeft');
        await press('Alt+ArrowDown');
        await press('a');
        expect(focusAt(el)).to.equal('0:2');
      } finally {
        window.removeEventListener('keydown', listener);
      }
      expect(prevented).to.deep.equal({
        ArrowUp: true,
        ArrowDown: true,
        End: true,
        PageDown: true,
        PageUp: true,
        'Shift+ArrowLeft': false,
        'Alt+ArrowDown': false,
        a: false,
      });
    });

    it('treats the message of an empty table as a row with one cell', async () => {
      const el = await focusedTable(html`<owc-table .columns=${columns} .data=${[]}></owc-table>`);
      expect(focusAt(el)).to.equal('empty');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('header:0');
      await press('ArrowRight');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('header:2');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('empty');
      // ← and → don't move off the cell, and ↑ comes back to the column the user left
      await press('ArrowLeft');
      await press('Home');
      expect(focusAt(el)).to.equal('empty');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('header:2');
      await press('Control+End');
      expect(focusAt(el)).to.equal('empty');
    });

    for (const mode of ['never', 'always']) {
      describe(`in a scroll box (virtualizer-mode="${mode}")`, () => {
        /** @param {{ sticky?: boolean }} [options] */
        async function tableInBox({ sticky = false } = {}) {
          const wrapper = await fixture(html`
            <div>
              <button id="before">before</button>
              <div id="box" style="height: 300px; width: 400px; overflow: auto">
                <owc-table
                  virtualizer-mode=${mode}
                  ?sticky-header=${sticky}
                  .columns=${[
                    { label: 'First Name', field: 'firstName', width: 250 },
                    { label: 'Age', field: 'age', formatter: 'number', width: 250 },
                    { label: 'City', field: 'city', width: 250 },
                  ]}
                  .data=${rows(100)}
                ></owc-table>
              </div>
            </div>
          `);
          const el = /** @type {Table} */ (wrapper.querySelector('owc-table'));
          const box = /** @type {HTMLElement} */ (wrapper.querySelector('#box'));
          await settle(el);
          /** @type {HTMLElement} */ (wrapper.querySelector('#before')).focus();
          await press('Tab');
          return { el, box };
        }

        /**
         * The body rows that are fully visible in the box, below the header row.
         *
         * @param {Table} el
         * @param {HTMLElement} box
         */
        function visibleRows(el, box) {
          const top = headerRow(el).getBoundingClientRect().bottom;
          const { bottom } = visibleArea(box);
          return bodyRows(el).filter(row => {
            const rect = row.getBoundingClientRect();
            return rect.top >= top - 0.5 && rect.bottom <= bottom + 0.5;
          }).length;
        }

        it('moves by the rows that fit into the visible part with PageDown and PageUp', async () => {
          const { el, box } = await tableInBox({ sticky: true });
          const page = visibleRows(el, box);
          expect(page).to.be.within(3, 8);
          await press('ArrowRight');
          await press('PageDown');
          await waitUntil(() => focusAt(el) === `${page}:1`, `focus at ${page}:1`);
          await press('PageDown');
          await waitUntil(() => focusAt(el) === `${2 * page}:1`, `focus at ${2 * page}:1`);
          await press('ArrowDown');
          await press('PageUp');
          await waitUntil(() => focusAt(el) === `${page + 1}:1`, `focus at ${page + 1}:1`);
        });

        it('stops PageUp at the first body row and PageDown at the last row', async () => {
          const { el } = await tableInBox();
          await press('ArrowDown');
          await press('PageUp');
          expect(focusAt(el)).to.equal('0:0');
          await press('PageUp');
          expect(focusAt(el)).to.equal('0:0');
          await press('Control+End');
          await waitUntil(() => focusAt(el) === '99:2');
          await press('PageDown');
          expect(focusAt(el)).to.equal('99:2');
        });

        it('scrolls the focused cell into view, in both directions', async () => {
          const { el, box } = await tableInBox();
          for (let presses = 0; presses < 12; presses++) {
            await press('ArrowDown');
          }
          await waitUntil(() => focusAt(el) === '12:0');
          expect(isInView(focusedCell(el), box)).to.be.true;
          await press('End');
          expect(focusAt(el)).to.equal('12:2');
          expect(isInView(focusedCell(el), box)).to.be.true;
          await press('Home');
          expect(isInView(focusedCell(el), box)).to.be.true;
        });

        it("doesn't put the focused cell under a sticky header", async () => {
          const { el, box } = await tableInBox({ sticky: true });
          await press('PageDown');
          await press('PageDown');
          await press('PageDown');
          await waitUntil(() => box.scrollTop > 100);
          const start = Number(focusAt(el).split(':')[0]);
          for (let row = start - 1; row > start - 8; row--) {
            await press('ArrowUp');
            await waitUntil(() => focusAt(el) === `${row}:0`, `focus at ${row}:0`);
            const headerBottom = headerRow(el).getBoundingClientRect().bottom;
            expect(isInView(focusedCell(el), box, headerBottom), `row ${row} is in view`).to.be
              .true;
          }
        });
      });
    }

    describe('in a table of 100,000 rows', () => {
      for (const [name, container] of Object.entries(containers)) {
        describe(`scrolled by ${name}`, () => {
          /** @returns {Promise<{ el: Table, scroller: Element }>} */
          async function largeTable() {
            const result = await container(
              html`<owc-table .columns=${columns} .data=${rows(100_000)}></owc-table>`,
            );
            /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
            await press('Tab');
            expect(focusAt(result.el)).to.equal('0:0');
            return result;
          }

          it('goes to the last cell of the last row with Ctrl+End, and back with Ctrl+Home', async () => {
            const { el, scroller } = await largeTable();
            await press('Control+End');
            await waitUntil(() => focusAt(el) === '99999:2', 'the last cell gets the focus');
            expect(focusedCell(el).textContent.trim()).to.equal('City 99999');
            expect(isInView(focusedCell(el), scroller)).to.be.true;
            expect(focusedCell(el).parentElement.getAttribute('aria-rowindex')).to.equal('100001');
            // the grid held the focus while the row was brought in, and can't take it anymore
            expect(grid(el).hasAttribute('tabindex')).to.be.false;

            await press('Control+Home');
            await waitUntil(() => focusAt(el) === '0:0', 'the first cell gets the focus');
            expect(isInView(focusedCell(el), scroller)).to.be.true;
          });

          it('moves on from the last row once it has the focus', async () => {
            const { el } = await largeTable();
            await press('Control+End');
            await waitUntil(() => focusAt(el) === '99999:2');
            await press('ArrowUp');
            await press('ArrowLeft');
            expect(focusAt(el)).to.equal('99998:1');
            await press('ArrowDown');
            await press('ArrowDown');
            expect(focusAt(el)).to.equal('99999:1');
          });

          it('pages through rows that are rendered on the way', async () => {
            const { el, scroller } = await largeTable();
            const rendered = bodyRows(el).length;
            let row = 0;
            for (let presses = 0; row <= rendered * 2 && presses < 200; presses++) {
              await press('PageDown');
              // the grid holds the focus while a row is brought in
              await waitUntil(
                () => /^\d+:0$/.test(focusAt(el)) && focusAt(el) !== `${row}:0`,
                'the focus moves on to a cell',
              );
              const next = Number(focusAt(el).split(':')[0]);
              expect(next, 'a page further down').to.be.above(row);
              row = next;
            }
            expect(row).to.be.above(rendered * 2);
            expect(isInView(focusedCell(el), scroller)).to.be.true;
          });

          it('keeps up with keys that arrive while a row is brought in', async () => {
            const { el, scroller } = await largeTable();
            await press('Control+End');
            await press('ArrowUp');
            await press('ArrowUp');
            await press('ArrowLeft');
            await waitUntil(() => focusAt(el) === '99997:1', 'the keys add up');
            expect(isInView(focusedCell(el), scroller)).to.be.true;
          });

          it('never drops the focus to the page while a row is brought in', async () => {
            const { el } = await largeTable();
            const outside = [];
            const watch = () => {
              if (deepActiveElement() === document.body) {
                outside.push('body');
              }
            };
            const observer = new MutationObserver(watch);
            observer.observe(el.shadowRoot, { childList: true, subtree: true });
            await press('Control+End');
            await waitUntil(() => focusAt(el) === '99999:2');
            observer.disconnect();
            expect(outside).to.deep.equal([]);
          });
        });
      }
    });
  });

  describe('what gets the focus in a cell', () => {
    for (const [name, content] of Object.entries(composedControlTemplates)) {
      it(`cycles through shadow controls and ${name}, then leaves the cell with Escape`, async () => {
        const { el, before, after } = await betweenButtons(
          html`<owc-table
            .columns=${[{ label: 'Custom', field: 'firstName', formatter: () => content }]}
            .data=${data.slice(0, 1)}
          ></owc-table>`,
        );
        before.focus();
        await press('Tab');
        expect(cellHasFocus(el)).to.be.true;
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
        expect(cellHasFocus(el)).to.be.true;
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

    it('is the cell itself when it has no controls', async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(cellHasFocus(el)).to.be.true;
      expect(focusedCell(el).getAttribute('role')).to.equal('gridcell');
    });

    it("is the row's checkbox in the selector cell, which Space toggles", async () => {
      const el = await focusedTable(
        html`<owc-table selectable .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(focusAt(el)).to.equal('0:0');
      expect(deepActiveElement().matches('input[type="checkbox"]')).to.be.true;
      expect(el.shadowRoot.activeElement.localName).to.equal('wa-checkbox');
      await press('Space');
      expect(el.selectedData).to.deep.equal([data[0]]);
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:0');
      expect(deepActiveElement().matches('input[type="checkbox"]')).to.be.true;
      await press('Space');
      expect(el.selectedData).to.deep.equal([data[0], data[1]]);
    });

    it('is the select-all checkbox in its header cell', async () => {
      const el = await focusedTable(
        html`<owc-table selectable .columns=${columns} .data=${data}></owc-table>`,
      );
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('header:0');
      expect(deepActiveElement().matches('input[type="checkbox"]')).to.be.true;
      await press('Space');
      await el.updateComplete;
      expect(el.selectedData).to.have.length(3);
    });

    it('is the header cell itself for a sortable column, not its sort button', async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      await press('ArrowUp');
      expect(
        focusedCell(el).querySelector('owc-table-header-cell').shadowRoot.querySelector('button'),
      ).to.exist;
      expect(cellHasFocus(el)).to.be.true;
    });

    it('is the detail toggle in its cell, which Enter operates', async () => {
      const el = await focusedTable(
        html`<owc-table
          render-mode="linkWithDetail"
          .columns=${columns}
          .data=${data}
          .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
          .renderDetail=${() => html`<p>Detail</p>`}
        ></owc-table>`,
      );
      expect(focusAt(el)).to.equal('0:0');
      expect(el.shadowRoot.activeElement.localName).to.equal('owc-icon-button');
      expect(deepActiveElement().localName).to.equal('button');
      await press('Enter');
      expect(el.openDetails).to.deep.equal(['1']);
    });

    it('is the link of a cell with one link', async () => {
      const el = await focusedTable(
        html`<owc-table
          .columns=${[
            {
              label: 'Profile',
              field: 'profile',
              formatter: row => html`<a href="#profile-${row.id}">${row.firstName}</a>`,
            },
            columns[1],
          ]}
          .data=${data}
        ></owc-table>`,
      );
      expect(focusAt(el)).to.equal('0:0');
      expect(deepActiveElement().getAttribute('href')).to.equal('#profile-1');
      await press('ArrowDown');
      expect(deepActiveElement().getAttribute('href')).to.equal('#profile-2');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('1:1');
      expect(cellHasFocus(el)).to.be.true;
    });

    it("is an editable cell's read view, which the arrow keys move on from", async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${editableColumns} .data=${data}></owc-table>`,
      );
      expect(focusAt(el)).to.equal('0:0');
      expect(el.shadowRoot.activeElement.localName).to.equal('owc-click-editable-input');
      expect(deepActiveElement().classList.contains('display')).to.be.true;
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:0');
      expect(deepActiveElement().classList.contains('display')).to.be.true;
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('1:1');
    });

    it('leaves every key to an editor while it edits', async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${editableColumns} .data=${data}></owc-table>`,
      );
      await press('Enter');
      await waitUntil(() => deepActiveElement().localName === 'input', 'the editor has the focus');
      await sendKeys({ type: 'x' });
      await press('ArrowLeft');
      await press('ArrowDown');
      await press('Home');
      expect(focusAt(el)).to.equal('0:0');
      expect(deepActiveElement().localName).to.equal('input');
      await press('Escape');
      await waitUntil(() => deepActiveElement().classList.contains('display'));
      expect(focusAt(el)).to.equal('0:0');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:0');
    });

    it('is the cell whose text is clicked, from where the keys move on', async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(focusAt(el)).to.equal('0:0');
      const text = cellsOf(bodyRows(el)[2])[2].querySelector('.cell-text').getBoundingClientRect();
      await sendMouse({
        type: 'click',
        position: [Math.round(text.left + text.width / 2), Math.round(text.top + text.height / 2)],
      });
      expect(focusAt(el)).to.equal('2:2');
      expect(cellHasFocus(el)).to.be.true;
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('1:2');
      await press('Tab');
      expect(focusAt(el)).to.equal('#after');
      await press('Shift+Tab');
      expect(focusAt(el)).to.equal('1:2');
    });

    it('is the cell that is clicked beside its text, not the grid itself', async () => {
      const { el } = await betweenButtons(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(grid(el).hasAttribute('tabindex')).to.be.false;
      // the padding of a cell
      const cell = cellsOf(bodyRows(el)[1])[1].getBoundingClientRect();
      await sendMouse({
        type: 'click',
        position: [Math.round(cell.left + 4), Math.round(cell.top + 4)],
      });
      expect(el.shadowRoot.activeElement === grid(el)).to.be.false;
      expect(focusAt(el)).to.equal('1:1');
      expect(cellHasFocus(el)).to.be.true;
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('2:1');
    });

    it("is the cell's control when the cell is clicked beside it", async () => {
      const { el } = await betweenButtons(
        html`<owc-table
          .columns=${[
            columns[0],
            {
              label: 'Profile',
              field: 'profile',
              formatter: row => html`<a href="#profile-${row.id}">${row.firstName}</a>`,
            },
          ]}
          .data=${data}
        ></owc-table>`,
      );
      const cell = cellsOf(bodyRows(el)[1])[1].getBoundingClientRect();
      await sendMouse({
        type: 'click',
        position: [Math.round(cell.left + 4), Math.round(cell.top + 4)],
      });
      expect(focusAt(el)).to.equal('1:1');
      expect(deepActiveElement().getAttribute('href')).to.equal('#profile-2');
    });

    it('moves the focus on from a control when the pointer focuses it', async () => {
      const el = await focusedTable(
        html`<owc-table selectable .columns=${columns} .data=${data}></owc-table>`,
      );
      // what a click on the checkbox of the third row does to the focus
      bodyRows(el)[2].querySelector('wa-checkbox').focus();
      expect(focusAt(el)).to.equal('2:0');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('2:1');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('1:1');
    });

    it('is the control when the pointer focuses a cell with one simple control', async () => {
      const el = await focusedTable(
        html`<owc-table selectable .columns=${columns} .data=${data}></owc-table>`,
      );
      // what a click beside the checkbox does to the focus
      cellsOf(bodyRows(el)[1])[0].focus();
      expect(focusAt(el)).to.equal('1:0');
      expect(deepActiveElement().matches('input[type="checkbox"]')).to.be.true;
    });

    describe('with several controls', () => {
      const actionsTable = html`<owc-table
        .columns=${[columns[0], twoButtons, columns[1]]}
        .data=${data}
      ></owc-table>`;

      /** @param {Table} el */
      function focusedButton(el) {
        const active = deepActiveElement();
        return active?.localName === 'button' && focusedCell(el) ? active.className : undefined;
      }

      it('is the cell', async () => {
        const el = await focusedTable(actionsTable);
        await press('ArrowRight');
        expect(focusAt(el)).to.equal('0:1');
        expect(cellHasFocus(el)).to.be.true;
        await press('ArrowDown');
        expect(focusAt(el)).to.equal('1:1');
        expect(cellHasFocus(el)).to.be.true;
      });

      for (const key of ['Enter', 'F2']) {
        it(`enters interaction mode with ${key}, cycles through the controls with Tab and returns with Escape`, async () => {
          const el = await focusedTable(actionsTable);
          await press('ArrowRight');
          await press(key);
          expect(focusedButton(el)).to.equal('edit');
          await press('Tab');
          expect(focusedButton(el)).to.equal('delete');
          await press('Tab');
          expect(focusedButton(el)).to.equal('edit');
          await press('Shift+Tab');
          expect(focusedButton(el)).to.equal('delete');
          await press('Shift+Tab');
          expect(focusedButton(el)).to.equal('edit');
          expect(focusAt(el)).to.equal('0:1');

          await press('Escape');
          expect(focusAt(el)).to.equal('0:1');
          expect(cellHasFocus(el)).to.be.true;
          await press('ArrowDown');
          expect(focusAt(el)).to.equal('1:1');
        });
      }

      it('leaves the navigation keys to the controls in interaction mode', async () => {
        const el = await focusedTable(actionsTable);
        await press('ArrowRight');
        await press('Enter');
        for (const key of ['ArrowDown', 'ArrowRight', 'Home', 'PageDown', 'Control+End']) {
          await press(key);
        }
        expect(focusedButton(el)).to.equal('edit');
        expect(focusAt(el)).to.equal('0:1');
      });

      it('says how to leave when it enters interaction mode', async () => {
        const el = await focusedTable(actionsTable);
        await press('ArrowRight');
        expect(liveRegion(el).textContent).to.equal('');
        await press('Enter');
        await waitUntil(
          () => liveRegion(el).textContent === 'Press Escape to return to the table',
          'the hint is announced',
        );
      });

      it('says it in the language of the table', async () => {
        const el = await focusedTable(
          html`<owc-table
            lang="de"
            .columns=${[columns[0], twoButtons]}
            .data=${data}
          ></owc-table>`,
        );
        await press('ArrowRight');
        await press('F2');
        await waitUntil(
          () => liveRegion(el).textContent === 'Escape drücken, um zur Tabelle zurückzukehren',
          'the hint is announced',
        );
      });

      it('is in interaction mode when the pointer focuses one of the controls', async () => {
        const el = await focusedTable(actionsTable);
        // what a click on the second button of the second row does to the focus
        /** @type {HTMLElement} */ (bodyRows(el)[1].querySelector('button.delete')).focus();
        expect(focusAt(el)).to.equal('1:1');
        await waitUntil(() => liveRegion(el).textContent !== '', 'the hint is announced');
        await press('ArrowDown');
        expect(focusedButton(el)).to.equal('delete');
        await press('Tab');
        expect(focusedButton(el)).to.equal('edit');
        await press('Escape');
        expect(cellHasFocus(el)).to.be.true;
        expect(focusAt(el)).to.equal('1:1');
      });

      it('leaves the grid with Tab after Escape', async () => {
        const el = await focusedTable(actionsTable);
        await press('ArrowRight');
        await press('Enter');
        await press('Escape');
        await press('Tab');
        expect(focusAt(el)).to.equal('#after');
        await press('Shift+Tab');
        expect(focusAt(el)).to.equal('0:1');
        expect(cellHasFocus(el)).to.be.true;
      });
    });

    it('is the cell when its one control is a text input, which interaction mode types into', async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${[textInput, columns[0]]} .data=${data}></owc-table>`,
      );
      expect(focusAt(el)).to.equal('0:0');
      expect(cellHasFocus(el)).to.be.true;
      await press('ArrowRight');
      await press('ArrowLeft');
      expect(cellHasFocus(el)).to.be.true;

      await press('Enter');
      const input = /** @type {HTMLInputElement} */ (deepActiveElement());
      expect(input.matches('input.note')).to.be.true;
      await sendKeys({ type: 'ab' });
      await press('ArrowLeft');
      await sendKeys({ type: 'c' });
      await press('ArrowDown');
      expect(input.value).to.equal('acb');
      expect(deepActiveElement() === input).to.be.true;
      await press('Tab');
      expect(deepActiveElement() === input).to.be.true;

      await press('Escape');
      expect(cellHasFocus(el)).to.be.true;
      expect(focusAt(el)).to.equal('0:0');
      await waitUntil(() => liveRegion(el).textContent !== '');
    });

    it('is the cell when its one control is a custom element with a button in its shadow tree', async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${[shadowButton, columns[0]]} .data=${data}></owc-table>`,
      );
      // the custom element has rendered by now
      expect(focusAt(el)).to.equal('0:0');
      expect(cellHasFocus(el)).to.be.true;
      await press('ArrowDown');
      expect(cellHasFocus(el)).to.be.true;

      await press('F2');
      expect(focusAt(el)).to.equal('1:0');
      expect(el.shadowRoot.activeElement.localName).to.equal('test-shadow-button');
      expect(deepActiveElement().localName).to.equal('button');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:0');
      await press('Escape');
      expect(cellHasFocus(el)).to.be.true;
    });

    it("doesn't enter interaction mode in a cell without controls", async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      await press('Enter');
      await press('F2');
      expect(cellHasFocus(el)).to.be.true;
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:0');
      expect(liveRegion(el).textContent).to.equal('');
    });
  });

  describe('visible focus', () => {
    it('shows the focus ring of the theme inside a focused cell', async () => {
      const wrapper = await fixture(html`
        <div style="--wa-focus-ring: solid 3px rgb(0, 0, 255); --wa-focus-ring-width: 3px">
          <button id="before">before</button>
          <owc-table .columns=${columns} .data=${data}></owc-table>
        </div>
      `);
      const el = /** @type {Table} */ (wrapper.querySelector('owc-table'));
      await settle(el);
      /** @type {HTMLElement} */ (wrapper.querySelector('#before')).focus();
      await press('Tab');
      for (const key of ['ArrowRight', 'ArrowUp']) {
        const style = getComputedStyle(focusedCell(el));
        expect(style.outlineStyle).to.equal('solid');
        expect(style.outlineWidth).to.equal('3px');
        expect(style.outlineColor).to.equal('rgb(0, 0, 255)');
        expect(style.outlineOffset).to.equal('-3px');
        await press(key);
      }
    });

    it('shows a focus ring without a theme, and none on cells without the focus', async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      const focused = getComputedStyle(focusedCell(el));
      expect(focused.outlineStyle).to.not.equal('none');
      expect(parseFloat(focused.outlineWidth)).to.be.at.least(2);
      expect(getComputedStyle(cellsOf(bodyRows(el)[1])[0]).outlineStyle).to.equal('none');
    });

    it('shows a focus ring on the message of an empty table', async () => {
      const el = await focusedTable(html`<owc-table .columns=${columns} .data=${[]}></owc-table>`);
      expect(getComputedStyle(focusedCell(el)).outlineStyle).to.not.equal('none');
    });
  });
});
