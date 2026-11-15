import { html, expect, nextFrame, waitUntil } from '@open-wc/testing';
import { deepActiveElement } from '../a11y/controls.js';
import {
  columns,
  data,
  rows,
  tableFixture,
  settle,
  grid,
  headerRow,
  bodyRows,
  cellsOf,
  rowIndices,
  betweenButtons,
  focusedTable,
  press,
  focusedCell,
  focusAt,
  cellHasFocus,
  tabStops,
  liveRegion,
  isInView,
  containers,
  rowClicks,
  clickBeside,
  people,
  cityGroups,
  detailTable,
  detailRowOf,
} from './OwcTable.test-browser.helpers.js';

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table details', () => {
  describe('as rows of the grid', () => {
    for (const renderMode of ['detail', 'detailDeferred', 'linkWithDetail']) {
      it(`shows an open detail as a row after its Data Row, with one cell across all columns (${renderMode})`, async () => {
        const el = await tableFixture(detailTable(renderMode, ['2']));
        const detail = detailRowOf(el, 1);
        expect(detail.getAttribute('role')).to.equal('row');
        const cells = [...detail.querySelectorAll('[role="gridcell"]')];
        expect(cells).to.have.length(1);
        expect(cells[0].parentElement === detail).to.be.true;
        const columnCount = renderMode === 'linkWithDetail' ? '4' : '3';
        expect(cells[0].getAttribute('aria-colspan')).to.equal(columnCount);
        expect(cells[0].querySelector('.detail-text').textContent).to.equal('About Sarah');
        // header row, Robert, Sarah, Sarah's detail, Grace
        expect(detail.getAttribute('aria-rowindex')).to.equal('4');
        expect(grid(el).getAttribute('aria-rowcount')).to.equal('5');
        expect(rowIndices(el)).to.deep.equal([2, 3, 5]);
      });
    }

    it("isn't a row while it is closed, also where it is rendered", async () => {
      // detail mode renders every row's closed detail, so find-in-page finds its text
      const el = await tableFixture(detailTable('detail'));
      for (const index of [0, 1, 2]) {
        const detail = detailRowOf(el, index);
        expect(detail.querySelector('.detail-text')).to.exist;
        expect(detail.getAttribute('role')).to.equal('none');
        expect(
          detail.querySelectorAll('[role="gridcell"], [aria-colspan], [tabindex="0"]'),
        ).to.have.length(0);
      }
      expect(el.shadowRoot.querySelectorAll('.table-body [role="row"]')).to.have.length(3);

      el.openDetails = ['1'];
      await settle(el);
      expect(detailRowOf(el, 0).getAttribute('role')).to.equal('row');
      expect(el.shadowRoot.querySelectorAll('.table-body [role="row"]')).to.have.length(4);
      el.openDetails = [];
      await settle(el);
      expect(detailRowOf(el, 0).getAttribute('role')).to.equal('none');
      expect(detailRowOf(el, 0).querySelector('[role="gridcell"]')).to.not.exist;
    });

    for (const renderMode of ['detail', 'detailDeferred', 'linkWithDetail']) {
      it(`is out of the accessibility tree while it is closed (${renderMode})`, async () => {
        // A closed `wa-details` is still a `<details>` group, which would be a
        // child of the row group that isn't a row.
        const el = await tableFixture(detailTable(renderMode, ['2']));
        expect(
          [0, 1, 2].map(index => detailRowOf(el, index).getAttribute('aria-hidden')),
        ).to.deep.equal(['true', null, 'true']);
        el.openDetails = ['1'];
        await settle(el);
        expect(
          [0, 1, 2].map(index => detailRowOf(el, index).getAttribute('aria-hidden')),
        ).to.deep.equal([null, 'true', 'true']);
      });
    }
  });

  it('has nothing but row groups and presentational containers between the grid and a detail or a group header', async () => {
    const el = await tableFixture(
      html`<owc-table
        render-mode="detail"
        .columns=${columns}
        .data=${people}
        .groupSelector=${row => row.city}
        .groupList=${cityGroups()}
        .renderDetail=${() => html`<p>Detail</p>`}
        .openDetails=${['1']}
      ></owc-table>`,
    );
    const special = [
      ...el.shadowRoot.querySelectorAll(
        '.detail-row[role="row"], .group-label-container[role="row"]',
      ),
    ];
    // Vienna's detail, and four group headers
    expect(special).to.have.length(5);
    for (const row of special) {
      const between = [];
      for (let parent = row.parentElement; parent !== grid(el); parent = parent.parentElement) {
        between.push(parent.getAttribute('role'));
      }
      expect(between.at(-1)).to.equal('rowgroup');
      expect(between.slice(0, -1).every(role => role === 'none')).to.be.true;
    }
  });

  it('shows a focus ring on the cell of the focused detail', async () => {
    const el = await focusedTable(detailTable('detail', ['1']));
    await press('ArrowDown');
    expect(focusAt(el)).to.equal('0:detail');
    const style = getComputedStyle(focusedCell(el));
    expect(style.outlineStyle).to.not.equal('none');
    expect(parseFloat(style.outlineWidth)).to.be.at.least(2);
  });

  describe('with the navigation keys', () => {
    it("is reached with ↓ from its Data Row and keeps the focus itself; ←, →, Home and End don't move off it, and ↑ and ↓ come back to the column the user left", async () => {
      const el = await focusedTable(detailTable('detail', ['1']));
      await press('ArrowRight');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('0:2');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('0:detail');
      expect(cellHasFocus(el)).to.be.true;
      expect(focusedCell(el).querySelector('.detail-text').textContent).to.equal('About Robert');
      for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
        await press(key);
        expect(focusAt(el), key).to.equal('0:detail');
      }
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:2');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('0:detail');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('0:2');
    });

    it('is the last row for Ctrl+End when the last Data Row has it open', async () => {
      const el = await focusedTable(detailTable('detail', ['3']));
      await press('Control+End');
      expect(focusAt(el)).to.equal('2:detail');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('2:detail');
      await press('Control+Home');
      expect(focusAt(el)).to.equal('0:0');
    });

    it("isn't reached once it is closed", async () => {
      const el = await focusedTable(detailTable('detail', ['1']));
      el.openDetails = [];
      await settle(el);
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:0');
    });
  });

  describe('interaction', () => {
    for (const key of ['Enter', 'F2']) {
      it(`goes into the detail's controls with ${key}, cycles through them with Tab, and comes back with Escape`, async () => {
        const el = await focusedTable(detailTable('detail', ['1']));
        await press('ArrowDown');
        await press(key);
        expect(deepActiveElement().className).to.equal('close-detail');
        expect(focusAt(el)).to.equal('0:detail');
        await waitUntil(
          () => liveRegion(el).textContent === 'Press Escape to return to the table',
          'the hint',
        );
        await press('Tab');
        expect(deepActiveElement().className).to.equal('detail-note');
        await press('Tab');
        expect(deepActiveElement().className).to.equal('close-detail');
        await press('Shift+Tab');
        expect(deepActiveElement().className).to.equal('detail-note');
        // the arrow keys are the input's now
        await press('ArrowUp');
        expect(deepActiveElement().className).to.equal('detail-note');
        await press('Escape');
        expect(focusAt(el)).to.equal('0:detail');
        expect(cellHasFocus(el)).to.be.true;
        expect(el.openDetails).to.deep.equal(['1']);
        await press('ArrowUp');
        expect(focusAt(el)).to.equal('0:0');
      });
    }

    it("does nothing with Enter on a detail without controls: it is no Data Row, so it neither toggles nor fires rowClick, and Shift+Space doesn't select", async () => {
      const el = await focusedTable(
        html`<owc-table
          selectable
          render-mode="detail"
          .columns=${columns}
          .data=${data}
          .renderDetail=${row => html`<p>About ${row.firstName}</p>`}
          .openDetails=${['1']}
        ></owc-table>`,
      );
      const clicked = rowClicks(el);
      await press('ArrowRight');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('0:detail');
      await press('Enter');
      await press('Shift+Space');
      await settle(el);
      expect(el.openDetails).to.deep.equal(['1']);
      expect(clicked).to.deep.equal([]);
      expect(el.selectedData).to.deep.equal([]);
      expect(focusAt(el)).to.equal('0:detail');
    });

    for (const renderMode of ['detail', 'detailDeferred', 'linkWithDetail']) {
      it(`moves the focus to its Data Row when it is closed from inside (${renderMode})`, async () => {
        const el = await focusedTable(detailTable(renderMode, ['2']));
        await press('ArrowDown');
        await press('ArrowRight');
        await press('ArrowDown');
        expect(focusAt(el)).to.equal('1:detail');
        await press('Enter');
        expect(deepActiveElement().className).to.equal('close-detail');
        await press('Enter');
        await settle(el);
        expect(el.openDetails).to.deep.equal([]);
        expect(focusAt(el)).to.equal('1:1');
        await press('ArrowDown');
        expect(focusAt(el)).to.equal('2:1');
      });
    }

    it('moves the focus to its Data Row when it is closed while the focus is on it', async () => {
      const el = await focusedTable(detailTable('detail', ['1']));
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('0:detail');
      el.openDetails = [];
      await settle(el);
      expect(focusAt(el)).to.equal('0:0');
    });
  });

  describe('expanded state', () => {
    /** @param {Element} row */
    const toggleOf = row =>
      /** @type {HTMLButtonElement} */ (
        row.querySelector('owc-icon-button').shadowRoot.querySelector('button')
      );

    it('is on the toggle button in linkWithDetail rows, which is named "Details"', async () => {
      const el = await focusedTable(detailTable('linkWithDetail'));
      expect(bodyRows(el).map(row => toggleOf(row).getAttribute('aria-expanded'))).to.deep.equal([
        'false',
        'false',
        'false',
      ]);
      expect(toggleOf(bodyRows(el)[0]).getAttribute('aria-label')).to.equal('Details');
      expect(deepActiveElement() === toggleOf(bodyRows(el)[0])).to.be.true;
      await press('Enter');
      await settle(el);
      expect(bodyRows(el).map(row => toggleOf(row).getAttribute('aria-expanded'))).to.deep.equal([
        'true',
        'false',
        'false',
      ]);
      await press('Space');
      await settle(el);
      expect(toggleOf(bodyRows(el)[0]).getAttribute('aria-expanded')).to.equal('false');
      // the cells of the row say nothing about it
      expect(el.shadowRoot.querySelectorAll('.cell[aria-expanded]')).to.have.length(0);
    });

    it('has the toggle buttons in a column named "Details", which only assistive technology reads', async () => {
      const el = await tableFixture(
        html`<owc-table
          render-mode="linkWithDetail"
          .columns=${columns}
          .data=${data}
          .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
          .renderDetail=${() => html`<p>Detail</p>`}
        ></owc-table>`,
      );
      const [toggleHeader] = cellsOf(headerRow(el));
      expect(toggleHeader.textContent.trim()).to.equal('Details');
      const label = /** @type {HTMLElement} */ (
        toggleHeader.querySelector('owc-table-header-cell > *')
      );
      expect(label.getBoundingClientRect().width).to.be.at.most(1);
      await expect(el).to.be.accessible();
    });

    for (const renderMode of ['detail', 'detailDeferred']) {
      it(`is on the first data cell of the row in ${renderMode} rows, and the live region says every toggle`, async () => {
        const el = await focusedTable(
          html`<owc-table
            selectable
            render-mode=${renderMode}
            .columns=${columns}
            .data=${data}
            .renderDetail=${(row, { closeDetail }) =>
              html`<button class="close-detail" @click=${closeDetail}>Close</button>`}
          ></owc-table>`,
        );
        /** @param {number} index */
        const expandedOf = index =>
          cellsOf(bodyRows(el)[index]).map(cell => cell.getAttribute('aria-expanded'));
        // the selector cell, First Name, Age, City
        expect(expandedOf(0)).to.deep.equal([null, 'false', null, null]);
        await press('ArrowRight');
        await press('ArrowRight');
        await press('Enter');
        await settle(el);
        expect(expandedOf(0)).to.deep.equal([null, 'true', null, null]);
        expect(expandedOf(1)).to.deep.equal([null, 'false', null, null]);
        await waitUntil(() => liveRegion(el).textContent === 'Details opened', 'opened');

        await press('Enter');
        await settle(el);
        expect(expandedOf(0)).to.deep.equal([null, 'false', null, null]);
        await waitUntil(() => liveRegion(el).textContent === 'Details closed', 'closed');

        await clickBeside(cellsOf(bodyRows(el)[1])[3]);
        await settle(el);
        expect(expandedOf(1)).to.deep.equal([null, 'true', null, null]);
        await waitUntil(() => liveRegion(el).textContent === 'Details opened', 'opened by a click');

        await press('ArrowDown');
        expect(focusAt(el)).to.equal('1:detail');
        await press('Enter');
        await press('Enter');
        await settle(el);
        expect(el.openDetails).to.deep.equal([]);
        await waitUntil(
          () => liveRegion(el).textContent === 'Details closed',
          'closed from the detail',
        );
      });
    }

    it('says the toggles in the language of the table', async () => {
      const el = await focusedTable(
        html`<owc-table
          lang="de"
          render-mode="detail"
          .columns=${columns}
          .data=${data}
          .renderDetail=${() => html`<p>Detail</p>`}
        ></owc-table>`,
      );
      await press('Enter');
      await waitUntil(() => liveRegion(el).textContent === 'Details geöffnet', 'geöffnet');
      await press('Enter');
      await waitUntil(() => liveRegion(el).textContent === 'Details geschlossen', 'geschlossen');
    });

    it('has no aria-controls anywhere in the table', async () => {
      for (const renderMode of ['detail', 'linkWithDetail']) {
        const el = await tableFixture(
          html`<owc-table
            render-mode=${renderMode}
            .columns=${columns}
            .data=${people}
            .groupSelector=${row => row.city}
            .groupList=${cityGroups()}
            .renderDetail=${() => html`<p>Detail</p>`}
            .openDetails=${['1']}
          ></owc-table>`,
        );
        await nextFrame();
        /** @param {ParentNode} root */
        const withControls = root =>
          [...root.querySelectorAll('*')].flatMap(element => [
            // what is rendered and in the accessibility tree
            ...(element.hasAttribute('aria-controls') && element.checkVisibility()
              ? [element]
              : []),
            ...(element.shadowRoot ? withControls(element.shadowRoot) : []),
          ]);
        expect(withControls(el.shadowRoot), renderMode).to.deep.equal([]);
      }
    });
  });

  describe('through renders', () => {
    it('keeps the focus on a detail when the rows are replaced by new objects and sorted', async () => {
      const el = await focusedTable(detailTable('detail', ['1']));
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('0:detail');
      el.data = data.map(row => ({ ...row }));
      el.jsonSorters = [{ field: 'firstName', order: 'asc' }];
      await settle(el);
      // Grace, Robert, Sarah
      expect(focusAt(el)).to.equal('1:detail');
      expect(focusedCell(el).querySelector('.detail-text').textContent).to.equal('About Robert');
      expect(cellHasFocus(el)).to.be.true;
    });

    it('is where Tab comes back to', async () => {
      const { el, before, after } = await betweenButtons(detailTable('detail', ['2']));
      before.focus();
      await press('Tab');
      await press('ArrowDown');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:detail');
      await press('Tab');
      expect(document.activeElement === after).to.be.true;
      await press('Shift+Tab');
      expect(focusAt(el)).to.equal('1:detail');
    });

    for (const [name, container] of Object.entries(containers)) {
      it(`brings in the detail of the last row with Ctrl+End, and keeps it clear of the sticky header (scrolled by ${name})`, async () => {
        const { el, scroller } = await container(
          html`<owc-table
            sticky-header
            render-mode="detail"
            virtualizer-mode="always"
            .columns=${columns}
            .data=${rows(400)}
            .renderDetail=${row => html`<p class="detail-text">About ${row.firstName}</p>`}
            .openDetails=${['400', '1']}
          ></owc-table>`,
        );
        /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
        await press('Tab');
        await press('Control+End');
        await waitUntil(() => focusAt(el) === '399:detail', 'the detail of the last row');
        await press('ArrowUp');
        await waitUntil(() => focusAt(el) === '399:2', 'the last Data Row');
        expect(isInView(focusedCell(el), scroller, headerRow(el).getBoundingClientRect().bottom)).to
          .be.true;
        await press('Control+Home');
        await waitUntil(() => focusAt(el) === '0:0', 'the first row');
        await press('ArrowDown');
        await waitUntil(() => focusAt(el) === '0:detail', 'the detail of the first row');
        const top = focusedCell(el).getBoundingClientRect().top;
        expect(top).to.be.at.least(headerRow(el).getBoundingClientRect().bottom - 0.5);
      });
    }
  });

  describe('and the Tab key', () => {
    it('is one Tab stop: the controls of an open detail never are Tab stops of their own', async () => {
      const { el, before, after } = await betweenButtons(detailTable('detail', ['1', '2']));
      expect(await tabStops(el, before, after)).to.deep.equal(['0:0']);
      before.focus();
      await press('Tab');
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('0:detail');
      expect(await tabStops(el, before, after)).to.deep.equal(['0:detail']);
      expect(await tabStops(el, after, before, 'Shift+Tab')).to.deep.equal(['0:detail']);
    });
  });
});
