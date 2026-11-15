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
});
