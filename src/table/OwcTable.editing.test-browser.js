import { html, expect, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { deepActiveElement } from '../a11y/controls.js';
import {
  columns,
  data,
  rows,
  tableFixture,
  settle,
  bodyRows,
  betweenButtons,
  focusedTable,
  press,
  focusedCell,
  focusAt,
  cellHasFocus,
  isInView,
  containers,
} from './OwcTable.test-browser.helpers.js';

/** @typedef {import('./OwcTable.test-browser.helpers.js').Table} Table */

beforeEach(() => {
  window.scrollTo(0, 0);
});

describe('owc-table editing', () => {
  const professions = [
    { value: 'teacher', label: 'Teacher' },
    { value: 'lawyer', label: 'Lawyer' },
  ];

  /** The editors of the table, by `editableOptions.type`. */
  const editors = {
    input: {},
    textarea: { type: 'textarea' },
    autocomplete: { type: 'autocomplete', data: professions },
  };

  /** @param {Record<string, unknown>} editableOptions */
  function editorColumns(editableOptions) {
    return [
      { label: 'First Name', field: 'firstName', type: 'editable', editableOptions },
      { label: 'Age', field: 'age', formatter: 'number' },
    ];
  }

  /**
   * The `owc-click-editable-*` element the focus is in.
   *
   * @param {Table} el
   */
  function focusedEditor(el) {
    const active = el.shadowRoot.activeElement;
    return active?.localName.startsWith('owc-click-editable-')
      ? /** @type {HTMLElement & { editable: boolean, value: unknown }} */ (active)
      : undefined;
  }

  /**
   * Whether the focus is on an editor's read view, not in its form control.
   *
   * @param {Table} el
   */
  function onReadView(el) {
    return Boolean(focusedEditor(el)) && deepActiveElement().classList.contains('display');
  }

  /** @param {Table} el */
  async function untilEditing(el) {
    await waitUntil(
      () => focusedEditor(el)?.editable === true && !deepActiveElement().matches('.display'),
      'the editor edits and has the focus',
    );
  }

  for (const [name, editableOptions] of Object.entries(editors)) {
    describe(`with an ${name} editor`, () => {
      it("leaves the arrow keys to the editor while it edits, and Escape returns to the cell's control", async () => {
        const el = await focusedTable(
          html`<owc-table .columns=${editorColumns(editableOptions)} .data=${data}></owc-table>`,
        );
        expect(onReadView(el)).to.be.true;
        await press('Enter');
        await untilEditing(el);
        for (const key of ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End']) {
          await press(key);
        }
        expect(focusAt(el)).to.equal('0:0');
        expect(focusedEditor(el)?.editable).to.be.true;

        await press('Escape');
        await waitUntil(() => onReadView(el), "the focus is on the cell's control");
        expect(focusedEditor(el).editable).to.be.false;
        expect(focusAt(el)).to.equal('0:0');
        await press('ArrowDown');
        expect(focusAt(el)).to.equal('1:0');
      });

      it("commits with Enter and returns to the cell's control, from where ↓ moves on", async () => {
        const rows = data.map(row => ({ ...row }));
        const el = await focusedTable(
          html`<owc-table .columns=${editorColumns(editableOptions)} .data=${rows}></owc-table>`,
        );
        await press('Enter');
        await untilEditing(el);
        if (name === 'autocomplete') {
          // the one option that matches is the one Enter picks
          await sendKeys({ type: 'Law' });
        } else {
          await press('ControlOrMeta+A');
          await sendKeys({ type: 'Ada' });
        }
        await press('Enter');
        await waitUntil(() => onReadView(el), "the focus is on the cell's control");
        expect(rows[0].firstName).to.equal(name === 'autocomplete' ? 'lawyer' : 'Ada');
        expect(focusedEditor(el).editable).to.be.false;
        expect(focusAt(el)).to.equal('0:0');
        await press('ArrowDown');
        expect(focusAt(el)).to.equal('1:0');
        expect(onReadView(el)).to.be.true;
      });
    });
  }

  it('starts editing with Space too, which the editor then types', async () => {
    const el = await focusedTable(
      html`<owc-table .columns=${editorColumns({})} .data=${data}></owc-table>`,
    );
    await press('Space');
    await untilEditing(el);
    expect(focusAt(el)).to.equal('0:0');
    await press('End');
    await press('Space');
    await sendKeys({ type: 'B.' });
    expect(/** @type {HTMLInputElement} */ (deepActiveElement()).value).to.equal('Robert B.');
  });

  it("edits in a link row's first data cell, which holds the link and the editor", async () => {
    const rows = data.map(row => ({ ...row }));
    const el = await focusedTable(
      html`<owc-table
        render-mode="link"
        .columns=${editorColumns({})}
        .data=${rows}
        .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
      ></owc-table>`,
    );
    expect(cellHasFocus(el)).to.be.true;
    await press('Enter');
    expect(deepActiveElement().localName).to.equal('a');
    await press('Tab');
    expect(onReadView(el)).to.be.true;
    await press('Enter');
    await untilEditing(el);
    await press('ControlOrMeta+A');
    await sendKeys({ type: 'Ada' });
    await press('Enter');
    await waitUntil(() => onReadView(el), 'the focus is on the read view');
    expect(rows[0].firstName).to.equal('Ada');
    await press('Escape');
    expect(cellHasFocus(el)).to.be.true;
    expect(focusAt(el)).to.equal('0:0');

    // while it edits, Tab is the editor's: it commits and leaves the grid
    await press('Enter');
    await press('Tab');
    await press('Enter');
    await untilEditing(el);
    await sendKeys({ type: 'x' });
    await press('Tab');
    expect(focusAt(el)).to.equal('#after');
    expect(rows[0].firstName).to.equal('Adax');
  });

  it("cancels with one Escape in interaction mode and stays on the editor's read view, and leaves with the next one", async () => {
    const rows = data.map(row => ({ ...row }));
    const before = rows[0].firstName;
    const el = await focusedTable(
      html`<owc-table
        render-mode="link"
        .columns=${editorColumns({})}
        .data=${rows}
        .getRowLinkSettings=${row => ({ href: `#row-${row.id}` })}
      ></owc-table>`,
    );
    await press('Enter');
    await press('Tab');
    await press('Enter');
    await untilEditing(el);
    await sendKeys({ type: 'x' });
    await press('Escape');
    await waitUntil(() => onReadView(el), 'the focus is on the read view');
    expect(focusedEditor(el).editable).to.be.false;
    // another test of the suite edits the shared rows
    expect(rows[0].firstName).to.equal(before);
    // still in interaction mode: Tab cycles to the link
    await press('Tab');
    expect(deepActiveElement().localName).to.equal('a');
    await press('Tab');
    expect(onReadView(el)).to.be.true;
    await press('Escape');
    expect(cellHasFocus(el)).to.be.true;
  });

  it("cancels with one Escape in an open detail and stays on the editor's read view", async () => {
    const el = await focusedTable(
      html`<owc-table
        render-mode="detail"
        .columns=${columns}
        .data=${data}
        .renderDetail=${() =>
          html`<owc-click-editable-input value="Note"></owc-click-editable-input
            ><button>Other</button>`}
        .openDetails=${['1']}
      ></owc-table>`,
    );
    await press('ArrowDown');
    await press('Enter');
    const editor = /** @type {HTMLElement & { editable: boolean }} */ (
      el.shadowRoot.querySelector('owc-click-editable-input')
    );
    await waitUntil(() => deepActiveElement()?.matches('.display'), 'the read view has the focus');
    await press('Enter');
    await waitUntil(() => editor.editable, 'the editor edits');
    await press('Escape');
    await waitUntil(() => !editor.editable, 'the edit is cancelled');
    expect(deepActiveElement().matches('.display')).to.be.true;
    await press('Escape');
    expect(cellHasFocus(el)).to.be.true;
  });

  it('names checkboxes by their column, editable or not, without showing the name', async () => {
    const el = await tableFixture(
      html`<owc-table
        .columns=${[
          ...columns,
          {
            label: 'Active',
            field: 'active',
            type: 'editable',
            editableOptions: { type: 'checkbox' },
          },
          { label: 'Verified', field: 'verified', formatter: 'checkbox' },
        ]}
        .data=${data.map(row => ({ ...row, active: true, verified: false }))}
        .insertData=${[{ id: '', firstName: '', active: false, verified: false }]}
      ></owc-table>`,
    );
    for (const row of bodyRows(el)) {
      const [active, verified] = row.querySelectorAll('wa-checkbox');
      expect(active.textContent.trim()).to.equal('Active');
      expect(verified.textContent.trim()).to.equal('Verified');
      const label = active.shadowRoot.querySelector('[part~="label"]');
      expect(label.getBoundingClientRect().width).to.be.at.most(1);
    }
    await expect(el).to.be.accessible();
  });

  describe('in an insert row', () => {
    /** First Name, Last Name and City are editable, Age isn't. */
    const insertColumns = [
      { label: 'First Name', field: 'firstName', type: 'editable' },
      { label: 'Age', field: 'age', formatter: 'number' },
      { label: 'Last Name', field: 'lastName', type: 'editable' },
      { label: 'City', field: 'city', type: 'editable' },
    ];

    /**
     * Where the focus is, and whether it is in an editor that edits
     * (`3:0 editing`) or on an editor's read view (`3:0 read`).
     *
     * @param {Table} el
     */
    function fieldAt(el) {
      const editor = focusedEditor(el);
      if (!editor) {
        return focusAt(el);
      }
      return `${focusAt(el)} ${onReadView(el) ? 'read' : 'editing'}`;
    }

    it('moves from field to field with Tab and Shift+Tab, and leaves the grid from the last and the first one', async () => {
      const row = { id: '', firstName: '', age: 0, lastName: '', city: '' };
      const { el, before, after } = await betweenButtons(
        html`<owc-table .columns=${insertColumns} .data=${data} .insertData=${[row]}></owc-table>`,
      );
      before.focus();
      await press('Tab');
      for (let presses = 0; presses < 3; presses++) {
        await press('ArrowDown');
      }
      await untilEditing(el);
      expect(fieldAt(el)).to.equal('3:0 editing');
      await sendKeys({ type: 'Ada' });

      await press('Tab');
      await untilEditing(el);
      expect(fieldAt(el)).to.equal('3:2 editing');
      // what was typed is committed when the field is left
      expect(row.firstName).to.equal('Ada');
      await press('Tab');
      expect(fieldAt(el)).to.equal('3:3 editing');
      await press('Tab');
      expect(focusAt(el)).to.equal('#after');

      // A field that the focus left has closed, as editors do: it shows its
      // value now, and Enter edits it again.
      await press('Shift+Tab');
      expect(fieldAt(el)).to.equal('3:3 read');
      await press('Shift+Tab');
      expect(fieldAt(el)).to.equal('3:2 read');
      await press('Shift+Tab');
      expect(fieldAt(el)).to.equal('3:0 read');
      expect(focusedEditor(el).shadowRoot.querySelector('.display').textContent.trim()).to.equal(
        'Ada',
      );
      await press('Shift+Tab');
      expect(focusAt(el)).to.equal('#before');
      expect(after === document.activeElement).to.be.false;
    });

    it('names its open editors by their columns', async () => {
      const el = await tableFixture(
        html`<owc-table
          .columns=${[
            { label: 'First Name', field: 'firstName', type: 'editable' },
            {
              label: 'Notes',
              field: 'notes',
              type: 'editable',
              editableOptions: { type: 'textarea' },
            },
            {
              label: 'Profession',
              field: 'profession',
              type: 'editable',
              editableOptions: { type: 'autocomplete', data: professions },
            },
          ]}
          .data=${data}
          .insertData=${[{ id: '', firstName: '', notes: '', profession: '' }]}
        ></owc-table>`,
      );
      const editorsOfRow = [...bodyRows(el)[3].querySelectorAll('[editable]')];
      expect(editorsOfRow.map(editor => editor.localName)).to.deep.equal([
        'owc-click-editable-input',
        'owc-click-editable-textarea',
        'owc-click-editable-autocomplete',
      ]);
      await expect(el).to.be.accessible();
    });

    it('moves on to the next or the previous field from a cell without one', async () => {
      const row = { id: '', firstName: '', age: 0, lastName: '', city: '' };
      const el = await focusedTable(
        html`<owc-table .columns=${insertColumns} .data=${data} .insertData=${[row]}></owc-table>`,
      );
      await press('ArrowRight');
      for (let presses = 0; presses < 3; presses++) {
        await press('ArrowDown');
      }
      expect(focusAt(el)).to.equal('3:1');
      expect(cellHasFocus(el)).to.be.true;
      await press('Tab');
      await untilEditing(el);
      expect(fieldAt(el)).to.equal('3:2 editing');

      await press('Escape');
      await press('ArrowLeft');
      expect(focusAt(el)).to.equal('3:1');
      await press('Shift+Tab');
      await untilEditing(el);
      expect(fieldAt(el)).to.equal('3:0 editing');
    });

    it('returns to the field of a row the user inserted when tabbing back in', async () => {
      const { el, after } = await betweenButtons(
        html`<owc-table
          .columns=${insertColumns}
          .data=${data}
          .handleInsert=${() => ({ id: '', firstName: '', age: 0, lastName: '', city: '' })}
        ></owc-table>`,
      );
      const add = /** @type {HTMLElement} */ (
        el.shadowRoot.querySelector('#info-wrapper wa-button')
      );
      add.focus();
      await press('Enter');
      await untilEditing(el);
      // the new row's first field
      expect(fieldAt(el)).to.equal('3:0 editing');
      await sendKeys({ type: 'Ada' });

      after.focus();
      expect(el.insertData[0].firstName).to.equal('Ada');
      await press('Shift+Tab');
      expect(fieldAt(el)).to.equal('3:0 read');
      await press('Tab');
      await untilEditing(el);
      expect(fieldAt(el)).to.equal('3:2 editing');
    });

    it('brings the row the user inserted back in when tabbing back in after scrolling away', async () => {
      const { el, scroller } = await containers['a scroll box'](
        html`<owc-table
          virtualizer-mode="always"
          .columns=${insertColumns}
          .data=${rows(500)}
          .handleInsert=${() => ({ id: '', firstName: '', age: 0, lastName: '', city: '' })}
        ></owc-table>`,
      );
      const add = /** @type {HTMLElement} */ (
        el.shadowRoot.querySelector('#info-wrapper wa-button')
      );
      add.focus();
      await press('Enter');
      await untilEditing(el);
      expect(fieldAt(el)).to.equal('500:0 editing');

      const after = /** @type {HTMLElement} */ (document.querySelector('#after'));
      after.focus();
      scroller.scrollTop = 0;
      await settle(el);
      expect(bodyRows(el).some(row => row.dataset.index === '500')).to.be.false;
      await press('Shift+Tab');
      // rendered again, the row's fields are open editors again
      await waitUntil(() => fieldAt(el) === '500:0 editing', 'the field has the focus');
      expect(isInView(focusedCell(el), scroller)).to.be.true;
    });

    it("doesn't take the focus to the new row when it left the table while the row was brought in", async () => {
      const { el } = await containers['a scroll box'](
        html`<owc-table
          virtualizer-mode="always"
          .columns=${insertColumns}
          .data=${rows(500)}
          .handleInsert=${() => ({ id: '', firstName: '', age: 0, lastName: '', city: '' })}
        ></owc-table>`,
      );
      const after = /** @type {HTMLElement} */ (document.querySelector('#after'));
      const add = /** @type {HTMLElement} */ (
        el.shadowRoot.querySelector('#info-wrapper wa-button')
      );
      // the user goes on elsewhere right after the click
      add.addEventListener('click', () => after.focus());
      add.focus();
      await press('Enter');
      await waitUntil(() => el.insertData.length === 1, 'the row is inserted');
      await settle(el);
      await nextFrame();
      expect(document.activeElement === after, deepActiveElement()?.outerHTML).to.be.true;
    });
  });
});
