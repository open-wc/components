import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import { deepActiveElement } from '../a11y/controls.js';
import {
  columns,
  data,
  rows,
  tableFixture,
  settle,
  grid,
  bodyRows,
  cellsOf,
  focusedTable,
  press,
  focusAt,
  cellHasFocus,
  fullTable,
  containers,
  rowClicks,
  linkActivations,
  clickOn,
  clickBeside,
  rowLink,
  linkTable,
} from './OwcTable.test-browser.helpers.js';

/** @typedef {import('./OwcTable.test-browser.helpers.js').Table} Table */

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table row actions', () => {
  describe('in simple rows', () => {
    it('fires rowClick with Enter on a plain cell, as a click does', async () => {
      const el = await focusedTable(
        html`<owc-table .columns=${columns} .data=${data}></owc-table>`,
      );
      const clicked = rowClicks(el);
      await press('ArrowDown');
      await press('ArrowRight');
      await press('Enter');
      expect(clicked).to.deep.equal([data[1]]);
      expect(focusAt(el)).to.equal('1:1');
    });

    it('has no action in insert rows, in the header row and on the message of an empty table', async () => {
      const el = await focusedTable(
        html`<owc-table
          .columns=${columns}
          .data=${data}
          .insertData=${[{ id: 'new', firstName: 'New', age: 1, city: '' }]}
        ></owc-table>`,
      );
      const clicked = rowClicks(el);
      await press('Control+End');
      expect(focusAt(el)).to.equal('3:2');
      await press('Enter');
      await press('Control+Home');
      await press('ArrowUp');
      expect(focusAt(el)).to.equal('header:0');
      await press('Enter');
      el.data = [];
      el.insertData = [];
      await el.updateComplete;
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('empty');
      await press('Enter');
      expect(clicked).to.deep.equal([]);
    });
  });

  for (const renderMode of ['detail', 'detailDeferred']) {
    describe(`in ${renderMode} rows`, () => {
      it('toggles the detail with Enter on a plain cell, and fires rowClick', async () => {
        const el = await focusedTable(
          html`<owc-table
            render-mode=${renderMode}
            .columns=${columns}
            .data=${data}
            .renderDetail=${row => html`<p>Detail of ${row.firstName}</p>`}
          ></owc-table>`,
        );
        const clicked = rowClicks(el);
        await press('ArrowRight');
        await press('Enter');
        expect(el.openDetails).to.deep.equal(['1']);
        await el.updateComplete;
        expect(bodyRows(el)[0].parentElement.querySelector('wa-details').open).to.be.true;
        expect(focusAt(el)).to.equal('0:1');
        // past the open detail, which is the next row
        await press('ArrowDown');
        await press('ArrowDown');
        expect(focusAt(el)).to.equal('1:1');
        await press('Enter');
        expect(el.openDetails).to.deep.equal(['2']);
        await press('Enter');
        expect(el.openDetails).to.deep.equal([]);
        expect(clicked).to.deep.equal([data[0], data[1], data[1]]);
      });

      it('toggles the detail with a click beside the text of a cell, which gets the focus', async () => {
        const el = await tableFixture(
          html`<owc-table
            render-mode=${renderMode}
            .columns=${columns}
            .data=${data}
            .renderDetail=${row => html`<p>Detail of ${row.firstName}</p>`}
          ></owc-table>`,
        );
        const clicked = rowClicks(el);
        await clickBeside(cellsOf(bodyRows(el)[1])[2]);
        expect(el.openDetails).to.deep.equal(['2']);
        expect(focusAt(el)).to.equal('1:2');
        expect(cellHasFocus(el)).to.be.true;
        expect(clicked).to.deep.equal([data[1]]);
        await press('Enter');
        expect(el.openDetails).to.deep.equal([]);
      });
    });
  }

  describe('in link rows', () => {
    it("has the row's link in the first data cell, after the detail toggle and the selector", async () => {
      const el = await tableFixture(fullTable);
      for (const row of bodyRows(el).slice(0, 3)) {
        const cells = cellsOf(row);
        expect(row.querySelectorAll('a')).to.have.length(1);
        expect(rowLink(row).parentElement === cells[2]).to.be.true;
      }
      expect(bodyRows(el).map(row => rowLink(row)?.getAttribute('href'))).to.deep.equal([
        '#row-1',
        '#row-2',
        '#row-3',
        undefined,
      ]);
      const link = await tableFixture(linkTable);
      expect(rowLink(bodyRows(link)[1]).parentElement === cellsOf(bodyRows(link)[1])[0]).to.be.true;
    });

    it('covers the whole row with the link', async () => {
      const el = await tableFixture(fullTable);
      for (const row of bodyRows(el).slice(0, 3)) {
        const covered = rowLink(row).getBoundingClientRect();
        const whole = row.getBoundingClientRect();
        expect([covered.left, covered.top, covered.width, covered.height]).to.deep.equal([
          whole.left,
          whole.top,
          whole.width,
          whole.height,
        ]);
        expect(whole.width).to.be.greaterThan(200);
      }
    });

    it('shows the focus ring of the theme around the row while the link has the focus', async () => {
      const wrapper = await fixture(html`
        <div style="--wa-focus-ring: solid 3px rgb(0, 0, 255); --wa-focus-ring-width: 3px">
          <button id="before">before</button>
          ${linkTable}
        </div>
      `);
      const el = /** @type {Table} */ (wrapper.querySelector('owc-table'));
      await settle(el);
      /** @type {HTMLElement} */ (wrapper.querySelector('#before')).focus();
      await press('Tab');
      expect(deepActiveElement() === rowLink(bodyRows(el)[0])).to.be.true;
      // The row draws the ring for its link, above the cells that lie above the link.
      const [focused, other] = bodyRows(el).map(row => getComputedStyle(row, '::after'));
      expect(focused.content).to.not.equal('none');
      expect(focused.outlineStyle).to.equal('solid');
      expect(focused.outlineWidth).to.equal('3px');
      expect(focused.outlineColor).to.equal('rgb(0, 0, 255)');
      expect(focused.outlineOffset).to.equal('-3px');
      expect([focused.top, focused.right, focused.bottom, focused.left]).to.deep.equal([
        '0px',
        '0px',
        '0px',
        '0px',
      ]);
      expect(focused.pointerEvents).to.equal('none');
      expect(other.content).to.equal('none');
      expect(other.outlineStyle).to.equal('none');
    });

    it('shows no focus ring on a row whose link the pointer focused', async () => {
      const el = await tableFixture(linkTable);
      linkActivations(el);
      const row = bodyRows(el)[1];
      await clickBeside(cellsOf(row)[1]);
      expect(deepActiveElement() === rowLink(row)).to.be.true;
      expect(getComputedStyle(row, '::after').content).to.equal('none');
    });

    it('gives the focus of its cell to the link, which Enter follows', async () => {
      const el = await focusedTable(linkTable);
      const activations = linkActivations(el);
      expect(focusAt(el)).to.equal('0:0');
      expect(deepActiveElement() === rowLink(bodyRows(el)[0])).to.be.true;
      await press('Enter');
      expect(activations).to.deep.equal(['#row-1']);
      await press('ArrowDown');
      expect(deepActiveElement() === rowLink(bodyRows(el)[1])).to.be.true;
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('1:1');
      expect(cellHasFocus(el)).to.be.true;
      await press('ArrowLeft');
      expect(deepActiveElement() === rowLink(bodyRows(el)[1])).to.be.true;
    });

    it('leaves the focus of the detail toggle and of the checkbox to them in a selectable table with details', async () => {
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
      const focused = [];
      for (let column = 0; column < 5; column++) {
        const active = deepActiveElement();
        focused.push(`${focusAt(el)} ${active.localName}${active.type ? `.${active.type}` : ''}`);
        await press('ArrowRight');
      }
      expect(focused).to.deep.equal([
        '0:0 button.button', // the detail toggle
        '0:1 input.checkbox',
        '0:2 a', // the row's link, in the first data cell
        '0:3 div',
        '0:4 div',
      ]);
    });

    it('is one of the controls of a cell that has another one, which Enter goes into', async () => {
      const el = await focusedTable(fullTable);
      const activations = linkActivations(el);
      await press('ArrowRight');
      await press('ArrowRight');
      // First Name is editable, so its cell has the row's link and the editor
      expect(focusAt(el)).to.equal('0:2');
      expect(cellHasFocus(el)).to.be.true;
      await press('Enter');
      expect(deepActiveElement() === rowLink(bodyRows(el)[0])).to.be.true;
      expect(activations).to.deep.equal([]);
      await press('Tab');
      expect(deepActiveElement().classList.contains('display')).to.be.true;
      await press('Tab');
      expect(deepActiveElement() === rowLink(bodyRows(el)[0])).to.be.true;
      await press('Enter');
      expect(activations).to.deep.equal(['#row-1']);
      await press('Escape');
      expect(cellHasFocus(el)).to.be.true;
      expect(focusAt(el)).to.equal('0:2');
    });

    it('follows the link with Enter on any plain cell of the row, and fires rowClick as a click does', async () => {
      const el = await focusedTable(linkTable);
      const activations = linkActivations(el);
      const clicked = rowClicks(el);
      await press('ArrowRight');
      await press('Enter');
      expect(activations).to.deep.equal(['#row-1']);
      await press('ArrowDown');
      await press('ArrowRight');
      expect(focusAt(el)).to.equal('1:2');
      await press('Enter');
      expect(activations).to.deep.equal(['#row-1', '#row-2']);
      expect(clicked).to.deep.equal([data[0], data[1]]);
      expect(focusAt(el)).to.equal('1:2');
    });

    describe('with the pointer', () => {
      it('follows the link on a click on the text of any cell, and beside it', async () => {
        const el = await tableFixture(linkTable);
        const activations = linkActivations(el);
        const clicked = rowClicks(el);
        const [first, second] = bodyRows(el);
        await clickOn(cellsOf(first)[0].querySelector('.cell-text'));
        await clickOn(cellsOf(second)[2].querySelector('.cell-text'));
        await clickBeside(cellsOf(second)[1]);
        expect(activations).to.deep.equal(['#row-1', '#row-2', '#row-2']);
        expect(clicked).to.deep.equal([data[0], data[1], data[1]]);
      });

      it("doesn't cover the controls of the row: the detail toggle, the checkbox and a button", async () => {
        /** @type {string[]} */
        const pressed = [];
        const el = await tableFixture(
          html`<owc-table
            selectable
            render-mode="linkWithDetail"
            .columns=${[
              columns[0],
              {
                label: 'Actions',
                field: 'actions',
                formatter: row =>
                  html`<button class="edit" @click=${() => pressed.push(row.firstName)}>
                    Edit
                  </button>`,
              },
              columns[1],
            ]}
            .data=${data}
            .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
            .renderDetail=${() => html`<p>Detail</p>`}
          ></owc-table>`,
        );
        const activations = linkActivations(el);
        const row = bodyRows(el)[1];

        await clickOn(row.querySelector('owc-icon-button'));
        expect(el.openDetails).to.deep.equal(['2']);
        expect(focusAt(el)).to.equal('1:0');
        expect(deepActiveElement().localName).to.equal('button');

        await clickOn(row.querySelector('wa-checkbox'));
        expect(el.selectedData).to.deep.equal([data[1]]);
        expect(focusAt(el)).to.equal('1:1');
        expect(deepActiveElement().matches('input[type="checkbox"]')).to.be.true;

        await clickOn(row.querySelector('button.edit'));
        expect(pressed).to.deep.equal(['Sarah']);
        expect(focusAt(el)).to.equal('1:3');

        expect(activations).to.deep.equal([]);
      });

      it('follows the link on a click on an element of a cell that is no control, as it does for text', async () => {
        const el = await tableFixture(
          html`<owc-table
            render-mode="link"
            .columns=${[
              columns[0],
              {
                label: 'Status',
                field: 'status',
                formatter: () => html`<span class="tag">active</span>`,
              },
              {
                label: 'Copy',
                field: 'copy',
                formatter: () =>
                  html`<span class="copy" @click=${event => event.preventDefault()}>copy</span>`,
              },
              {
                label: 'Done',
                field: 'done',
                formatter: () =>
                  html`<label class="done"
                    >a label for its checkbox <input type="checkbox"
                  /></label>`,
              },
            ]}
            .data=${data}
            .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
          ></owc-table>`,
        );
        const activations = linkActivations(el);
        const clicked = rowClicks(el);
        const row = bodyRows(el)[2];
        await clickOn(row.querySelector('.tag'));
        expect(activations).to.deep.equal(['#row-3']);
        await sendKeys({ down: 'Shift' });
        await clickOn(row.querySelector('.tag'));
        await sendKeys({ up: 'Shift' });
        expect(activations).to.deep.equal(['#row-3', 'shift+#row-3']);
        expect(clicked).to.deep.equal([data[2], data[2]]);

        // an element that handles its click itself
        await clickOn(row.querySelector('.copy'));
        expect(activations).to.deep.equal(['#row-3', 'shift+#row-3']);
        expect(clicked).to.deep.equal([data[2], data[2], data[2]]);

        // a label, whose click is for its control
        const label = row.querySelector('label.done').getBoundingClientRect();
        await sendMouse({
          type: 'click',
          position: [Math.round(label.left + 10), Math.round(label.top + label.height / 2)],
        });
        expect(row.querySelector('label.done input').checked).to.be.true;
        expect(activations).to.deep.equal(['#row-3', 'shift+#row-3']);
      });
    });

    describe('the name of the link', () => {
      /**
       * The element that names a link through `aria-labelledby`.
       *
       * @param {Element} link
       */
      function labelOf(link) {
        const id = link.getAttribute('aria-labelledby');
        return id ? /** @type {ShadowRoot} */ (link.getRootNode()).getElementById(id) : null;
      }

      it('is the aria-label of getRowLinkSettings', async () => {
        const el = await tableFixture(
          html`<owc-table
            render-mode="link"
            .columns=${columns}
            .data=${data}
            .getRowLinkSettings=${row => ({
              href: `#row-${row.id}`,
              'aria-label': `Open ${row.firstName}`,
            })}
          ></owc-table>`,
        );
        const links = bodyRows(el).map(rowLink);
        expect(links.map(link => link.getAttribute('aria-label'))).to.deep.equal([
          'Open Robert',
          'Open Sarah',
          'Open Grace',
        ]);
        expect(links.some(link => link.hasAttribute('aria-labelledby'))).to.be.false;
        await expect(el).to.be.accessible();
      });

      it('is the content of its cell without one, as in the link examples of the docs', async () => {
        const el = await tableFixture(linkTable);
        const links = bodyRows(el).map(rowLink);
        expect(links.map(link => labelOf(link)?.textContent.trim())).to.deep.equal([
          'Robert',
          'Sarah',
          'Grace',
        ]);
        for (const link of links) {
          expect(link.parentElement.contains(labelOf(link))).to.be.true;
        }
        await expect(el).to.be.accessible();
      });

      it('is the content of the first data cell in a selectable table with details', async () => {
        const el = await tableFixture(
          html`<owc-table
            selectable
            render-mode="linkWithDetail"
            .columns=${columns}
            .data=${data}
            .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
            .renderDetail=${() => html`<p>Detail</p>`}
          ></owc-table>`,
        );
        expect(bodyRows(el).map(row => labelOf(rowLink(row))?.textContent.trim())).to.deep.equal([
          'Robert',
          'Sarah',
          'Grace',
        ]);
      });

      it('stays unique per row while rows are rendered and removed by scrolling', async () => {
        const el = await tableFixture(
          html`<owc-table
            render-mode="link"
            virtualizer-mode="always"
            .columns=${columns}
            .data=${rows(500)}
            .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
          ></owc-table>`,
        );
        window.scrollTo(0, 3000);
        await settle(el);
        const rendered = bodyRows(el);
        expect(rendered.length).to.be.greaterThan(5);
        expect(Number(rendered[0].dataset.index)).to.be.greaterThan(0);
        for (const row of rendered) {
          expect(labelOf(rowLink(row))?.textContent.trim()).to.equal(`Person ${row.dataset.index}`);
        }
      });

      for (const [lang, name] of [
        ['en', 'Open row'],
        ['de', 'Zeile öffnen'],
      ]) {
        it(`is "${name}" when its cell shows nothing (${lang})`, async () => {
          const el = await tableFixture(
            html`<owc-table
              lang=${lang}
              render-mode="link"
              .columns=${columns}
              .data=${[{ id: '1', firstName: '', age: 34, city: 'Vienna' }, data[1]]}
              .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
            ></owc-table>`,
          );
          const [empty, named] = bodyRows(el).map(rowLink);
          expect(empty.hasAttribute('aria-labelledby')).to.be.false;
          expect(empty.getAttribute('aria-label')).to.equal(name);
          expect(labelOf(named).textContent.trim()).to.equal('Sarah');
          await expect(el).to.be.accessible();
        });
      }
    });

    it('navigates with Enter on a plain cell', async () => {
      const el = await focusedTable(linkTable);
      try {
        await press('ArrowDown');
        await press('ArrowRight');
        expect(cellHasFocus(el)).to.be.true;
        await press('Enter');
        expect(location.hash).to.equal('#row-2');
      } finally {
        history.replaceState(null, '', location.pathname + location.search);
      }
    });

    it('follows the link in linkWithDetail rows, and leaves the detail to its toggle', async () => {
      const el = await focusedTable(
        html`<owc-table
          render-mode="linkWithDetail"
          .columns=${columns}
          .data=${data}
          .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
          .renderDetail=${() => html`<p>Detail</p>`}
        ></owc-table>`,
      );
      const activations = linkActivations(el);
      await press('End');
      expect(focusAt(el)).to.equal('0:3');
      await press('Enter');
      expect(activations).to.deep.equal(['#row-1']);
      expect(el.openDetails).to.deep.equal([]);
    });

    it('fires rowClick with Enter in a row that has no link', async () => {
      const el = await focusedTable(
        html`<owc-table
          render-mode="link"
          .columns=${columns}
          .data=${data}
          .getRowLinkSettings=${row => (row.id === '2' ? undefined : { href: `#row-${row.id}` })}
        ></owc-table>`,
      );
      const activations = linkActivations(el);
      const clicked = rowClicks(el);
      await press('ArrowDown');
      expect(focusAt(el)).to.equal('1:0');
      expect(cellHasFocus(el)).to.be.true;
      await press('Enter');
      await press('Shift+Enter');
      expect(clicked).to.deep.equal([data[1]]);
      expect(activations).to.deep.equal([]);
    });

    for (const key of ['Control+Enter', 'Meta+Enter', 'Shift+Enter', 'Control+Shift+Enter']) {
      it(`passes ${key} on a plain cell on to the link, like ${key} on the link itself`, async () => {
        const el = await focusedTable(linkTable);
        const activations = linkActivations(el);
        // on the link itself, where the browser follows it
        await press(key);
        expect(activations).to.have.length(1);
        expect(activations[0]).to.not.equal('#row-1');
        await press('ArrowRight');
        expect(cellHasFocus(el)).to.be.true;
        await press(key);
        expect(activations).to.deep.equal([activations[0], activations[0]]);
      });
    }
  });

  it('does nothing with Enter and Shift+Space while the focus is parked on the grid', async () => {
    const { el, scroller } = await containers['a scroll box'](
      html`<owc-table
        selectable
        render-mode="link"
        virtualizer-mode="always"
        .columns=${columns}
        .data=${rows(2000)}
        .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
      ></owc-table>`,
    );
    const activations = linkActivations(el);
    const clicked = rowClicks(el);
    /** @type {HTMLElement} */ (document.querySelector('#before')).focus();
    await press('Tab');
    await press('End');
    expect(focusAt(el)).to.equal('0:3');
    scroller.scrollTop = 40_000;
    await settle(el);
    expect(deepActiveElement() === grid(el)).to.be.true;

    await press('Enter');
    await press('Shift+Space');
    await el.updateComplete;
    expect(activations).to.deep.equal([]);
    expect(clicked).to.deep.equal([]);
    expect(el.selectedData).to.deep.equal([]);
    expect(deepActiveElement() === grid(el)).to.be.true;

    // the navigation keys still go on from the remembered cell
    await press('ArrowDown');
    await waitUntil(() => focusAt(el) === '1:3', 'the row after the remembered one gets the focus');
  });

  it('still toggles a group with a click on its header', async () => {
    const el = await tableFixture(
      html`<owc-table
        .columns=${columns}
        .data=${data}
        .groupSelector=${row => row.city}
        .groupList=${[{ key: 'Vienna', label: 'Vienna', active: true }]}
        .othersGroupActive=${true}
      ></owc-table>`,
    );
    expect(bodyRows(el)).to.have.length(3);
    await clickBeside(el.shadowRoot.querySelector('.group-label-container'));
    await settle(el);
    expect(bodyRows(el)).to.have.length(2);
  });
});
