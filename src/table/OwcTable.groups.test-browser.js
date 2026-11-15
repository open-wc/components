import { html, expect, waitUntil } from '@open-wc/testing';
import { sendMouse } from '@web/test-runner-commands';
import { deepActiveElement } from '../a11y/controls.js';
import {
  columns,
  rows,
  tableFixture,
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
  tabStops,
  isInView,
  containers,
  clickOn,
  people,
  cityGroups,
  groupedTable,
  groupRows,
  groupButton,
  bodyOutline,
} from './OwcTable.test-browser.helpers.js';

/** @typedef {import('./OwcTable.test-browser.helpers.js').Table} Table */

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table groups', () => {
  describe('as rows of the grid', () => {
    it('shows a group header as a row with one cell across all columns', async () => {
      const el = await tableFixture(groupedTable());
      expect(groupRows(el)).to.have.length(4);
      for (const row of groupRows(el)) {
        expect(row.getAttribute('role')).to.equal('row');
        const cells = [...row.querySelectorAll('[role="gridcell"]')];
        expect(cells).to.have.length(1);
        expect(cells[0].parentElement === row).to.be.true;
        expect(cells[0].getAttribute('aria-colspan')).to.equal('3');
      }
    });

    it('spans as many columns as the table shows', async () => {
      const el = await tableFixture(
        html`<owc-table
          selectable
          .columns=${columns}
          .data=${people}
          .groupSelector=${row => row.city}
          .groupList=${cityGroups()}
        ></owc-table>`,
      );
      expect(
        groupRows(el)[0].querySelector('[role="gridcell"]').getAttribute('aria-colspan'),
      ).to.equal('4');
    });

    it('has a button in the cell that is named by the group and its number of rows, and says whether the group is expanded', async () => {
      const el = await tableFixture(groupedTable());
      expect(bodyOutline(el)).to.deep.equal([
        'v Vienna, 2 rows',
        'Robert',
        'Grace',
        '> Graz, 1 row',
        'v Linz, 1 row',
        'Ada',
        'v Others, 1 row',
        'Linus',
      ]);
      for (const row of groupRows(el)) {
        expect(groupButton(row).parentElement.getAttribute('role')).to.equal('gridcell');
      }
    });

    it('names the buttons in the language of the table', async () => {
      const el = await tableFixture(
        html`<owc-table
          lang="de"
          .columns=${columns}
          .data=${people}
          .groupSelector=${row => row.city}
          .groupList=${cityGroups()}
        ></owc-table>`,
      );
      expect(groupRows(el).map(row => groupButton(row).getAttribute('aria-label'))).to.deep.equal([
        'Vienna, 2 Zeilen',
        'Graz, 1 Zeile',
        'Linz, 1 Zeile',
        'Andere, 1 Zeile',
      ]);
    });

    it('still shows the label, the number of rows and a chevron', async () => {
      const el = await tableFixture(groupedTable());
      const [vienna, graz] = groupRows(el);
      expect(vienna.querySelector('.group-label').textContent.replace(/\s+/g, ' ').trim()).to.equal(
        'Vienna 2',
      );
      expect(vienna.querySelector('wa-icon').getAttribute('name')).to.equal('chevron-down');
      expect(graz.querySelector('wa-icon').getAttribute('name')).to.equal('chevron-right');
    });
  });

  describe('with the navigation keys', () => {
    it('takes the focus on its button, in the order of the rows', async () => {
      const el = await focusedTable(groupedTable());
      const stops = [focusAt(el)];
      for (let presses = 0; presses < 8; presses++) {
        await press('ArrowDown');
        stops.push(focusAt(el));
      }
      expect(stops).to.deep.equal([
        '0:group', // Vienna
        '1:0',
        '2:0',
        '3:group', // Graz, collapsed
        '4:group', // Linz
        '5:0',
        '6:group', // Others
        '7:0',
        '7:0',
      ]);
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('6:group');
      expect(deepActiveElement() === groupButton(groupRows(el)[3])).to.be.true;
    });

    it('is the first body row for Tab, Ctrl+Home and ↓ from the header row, and the last one for Ctrl+End', async () => {
      const el = await focusedTable(
        html`<owc-table
          .columns=${columns}
          .data=${people}
          .groupSelector=${row => row.city}
          .groupList=${cityGroups()}
        ></owc-table>`,
      );
      expect(focusAt(el)).to.equal('0:group');
      expect(deepActiveElement() === groupButton(groupRows(el)[0])).to.be.true;
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('header:0');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('0:group');
      // the Others group is collapsed, so its header is the last row
      await press('Control+End');
      expect(focusAt(el)).to.equal('6:group');
      await press('Control+Home');
      expect(focusAt(el)).to.equal('0:group');
    });

    it("doesn't move off its cell with ←, →, Home and End, and comes back to the column the user left with ↑ and ↓", async () => {
      const el = await focusedTable(groupedTable());
      await press('ArrowDown');
      await press('ArrowRight');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('1:2');
      await press('ArrowUp');
      for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
        await press(key);
        expect(focusAt(el), key).to.equal('0:group');
      }
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:2');
      await press('ArrowDown');
      await press('ArrowDown');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('4:group');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('5:2');
      await press('ArrowUp');
      await press('ArrowUp');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('2:2');
    });
  });

  describe('expanding and collapsing', () => {
    /** @param {Table} el */
    function viennaIsExpanded(el) {
      return groupButton(groupRows(el)[0]).getAttribute('aria-expanded') === 'true';
    }

    it('toggles with Enter and with Space, and keeps the focus on the button', async () => {
      const el = await focusedTable(groupedTable());
      await press('Enter');
      await settle(el);
      expect(bodyOutline(el).slice(0, 2)).to.deep.equal(['> Vienna, 2 rows', '> Graz, 1 row']);
      expect(focusAt(el)).to.equal('0:group');
      expect(deepActiveElement() === groupButton(groupRows(el)[0])).to.be.true;

      await press('Space');
      await settle(el);
      expect(bodyOutline(el).slice(0, 3)).to.deep.equal(['v Vienna, 2 rows', 'Robert', 'Grace']);
      expect(deepActiveElement() === groupButton(groupRows(el)[0])).to.be.true;
      // the rows of the group are next
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:0');
    });

    it('expands with → and collapses with ←, and stays as it is when it is there already', async () => {
      const el = await focusedTable(groupedTable());
      expect(viennaIsExpanded(el)).to.be.true;
      await press('ArrowRight');
      await settle(el);
      expect(viennaIsExpanded(el), '→ on an expanded group').to.be.true;

      await press('ArrowLeft');
      await settle(el);
      expect(viennaIsExpanded(el), '← on an expanded group').to.be.false;
      expect(bodyRows(el).map(row => row.textContent.trim().split(/\s+/)[0])).to.deep.equal([
        'Ada',
        'Linus',
      ]);
      await press('ArrowLeft');
      await settle(el);
      expect(viennaIsExpanded(el), '← on a collapsed group').to.be.false;

      await press('ArrowRight');
      await settle(el);
      expect(viennaIsExpanded(el), '→ on a collapsed group').to.be.true;
      expect(focusAt(el)).to.equal('0:group');
      expect(deepActiveElement() === groupButton(groupRows(el)[0])).to.be.true;
    });

    it('does the same for the Others group', async () => {
      const el = await focusedTable(groupedTable());
      await press('Control+End');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('6:group');
      expect(bodyOutline(el).slice(-2)).to.deep.equal(['v Others, 1 row', 'Linus']);

      await press('ArrowLeft');
      await settle(el);
      expect(el.othersGroupActive).to.be.false;
      expect(bodyOutline(el).at(-1)).to.equal('> Others, 1 row');
      await press('ArrowRight');
      await settle(el);
      expect(el.othersGroupActive).to.be.true;
      await press('Enter');
      await settle(el);
      expect(el.othersGroupActive).to.be.false;
      await press('Space');
      await settle(el);
      expect(el.othersGroupActive).to.be.true;
      expect(bodyOutline(el).slice(-2)).to.deep.equal(['v Others, 1 row', 'Linus']);
      expect(focusAt(el)).to.equal('6:group');
    });

    it('does nothing with Shift+Space in a selectable table, where it selects rows', async () => {
      const el = await focusedTable(
        html`<owc-table
          selectable
          .columns=${columns}
          .data=${people}
          .groupSelector=${row => row.city}
          .groupList=${cityGroups()}
          .othersGroupActive=${true}
        ></owc-table>`,
      );
      expect(focusAt(el)).to.equal('0:group');
      await press('Shift+Space');
      await settle(el);
      expect(viennaIsExpanded(el)).to.be.true;
      expect(el.selectedData).to.deep.equal([]);
      expect(deepActiveElement() === groupButton(groupRows(el)[0])).to.be.true;
    });

    it('keeps ← and → from scrolling the page, and leaves them alone with modifiers', async () => {
      const el = await focusedTable(groupedTable());
      /** @type {Record<string, boolean>} */
      const prevented = {};
      const listener = (/** @type {KeyboardEvent} */ event) => {
        if (event.key !== 'Shift') {
          prevented[`${event.shiftKey ? 'Shift+' : ''}${event.key}`] = event.defaultPrevented;
        }
      };
      window.addEventListener('keydown', listener);
      try {
        for (const key of ['ArrowRight', 'ArrowLeft', 'Shift+ArrowLeft', 'Shift+ArrowRight']) {
          await press(key);
        }
      } finally {
        window.removeEventListener('keydown', listener);
      }
      await settle(el);
      expect(prevented).to.deep.equal({
        ArrowRight: true,
        ArrowLeft: true,
        'Shift+ArrowLeft': false,
        'Shift+ArrowRight': false,
      });
      expect(viennaIsExpanded(el), 'only the plain ← collapsed it').to.be.false;
    });
  });

  describe('and the Tab key', () => {
    it("is one Tab stop: a group's button never is one of its own", async () => {
      const { el, before, after } = await betweenButtons(groupedTable());
      expect(await tabStops(el, before, after)).to.deep.equal(['0:group']);
      expect(await tabStops(el, after, before, 'Shift+Tab')).to.deep.equal(['0:group']);

      before.focus();
      await press('Tab');
      await press('ArrowDown');
      await press('ArrowDown');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('3:group');
      expect(await tabStops(el, before, after)).to.deep.equal(['3:group']);
      expect(await tabStops(el, after, before, 'Shift+Tab')).to.deep.equal(['3:group']);
    });
  });

  describe('row counts and indices', () => {
    /** @param {Table} el */
    function indices(el) {
      return [...el.shadowRoot.querySelectorAll('.table-body [role="row"]')].map(row =>
        Number(row.getAttribute('aria-rowindex')),
      );
    }

    it('numbers the group headers with the rows, and stays right while groups collapse and expand', async () => {
      const el = await focusedTable(groupedTable());
      // header row, Vienna, Robert, Grace, Graz, Linz, Ada, Others, Linus
      expect(grid(el).getAttribute('aria-rowcount')).to.equal('9');
      expect(indices(el)).to.deep.equal([2, 3, 4, 5, 6, 7, 8, 9]);

      await press('ArrowLeft');
      await settle(el);
      // header row, Vienna, Graz, Linz, Ada, Others, Linus
      expect(grid(el).getAttribute('aria-rowcount')).to.equal('7');
      expect(indices(el)).to.deep.equal([2, 3, 4, 5, 6, 7]);

      await press('ArrowDown');
      await press('Enter');
      await settle(el);
      // header row, Vienna, Graz, Sarah, Linz, Ada, Others, Linus
      expect(bodyOutline(el).slice(1, 3)).to.deep.equal(['v Graz, 1 row', 'Sarah']);
      expect(grid(el).getAttribute('aria-rowcount')).to.equal('8');
      expect(indices(el)).to.deep.equal([2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('and the pointer', () => {
    it('toggles with a click on its label, which gives its button the focus', async () => {
      const el = await tableFixture(groupedTable());
      const [vienna] = groupRows(el);
      await clickOn(vienna.querySelector('.group-label'));
      await settle(el);
      expect(bodyOutline(el).slice(0, 2)).to.deep.equal(['> Vienna, 2 rows', '> Graz, 1 row']);
      expect(focusAt(el)).to.equal('0:group');
      expect(deepActiveElement() === groupButton(groupRows(el)[0])).to.be.true;
      // the keys go on from there
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:group');
    });

    it('toggles with a click anywhere in its header', async () => {
      const el = await tableFixture(groupedTable());
      const rect = groupRows(el)[0].getBoundingClientRect();
      for (const [x, y] of [
        [rect.left + 2, rect.top + 2],
        [rect.right - 3, rect.bottom - 3],
      ]) {
        const expanded = groupButton(groupRows(el)[0]).getAttribute('aria-expanded');
        await sendMouse({ type: 'click', position: [Math.round(x), Math.round(y)] });
        await settle(el);
        expect(groupButton(groupRows(el)[0]).getAttribute('aria-expanded')).to.not.equal(expanded);
      }
    });
  });

  describe('visible focus', () => {
    it('shows a focus ring on the button of the focused group header only', async () => {
      const el = await focusedTable(groupedTable());
      const [vienna, graz] = groupRows(el).map(groupButton);
      expect(getComputedStyle(vienna).outlineStyle).to.not.equal('none');
      expect(parseFloat(getComputedStyle(vienna).outlineWidth)).to.be.at.least(2);
      expect(getComputedStyle(graz).outlineStyle).to.equal('none');
      // the ring is the button's, which fills the header
      const header = groupRows(el)[0].getBoundingClientRect();
      const button = vienna.getBoundingClientRect();
      expect(button.width).to.be.closeTo(header.width, 3);
      expect(button.height).to.be.closeTo(header.height, 3);
    });
  });

  describe('through renders', () => {
    it('keeps the focus on a group header when its groups are replaced by new objects', async () => {
      const el = await focusedTable(groupedTable());
      await press('ArrowDown');
      await press('ArrowDown');
      await press('ArrowDown');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('4:group');
      expect(groupButton(focusedCell(el).parentElement).getAttribute('aria-label')).to.equal(
        'Linz, 1 row',
      );

      // every group expanded, as new objects: Linz moves down by Sarah's row
      el.groupList = cityGroups([]);
      await settle(el);
      expect(focusAt(el)).to.equal('5:group');
      expect(groupButton(focusedCell(el).parentElement).getAttribute('aria-label')).to.equal(
        'Linz, 1 row',
      );
      expect(deepActiveElement() === groupButton(focusedCell(el).parentElement)).to.be.true;
    });

    it('goes to the row at its place when its group is gone', async () => {
      const el = await focusedTable(groupedTable());
      await press('Control+End');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('6:group');
      // without Linus there is no Others group: Ada is the last row
      el.data = people.slice(0, 4);
      await settle(el);
      expect(focusAt(el)).to.equal('5:2');
      expect(cellsOf(focusedCell(el).parentElement)[0].textContent.trim()).to.equal('Ada');
    });

    it('is where Tab comes back to', async () => {
      const { el, after } = await betweenButtons(groupedTable());
      /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
      await press('Tab');
      await press('ArrowDown');
      await press('ArrowDown');
      await press('ArrowDown');
      await press('Tab');
      expect(document.activeElement === after).to.be.true;
      await press('Shift+Tab');
      expect(focusAt(el)).to.equal('3:group');
    });
  });

  describe('in a large table', () => {
    for (const [name, container] of Object.entries(containers)) {
      it(`brings in a group header that isn't rendered, and keeps it clear of the sticky header (scrolled by ${name})`, async () => {
        const teams = Array.from({ length: 8 }, (_, team) => ({
          key: `team-${team}`,
          label: `Team ${team}`,
          active: true,
        }));
        const { el, scroller } = await container(
          html`<owc-table
            sticky-header
            virtualizer-mode="always"
            .columns=${columns}
            .data=${rows(400).map((row, index) => ({ ...row, team: `team-${index % 8}` }))}
            .groupSelector=${row => row.team}
            .groupList=${teams}
          ></owc-table>`,
        );
        const clearOfHeader = () =>
          isInView(
            focusedCell(el).parentElement,
            scroller,
            headerRow(el).getBoundingClientRect().bottom,
          );
        /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
        await press('Tab');
        expect(focusAt(el)).to.equal('0:group');
        await press('Control+End');
        await waitUntil(() => focusAt(el) === '407:2', 'the last row gets the focus');
        // 8 headers and 400 rows: the header of the last group is 51 rows up
        for (let row = 406; row >= 358; row--) {
          await press('ArrowUp');
          await waitUntil(() => focusAt(el) === `${row}:2`, `focus at ${row}:2`);
        }
        await press('ArrowUp');
        await waitUntil(() => focusAt(el) === '357:group', 'the header of the last group');
        expect(clearOfHeader(), 'the last group header is in view').to.be.true;

        await press('Control+Home');
        await waitUntil(() => focusAt(el) === '0:group', 'the first group header');
        expect(clearOfHeader(), 'the first group header is in view').to.be.true;
      });
    }
  });
});
