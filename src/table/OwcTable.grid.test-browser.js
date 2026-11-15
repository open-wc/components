import { fixture, html, expect } from '@open-wc/testing';
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
} from './OwcTable.test-browser.helpers.js';

/** @typedef {import('./OwcTable.test-browser.helpers.js').Table} Table */

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table as a grid', () => {
  describe('roles and names', () => {
    it('is a grid named "Table" by default', async () => {
      const el = await tableFixture(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(grid(el).getAttribute('role')).to.equal('grid');
      expect(grid(el).getAttribute('aria-label')).to.equal('Table');
    });

    it('takes its default name from the language', async () => {
      const el = await tableFixture(
        html`<owc-table lang="de" .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(grid(el).getAttribute('aria-label')).to.equal('Tabelle');
    });

    it('is named by its label attribute', async () => {
      const el = await tableFixture(
        html`<owc-table label="Employees" .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(grid(el).getAttribute('aria-label')).to.equal('Employees');
      el.label = 'Customers';
      await el.updateComplete;
      expect(grid(el).getAttribute('aria-label')).to.equal('Customers');
    });

    it('has a header row of column headers', async () => {
      const el = await tableFixture(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(headerRow(el).getAttribute('role')).to.equal('row');
      expect(headerRow(el).parentElement.getAttribute('role')).to.equal('rowgroup');
      const cells = cellsOf(headerRow(el));
      expect(cells).to.have.length(3);
      expect(cells.map(cell => cell.getAttribute('role'))).to.deep.equal([
        'columnheader',
        'columnheader',
        'columnheader',
      ]);
      expect(cells.map(cell => cell.textContent.trim())).to.deep.equal([
        'First Name',
        'Age',
        'City',
      ]);
    });

    it('has a row of grid cells for every Data Row', async () => {
      const el = await tableFixture(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(bodyRows(el)).to.have.length(3);
      for (const row of bodyRows(el)) {
        expect(row.getAttribute('role')).to.equal('row');
        expect(cellsOf(row).map(cell => cell.getAttribute('role'))).to.deep.equal([
          'gridcell',
          'gridcell',
          'gridcell',
        ]);
      }
      expect(el.shadowRoot.querySelector('.table-body').getAttribute('role')).to.equal('rowgroup');
    });

    it('has rows of grid cells for insert rows', async () => {
      const el = await tableFixture(
        html`<owc-table
          .columns=${[{ ...columns[0], type: 'editable' }, columns[1], columns[2]]}
          .data=${data}
          .insertData=${[{ id: '', firstName: '', age: 0, city: '' }]}
        ></owc-table>`,
      );
      expect(bodyRows(el)).to.have.length(4);
      const insertRow = bodyRows(el)[3];
      expect(insertRow.getAttribute('role')).to.equal('row');
      expect(cellsOf(insertRow).map(cell => cell.getAttribute('role'))).to.deep.equal([
        'gridcell',
        'gridcell',
        'gridcell',
      ]);
    });

    for (const mode of ['never', 'always']) {
      it(`has nothing but row groups and presentational containers between the grid and its rows (virtualizer-mode="${mode}")`, async () => {
        const el = await tableFixture(
          html`<owc-table
            virtualizer-mode=${mode}
            .columns=${columns}
            .data=${rows(40)}
          ></owc-table>`,
        );
        const allRows = [...el.shadowRoot.querySelectorAll('#data-table [role="row"]')];
        expect(allRows).to.have.length(bodyRows(el).length + 1);
        for (const row of allRows) {
          const between = [];
          for (let parent = row.parentElement; parent !== grid(el); parent = parent.parentElement) {
            between.push(parent.getAttribute('role'));
          }
          expect(between.at(-1)).to.equal('rowgroup');
          expect(between.slice(0, -1).every(role => role === 'none')).to.be.true;
        }
        // whatever else is in the grid has no part in it
        for (const child of el.shadowRoot.querySelectorAll('#virtualize-container > *')) {
          expect(child.getAttribute('role')).to.equal('none');
        }
      });
    }

    it('keeps the loading indicator out of the grid, and is busy while loading', async () => {
      const el = await tableFixture(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(
        el.shadowRoot.querySelector('#loading-indicator').getAttribute('aria-hidden'),
      ).to.equal('true');
      expect(grid(el).getAttribute('aria-busy')).to.equal('false');
      el.loading = true;
      await el.updateComplete;
      expect(grid(el).getAttribute('aria-busy')).to.equal('true');
    });

    it('shows the message of an empty table as one row with one cell across all columns', async () => {
      const el = await tableFixture(html`<owc-table .columns=${columns} .data=${[]}></owc-table>`);
      const bodyRowEls = [...el.shadowRoot.querySelectorAll('.table-body [role="row"]')];
      expect(bodyRowEls).to.have.length(1);
      const cells = [...bodyRowEls[0].querySelectorAll('[role="gridcell"]')];
      expect(cells).to.have.length(1);
      expect(cells[0].getAttribute('aria-colspan')).to.equal('3');
      expect(cells[0].textContent.trim()).to.equal('No data available');
      expect(cells[0].parentElement === bodyRowEls[0]).to.be.true;
      expect(bodyRowEls[0].parentElement.getAttribute('role')).to.equal('rowgroup');
    });
  });

  describe('row and column counts', () => {
    it('counts the header row and numbers the rows from it', async () => {
      const el = await tableFixture(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(grid(el).getAttribute('aria-rowcount')).to.equal('4');
      expect(headerRow(el).getAttribute('aria-rowindex')).to.equal('1');
      expect(rowIndices(el)).to.deep.equal([2, 3, 4]);
    });

    it('counts the rows of the whole list, not just the rendered ones', async () => {
      const box = await fixture(html`
        <div style="height: 300px; overflow: auto">
          <owc-table .columns=${columns} .data=${rows(100_000)}></owc-table>
        </div>
      `);
      const el = /** @type {Table} */ (box.querySelector('owc-table'));
      await settle(el);
      expect(grid(el).getAttribute('aria-rowcount')).to.equal('100001');
      expect(bodyRows(el).length).to.be.below(100);
      expect(rowIndices(el)[0]).to.equal(2);

      box.scrollTop = box.scrollHeight / 2;
      await settle(el);
      const rendered = bodyRows(el);
      expect(Number(rendered[0].dataset.index)).to.be.above(1000);
      expect(rowIndices(el)).to.deep.equal(rendered.map(row => Number(row.dataset.index) + 2));
    });

    it('counts insert rows', async () => {
      const el = await tableFixture(
        html`<owc-table
          .columns=${columns}
          .data=${data}
          .insertData=${[{ id: '', firstName: '', age: 0, city: '' }]}
        ></owc-table>`,
      );
      expect(grid(el).getAttribute('aria-rowcount')).to.equal('5');
      expect(rowIndices(el)).to.deep.equal([2, 3, 4, 5]);
    });

    it('counts an open detail as the row after its Data Row', async () => {
      const el = await tableFixture(
        html`<owc-table
          render-mode="detail"
          .columns=${columns}
          .data=${data}
          .renderDetail=${() => html`<p>Detail</p>`}
          .openDetails=${['2']}
        ></owc-table>`,
      );
      expect(grid(el).getAttribute('aria-rowcount')).to.equal('5');
      expect(rowIndices(el)).to.deep.equal([2, 3, 5]);

      el.openDetails = [];
      await el.updateComplete;
      expect(grid(el).getAttribute('aria-rowcount')).to.equal('4');
      expect(rowIndices(el)).to.deep.equal([2, 3, 4]);
    });

    it("doesn't count details in a table that shows none", async () => {
      const el = await tableFixture(
        html`<owc-table .columns=${columns} .data=${data} .openDetails=${['2']}></owc-table>`,
      );
      expect(grid(el).getAttribute('aria-rowcount')).to.equal('4');
      expect(rowIndices(el)).to.deep.equal([2, 3, 4]);
    });

    it('counts group headers, but not the rows of collapsed groups', async () => {
      const el = await tableFixture(
        html`<owc-table
          .columns=${columns}
          .data=${[
            { id: '1', firstName: 'Robert', age: 34, city: 'Vienna' },
            { id: '2', firstName: 'Sarah', age: 65, city: 'Graz' },
            { id: '3', firstName: 'Grace', age: 25, city: 'Vienna' },
            { id: '4', firstName: 'Ada', age: 36, city: 'Linz' },
          ]}
          .groupSelector=${row => row.city}
          .groupList=${[
            { key: 'Vienna', label: 'Vienna', active: true },
            { key: 'Graz', label: 'Graz', active: false },
            { key: 'Linz', label: 'Linz', active: true },
          ]}
        ></owc-table>`,
      );
      // header row, Vienna, Robert, Grace, Graz (collapsed), Linz, Ada
      expect(grid(el).getAttribute('aria-rowcount')).to.equal('7');
      expect(bodyRows(el).map(row => cellsOf(row)[0].textContent.trim())).to.deep.equal([
        'Robert',
        'Grace',
        'Ada',
      ]);
      expect(rowIndices(el)).to.deep.equal([3, 4, 7]);
    });

    it('counts the header row and the message row of an empty table', async () => {
      const el = await tableFixture(html`<owc-table .columns=${columns} .data=${[]}></owc-table>`);
      expect(grid(el).getAttribute('aria-rowcount')).to.equal('2');
      expect(
        el.shadowRoot.querySelector('.table-body [role="row"]').getAttribute('aria-rowindex'),
      ).to.equal('2');
    });

    it('has no column counts or indices, since every column is in the DOM', async () => {
      const el = await tableFixture(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      expect(el.shadowRoot.querySelectorAll('[aria-colcount], [aria-colindex]')).to.have.length(0);
    });
  });
});
