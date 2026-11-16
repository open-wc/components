import { html, expect, waitUntil } from '@open-wc/testing';
import { nothing } from 'lit';
import { deepActiveElement } from '../a11y/controls.js';
import {
  columns,
  data,
  tableFixture,
  bodyRows,
  betweenButtons,
  focusedTable,
  press,
  focusAt,
  cellHasFocus,
  tabStops,
  settle,
  liveRegion,
  textInput,
  clickOn,
} from './OwcTable.test-browser.helpers.js';

/** @typedef {import('./OwcTable.test-browser.helpers.js').Table} Table */

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table annotations', () => {
  const withButton = [
    ...columns,
    {
      label: 'Action',
      field: 'action',
      formatter: row => html`<button class="action">Call ${row.firstName}</button>`,
    },
  ];

  /** Sarah's row has an annotation. */
  const annotatedTable = html`<owc-table
    .columns=${withButton}
    .data=${data}
    .renderAnnotation=${row =>
      row.id === '2' ? html`<strong>Overdue:</strong> invoice open` : nothing}
  ></owc-table>`;

  /**
   * Empties the live region, so a test sees whether something is said after it.
   *
   * @param {Table} el
   */
  function clearLiveRegion(el) {
    liveRegion(el).textContent = '';
  }

  /**
   * Whether the live region stays empty for longer than it waits before it
   * says something.
   *
   * @param {Table} el
   */
  async function saysNothing(el) {
    await new Promise(resolve => setTimeout(resolve, 150));
    return liveRegion(el).textContent === '';
  }

  it('is referenced by its Data Row with aria-describedby', async () => {
    const el = await tableFixture(annotatedTable);
    const [robert, sarah] = bodyRows(el);
    expect(robert.hasAttribute('aria-describedby')).to.be.false;
    const id = sarah.getAttribute('aria-describedby');
    expect(id).to.be.a('string');
    const annotation = el.shadowRoot.getElementById(id);
    expect(annotation.classList.contains('row-annotation')).to.be.true;
    expect(annotation.textContent.replace(/\s+/g, ' ').trim()).to.equal('Overdue: invoice open');
    expect(annotation.getAttribute('role')).to.not.equal('row');
  });

  for (const [name, column] of [
    ['the first cell', 0],
    ['a later cell', 2],
    ['a cell whose focus target is a control', 3],
  ]) {
    it(`is said when the focus moves into its row from another row, onto ${name}`, async () => {
      const el = await focusedTable(annotatedTable);
      for (let presses = 0; presses < column; presses++) {
        await press('ArrowRight');
      }
      clearLiveRegion(el);
      await press('ArrowDown');
      expect(focusAt(el)).to.equal(`1:${column}`);
      await waitUntil(
        () => liveRegion(el).textContent === 'Overdue: invoice open',
        'the annotation is said',
      );
      if (column === 3) {
        expect(deepActiveElement().className).to.equal('action');
      }
      // and again from the row after it
      await press('ArrowDown');
      clearLiveRegion(el);
      await press('ArrowUp');
      await waitUntil(
        () => liveRegion(el).textContent === 'Overdue: invoice open',
        'the annotation is said again',
      );
    });
  }

  it('is said once: not again while the focus moves within its row, nor for other rows', async () => {
    const el = await focusedTable(annotatedTable);
    await press('ArrowDown');
    await waitUntil(() => liveRegion(el).textContent === 'Overdue: invoice open', 'said');
    clearLiveRegion(el);
    await press('ArrowRight');
    await press('End');
    await press('Home');
    expect(await saysNothing(el), 'within the row').to.be.true;
    await press('ArrowDown');
    expect(focusAt(el)).to.equal('2:0');
    expect(await saysNothing(el), 'in a row without an annotation').to.be.true;
  });

  it('is said with the hint of interaction mode when the pointer focuses an input in its row', async () => {
    const el = await focusedTable(
      html`<owc-table
        .columns=${[...columns, textInput]}
        .data=${data}
        .renderAnnotation=${row => (row.id === '2' ? 'Overdue' : nothing)}
      ></owc-table>`,
    );
    clearLiveRegion(el);
    await clickOn(bodyRows(el)[1].querySelector('input.note'));
    expect(focusAt(el)).to.equal('1:3');
    await waitUntil(
      () => liveRegion(el).textContent === 'Overdue Press Escape to return to the table',
      'both are said',
    );
  });

  it("isn't said again when the focus comes back to its row from outside the table", async () => {
    const { el, before, after } = await betweenButtons(annotatedTable);
    before.focus();
    await press('Tab');
    await press('ArrowDown');
    await waitUntil(() => liveRegion(el).textContent === 'Overdue: invoice open', 'said');
    after.focus();
    clearLiveRegion(el);
    await press('Shift+Tab');
    expect(focusAt(el)).to.equal('1:0');
    expect(await saysNothing(el)).to.be.true;
  });
  describe('with controls', () => {
    /**
     * Sarah's row has an annotation with a button and a link. The button
     * settles the invoice, which takes the annotation away.
     */
    const actionTable = () => {
      let settled = false;
      return html`<owc-table
        .columns=${withButton}
        .data=${data}
        .renderAnnotation=${row =>
          row.id === '2' && !settled
            ? html`Overdue
                <button
                  class="settle"
                  @click=${event => {
                    settled = true;
                    event.target.getRootNode().host.requestUpdate();
                  }}
                >
                  Settle
                </button>
                <a class="invoice" href="#invoice">Invoice</a>`
            : nothing}
      ></owc-table>`;
    };

    /** The class of the annotation's control that has the focus. */
    function focusedAction() {
      const active = deepActiveElement();
      return active?.closest('.row-annotation') ? active.className : undefined;
    }

    it("aren't Tab stops: the grid stays one Tab stop, in both directions", async () => {
      const { el, before, after } = await betweenButtons(actionTable());
      expect(await tabStops(el, before, after)).to.deep.equal(['0:0']);
      expect(await tabStops(el, after, before, 'Shift+Tab')).to.deep.equal(['0:0']);
    });

    it('are reached with F2 from a cell of the row: Tab and Shift+Tab move between them, and Escape comes back to the cell', async () => {
      const el = await focusedTable(actionTable());
      clearLiveRegion(el);
      await press('ArrowDown');
      await waitUntil(
        () =>
          liveRegion(el).textContent === 'Overdue Settle Invoice Press F2 to reach its controls',
        'the annotation is said with how to reach its controls',
      );
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('1:1');
      clearLiveRegion(el);

      await press('F2');
      expect(focusedAction()).to.equal('settle');
      await waitUntil(
        () => liveRegion(el).textContent === 'Press Escape to return to the table',
        'the hint is said',
      );
      await press('Tab');
      expect(focusedAction()).to.equal('invoice');
      await press('Tab');
      expect(focusedAction(), 'Tab goes around').to.equal('settle');
      await press('Shift+Tab');
      expect(focusedAction()).to.equal('invoice');
      // the arrow keys are the control's, not the grid's
      await press('ArrowDown');
      expect(focusedAction()).to.equal('invoice');

      await press('Escape');
      expect(focusAt(el)).to.equal('1:1');
      expect(cellHasFocus(el)).to.be.true;
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('2:1');
    });

    it("are reached with F2 from a cell's one control too, where Escape comes back to", async () => {
      const el = await focusedTable(actionTable());
      await press('ArrowDown');
      await press('End');
      expect(deepActiveElement().className).to.equal('action');
      await press('F2');
      expect(focusedAction()).to.equal('settle');
      await press('Escape');
      expect(focusAt(el)).to.equal('1:3');
      expect(deepActiveElement().className).to.equal('action');
    });

    it('are in interaction mode when the pointer focuses one: Tab stays in the annotation, and Escape goes to its row', async () => {
      const { el, after } = await betweenButtons(actionTable());
      clearLiveRegion(el);
      await clickOn(el.shadowRoot.querySelector('.row-annotation .invoice'));
      expect(focusedAction()).to.equal('invoice');
      await waitUntil(
        () => liveRegion(el).textContent === 'Press Escape to return to the table',
        'the hint is said',
      );
      await press('Tab');
      expect(focusedAction()).to.equal('settle');
      expect(document.activeElement).to.not.equal(after);
      await press('Escape');
      expect(focusAt(el)).to.equal('1:0');
    });

    it('give the focus back to the row when their action takes the annotation away', async () => {
      const el = await focusedTable(actionTable());
      await press('ArrowDown');
      await press('ArrowRight');
      await press('F2');
      expect(focusedAction()).to.equal('settle');
      await press('Enter');
      await settle(el);
      expect(el.shadowRoot.querySelector('.row-annotation')).to.equal(null);
      expect(focusAt(el)).to.equal('1:1');
    });

    it('leaves F2 alone in a row whose annotation has no controls, and in rows without one', async () => {
      const el = await focusedTable(annotatedTable);
      await press('F2');
      expect(focusAt(el)).to.equal('0:0');
      await press('ArrowDown');
      await press('F2');
      expect(focusAt(el)).to.equal('1:0');
      expect(cellHasFocus(el)).to.be.true;
    });
  });
});
