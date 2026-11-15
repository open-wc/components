import { html, expect, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { deepActiveElement } from '../a11y/controls.js';
import { expectAccessible } from '../a11y/axe.test-browser.helpers.js';
import {
  columns,
  data,
  tableFixture,
  grid,
  headerRow,
  bodyRows,
  focusedTable,
  press,
  focusAt,
  cellHasFocus,
  editableColumns,
  textInput,
  linkActivations,
  clickOn,
  rowLink,
} from './OwcTable.test-browser.helpers.js';

/** @typedef {import('./OwcTable.test-browser.helpers.js').Table} Table */

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table selection', () => {
  /** @param {Table} el */
  function selectedRows(el) {
    return bodyRows(el).map(row => row.getAttribute('aria-selected'));
  }

  const selectableTable = html`<owc-table
    selectable
    .columns=${columns}
    .data=${data}
  ></owc-table>`;

  it('tells that its rows can be selected, and which ones are', async () => {
    const el = await tableFixture(
      html`<owc-table
        selectable
        .columns=${columns}
        .data=${data}
        .insertData=${[{ id: 'new', firstName: 'New', age: 1, city: '' }]}
      ></owc-table>`,
    );
    expect(grid(el).getAttribute('aria-multiselectable')).to.equal('true');
    // Data Rows can be selected, a row that is being inserted can't
    expect(selectedRows(el)).to.deep.equal(['false', 'false', 'false', null]);
    expect(headerRow(el).hasAttribute('aria-selected')).to.be.false;
  });

  it("doesn't mention selection in a table that isn't selectable", async () => {
    const el = await tableFixture(html`<owc-table .columns=${columns} .data=${data}></owc-table>`);
    expect(grid(el).hasAttribute('aria-multiselectable')).to.be.false;
    expect(selectedRows(el)).to.deep.equal([null, null, null]);
  });

  it('follows the selection with aria-selected, for Space on the checkbox and for a click', async () => {
    const el = await focusedTable(selectableTable);
    await press('ArrowDown');
    await press('Space');
    await el.updateComplete;
    expect(selectedRows(el)).to.deep.equal(['false', 'true', 'false']);
    await clickOn(bodyRows(el)[2].querySelector('wa-checkbox'));
    await el.updateComplete;
    expect(selectedRows(el)).to.deep.equal(['false', 'true', 'true']);
    await press('ArrowUp');
    await press('Space');
    await el.updateComplete;
    expect(selectedRows(el)).to.deep.equal(['false', 'false', 'true']);
    expect(el.selectedData).to.deep.equal([data[2]]);
  });

  it('selects all rows and none with Space on the select-all checkbox', async () => {
    const el = await focusedTable(selectableTable);
    await press('ArrowUp');
    expect(focusAt(el)).to.equal('header:0');
    await press('Space');
    await el.updateComplete;
    expect(selectedRows(el)).to.deep.equal(['true', 'true', 'true']);
    expect(el.selectedData).to.deep.equal(data);
    await press('Space');
    await el.updateComplete;
    expect(selectedRows(el)).to.deep.equal(['false', 'false', 'false']);
    expect(focusAt(el)).to.equal('header:0');
  });

  describe('the names of its checkboxes', () => {
    /**
     * The text of the label a checkbox names its input by.
     *
     * @param {Element} checkbox a `wa-checkbox`
     */
    function labelOf(checkbox) {
      const input = /** @type {HTMLInputElement} */ (checkbox.shadowRoot.querySelector('input'));
      const slot = input.labels[0].querySelector('slot');
      return slot
        .assignedNodes()
        .map(node => node.textContent)
        .join('')
        .trim();
    }

    /** @param {Table} el */
    function checkboxes(el) {
      return [...el.shadowRoot.querySelectorAll('wa-checkbox')];
    }

    it('are "Select all" and "Select row", and pass axe', async () => {
      const el = await tableFixture(selectableTable);
      expect(checkboxes(el).map(labelOf)).to.deep.equal([
        'Select all',
        'Select row',
        'Select row',
        'Select row',
      ]);
      // the column is named "Selection", also for axe, which can't read the checkbox's name
      const header = el.shadowRoot.querySelector('.table-header [role="columnheader"]');
      const nameId = header.getAttribute('aria-labelledby');
      expect(el.shadowRoot.getElementById(nameId).textContent.trim()).to.equal('Selection');
      await expectAccessible(el);
    });

    it('come from the language of the table', async () => {
      const el = await tableFixture(
        html`<owc-table lang="de" selectable .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(checkboxes(el).slice(0, 2).map(labelOf)).to.deep.equal([
        'Alle auswählen',
        'Zeile auswählen',
      ]);
    });

    it('are the aria-label of getSelectorSettings for the rows that have one', async () => {
      const el = await tableFixture(
        html`<owc-table
          selectable
          .columns=${columns}
          .data=${data}
          .getSelectorSettings=${row =>
            row.id === '2' ? {} : { 'aria-label': `Select ${row.firstName}` }}
        ></owc-table>`,
      );
      expect(checkboxes(el).slice(1).map(labelOf)).to.deep.equal([
        'Select Robert',
        'Select row',
        'Select Grace',
      ]);
    });

    it("don't show, and leave the cells as wide as they were", async () => {
      const el = await tableFixture(selectableTable);
      for (const checkbox of checkboxes(el)) {
        const cell = checkbox.closest('.cell').getBoundingClientRect();
        const box = checkbox.getBoundingClientRect();
        expect(cell.width).to.equal(50);
        expect(box.width).to.be.lessThan(30);
        expect(box.left).to.be.at.least(cell.left);
        expect(box.right).to.be.at.most(cell.right);
      }
    });
  });

  describe('with Shift+Space', () => {
    /**
     * Collects every Shift+Space, to tell afterwards whether the page still
     * got it, which scrolls it.
     *
     * @returns {{ left: () => boolean[] }}
     */
    function pageGetsShiftSpace() {
      /** @type {KeyboardEvent[]} */
      const events = [];
      /** @param {KeyboardEvent} event */
      const listener = event => {
        if (event.key === ' ' && event.shiftKey) {
          events.push(event);
        }
      };
      // on its way down, so it sees keys that are stopped further in
      window.addEventListener('keydown', listener, { capture: true });
      cleanups.push(() => window.removeEventListener('keydown', listener, { capture: true }));
      return { left: () => events.map(event => !event.defaultPrevented) };
    }

    /** @type {Array<() => void>} */
    const cleanups = [];
    afterEach(() => {
      cleanups.splice(0).forEach(cleanup => cleanup());
    });

    it('toggles the focused row from any of its cells, and keeps the key from the page', async () => {
      const el = await focusedTable(selectableTable);
      const page = pageGetsShiftSpace();
      await press('ArrowDown');
      await press('ArrowRight');
      expect(cellHasFocus(el)).to.be.true;
      await press('Shift+Space');
      await el.updateComplete;
      expect(selectedRows(el)).to.deep.equal(['false', 'true', 'false']);
      expect(el.selectedData).to.deep.equal([data[1]]);
      expect(bodyRows(el)[1].querySelector('wa-checkbox').checked).to.be.true;
      expect(focusAt(el)).to.equal('1:1');
      await press('End');
      await press('Shift+Space');
      await el.updateComplete;
      expect(selectedRows(el)).to.deep.equal(['false', 'false', 'false']);
      expect(focusAt(el)).to.equal('1:3');
      expect(page.left()).to.deep.equal([false, false]);
    });

    it("toggles the row on an editable cell's read view, which doesn't start to edit", async () => {
      const el = await focusedTable(
        html`<owc-table selectable .columns=${editableColumns} .data=${data}></owc-table>`,
      );
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('0:1');
      const editor = el.shadowRoot.activeElement;
      expect(editor.localName).to.equal('owc-click-editable-input');
      await press('Shift+Space');
      await el.updateComplete;
      expect(selectedRows(el)).to.deep.equal(['true', 'false', 'false']);
      expect(editor.editable).to.be.false;
      expect(deepActiveElement().classList.contains('display')).to.be.true;

      // Space alone still starts the edit, where Shift+Space is a space
      await press('Space');
      await waitUntil(() => deepActiveElement().localName === 'input', 'the editor has the focus');
      await press('Shift+Space');
      expect(deepActiveElement().value).to.equal('Robert ');
      expect(selectedRows(el)).to.deep.equal(['true', 'false', 'false']);
      await press('Escape');
    });

    it('is a space for a text input in interaction mode', async () => {
      const el = await focusedTable(
        html`<owc-table selectable .columns=${[columns[0], textInput]} .data=${data}></owc-table>`,
      );
      await press('End');
      await press('Enter');
      expect(deepActiveElement().localName).to.equal('input');
      await sendKeys({ type: 'a' });
      await press('Shift+Space');
      expect(deepActiveElement().value).to.equal('a ');
      expect(el.selectedData).to.deep.equal([]);
    });

    it("toggles the row once on the row's checkbox", async () => {
      const el = await focusedTable(selectableTable);
      expect(deepActiveElement().matches('input[type="checkbox"]')).to.be.true;
      await press('Shift+Space');
      await el.updateComplete;
      expect(selectedRows(el)).to.deep.equal(['true', 'false', 'false']);
      expect(deepActiveElement().checked).to.be.true;
      await press('Shift+Space');
      await el.updateComplete;
      expect(selectedRows(el)).to.deep.equal(['false', 'false', 'false']);
      expect(deepActiveElement().checked).to.be.false;
    });

    it('toggles the row on another control of the row, which does nothing itself then', async () => {
      const el = await focusedTable(
        html`<owc-table
          selectable
          render-mode="linkWithDetail"
          .columns=${columns}
          .data=${data}
          .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
          .renderDetail=${() => html`<p>Detail</p>`}
        ></owc-table>`,
      );
      const activations = linkActivations(el);
      expect(deepActiveElement().localName).to.equal('button');
      await press('Shift+Space');
      await el.updateComplete;
      expect(selectedRows(el)).to.deep.equal(['true', 'false', 'false']);
      expect(el.openDetails).to.deep.equal([]);
      await press('ArrowRight');
      await press('ArrowRight');
      expect(deepActiveElement() === rowLink(bodyRows(el)[0])).to.be.true;
      await press('Shift+Space');
      await el.updateComplete;
      expect(selectedRows(el)).to.deep.equal(['false', 'false', 'false']);
      expect(activations).to.deep.equal([]);
    });

    it('does nothing in the header row and in a row that is being inserted', async () => {
      const el = await focusedTable(
        html`<owc-table
          selectable
          .columns=${columns}
          .data=${data}
          .insertData=${[{ id: 'new', firstName: 'New', age: 1, city: '' }]}
        ></owc-table>`,
      );
      await press('Control+End');
      expect(focusAt(el)).to.equal('3:3');
      await press('Shift+Space');
      await press('Control+Home');
      await press('ArrowUp');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('header:1');
      await press('Shift+Space');
      await el.updateComplete;
      expect(el.selectedData).to.deep.equal([]);
    });

    it("is left to the page in a table that isn't selectable", async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      const page = pageGetsShiftSpace();
      await press('Shift+Space');
      expect(page.left()).to.deep.equal([true]);
      expect(el.selectedData).to.deep.equal([]);
    });
  });
});
