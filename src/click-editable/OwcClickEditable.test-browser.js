import { fixture, html, expect, oneEvent, aTimeout } from '@open-wc/testing';
import { OwcClickEditableInput } from './OwcClickEditableInput.js';
import { OwcClickEditableTextarea } from './OwcClickEditableTextarea.js';
import { OwcClickEditableAutocomplete } from './OwcClickEditableAutocomplete.js';

customElements.define('owc-click-editable-input', OwcClickEditableInput);
customElements.define('owc-click-editable-textarea', OwcClickEditableTextarea);
customElements.define('owc-click-editable-autocomplete', OwcClickEditableAutocomplete);

/**
 * @param {import('./OwcClickEditable.js').OwcClickEditable} el
 */
function display(el) {
  return /** @type {HTMLElement} */ (el.shadowRoot.querySelector('.display'));
}

/**
 * Enters edit mode via double click.
 * @param {import('./OwcClickEditable.js').OwcClickEditable} el
 */
async function startEditing(el) {
  display(el).dispatchEvent(new Event('dblclick'));
  await el.updateComplete;
}

/**
 * @param {import('./OwcClickEditable.js').OwcClickEditable} el
 * @param {string} key
 */
function pressKey(el, key) {
  el.inputElement.dispatchEvent(new KeyboardEvent('keydown', { key }));
}

describe('owc-click-editable-input', () => {
  it('renders the value and is not editable initially', async () => {
    const el = await fixture(
      html`<owc-click-editable-input value="Hello"></owc-click-editable-input>`,
    );
    expect(display(el).textContent).to.include('Hello');
    expect(el.editable).to.equal(false);
    expect(el.inputElement.disabled).to.equal(true);
  });

  it('enters edit mode on double click and copies the value into the input', async () => {
    const el = await fixture(
      html`<owc-click-editable-input value="Hello"></owc-click-editable-input>`,
    );
    await startEditing(el);
    expect(el.editable).to.equal(true);
    expect(el.inputElement.value).to.equal('Hello');
    expect(el.inputElement.disabled).to.equal(false);
  });

  it('does not enter edit mode when read-only', async () => {
    const el = await fixture(
      html`<owc-click-editable-input value="Hello" read-only></owc-click-editable-input>`,
    );
    await startEditing(el);
    expect(el.editable).to.equal(false);
  });

  it('submits a new value on Enter and fires submit', async () => {
    const el = await fixture(
      html`<owc-click-editable-input value="Hello"></owc-click-editable-input>`,
    );
    await startEditing(el);
    el.inputElement.value = 'World';
    setTimeout(() => pressKey(el, 'Enter'));
    await oneEvent(el, 'submit');
    expect(el.value).to.equal('World');
    expect(el.editable).to.equal(false);
  });

  it('submits on blur', async () => {
    const el = await fixture(
      html`<owc-click-editable-input value="Hello"></owc-click-editable-input>`,
    );
    await startEditing(el);
    el.inputElement.value = 'Blurred';
    setTimeout(() => el.inputElement.dispatchEvent(new Event('blur')));
    await oneEvent(el, 'submit');
    expect(el.value).to.equal('Blurred');
  });

  it('closes without firing submit when the value is unchanged', async () => {
    const el = await fixture(
      html`<owc-click-editable-input value="Hello"></owc-click-editable-input>`,
    );
    let submits = 0;
    el.addEventListener('submit', () => {
      submits += 1;
    });
    await startEditing(el);
    pressKey(el, 'Enter');
    await el.updateComplete;
    expect(submits).to.equal(0);
    expect(el.editable).to.equal(false);
    expect(el.value).to.equal('Hello');
  });

  it('cancels on Escape without firing change when nothing was modified', async () => {
    const el = await fixture(
      html`<owc-click-editable-input value="Hello"></owc-click-editable-input>`,
    );
    let changes = 0;
    el.addEventListener('change', () => {
      changes += 1;
    });
    await startEditing(el);
    pressKey(el, 'Escape');
    await el.updateComplete;
    expect(changes).to.equal(0);
    expect(el.value).to.equal('Hello');
    expect(el.editable).to.equal(false);
  });

  it('restores the original value on Escape after modifications', async () => {
    const el = await fixture(
      html`<owc-click-editable-input value="Hello"></owc-click-editable-input>`,
    );
    await startEditing(el);
    el.inputElement.value = 'Changed';
    el.inputElement.dispatchEvent(new Event('input'));
    await el.updateComplete;
    expect(el.value).to.equal('Changed');

    setTimeout(() => pressKey(el, 'Escape'));
    await oneEvent(el, 'change');
    expect(el.value).to.equal('Hello');
    expect(el.editable).to.equal(false);
  });

  it('keeps a Date value a Date when cancelling a date edit (regression)', async () => {
    const date = new Date(2024, 0, 15);
    const el = await fixture(
      html`<owc-click-editable-input type="date" .value=${date}></owc-click-editable-input>`,
    );
    let changes = 0;
    el.addEventListener('change', () => {
      changes += 1;
    });
    await startEditing(el);
    pressKey(el, 'Escape');
    await el.updateComplete;
    expect(el.value).to.equal(date);
    expect(changes).to.equal(0);
  });

  it('parses numbers on submit and keeps an editable 0 value (regression)', async () => {
    const el = await fixture(
      html`<owc-click-editable-input type="number" .value=${0}></owc-click-editable-input>`,
    );
    expect(el.parsedValue).to.equal(0);
    await startEditing(el);
    // editing a 0 must not clear the input
    expect(String(el.inputElement.value)).to.equal('0');

    el.inputElement.value = '42.5';
    setTimeout(() => pressKey(el, 'Enter'));
    await oneEvent(el, 'submit');
    expect(el.value).to.equal(42.5);
  });

  it('keeps editing when the validator rejects the value', async () => {
    const el = await fixture(
      html`<owc-click-editable-input
        value="Bravo"
        .validator=${value => ({ valid: String(value).startsWith('B'), error: 'must start with B' })}
      ></owc-click-editable-input>`,
    );
    let submits = 0;
    el.addEventListener('submit', () => {
      submits += 1;
    });
    await startEditing(el);
    el.inputElement.value = 'Alpha';
    pressKey(el, 'Enter');
    await el.updateComplete;
    expect(submits).to.equal(0);
    expect(el.editable).to.equal(true);

    el.inputElement.value = 'Beta';
    setTimeout(() => pressKey(el, 'Enter'));
    await oneEvent(el, 'submit');
    expect(el.value).to.equal('Beta');
  });

  it('shows the fallback value when empty', async () => {
    const el = await fixture(
      html`<owc-click-editable-input
        value=""
        fallbackValue="nothing here"
      ></owc-click-editable-input>`,
    );
    expect(display(el).textContent).to.include('nothing here');
  });

  it('uses a custom formatter', async () => {
    const el = await fixture(
      html`<owc-click-editable-input
        value="https://example.com"
        .formatter=${value => html`<a href=${value}>${value}</a>`}
      ></owc-click-editable-input>`,
    );
    const link = display(el).querySelector('a');
    expect(link).to.exist;
    expect(link.getAttribute('href')).to.equal('https://example.com');
  });

  it('renders a Date value via wa-format-date', async () => {
    const el = await fixture(
      html`<owc-click-editable-input
        type="date"
        .value=${new Date(2024, 0, 15)}
      ></owc-click-editable-input>`,
    );
    expect(el.shadowRoot.querySelector('wa-format-date')).to.exist;
  });

  it('renders a copy button with show-copy-button', async () => {
    const el = await fixture(
      html`<owc-click-editable-input value="copy me" show-copy-button></owc-click-editable-input>`,
    );
    expect(el.shadowRoot.querySelector('wa-copy-button')).to.exist;
  });

  it('enters edit mode with Enter on the focused display', async () => {
    const el = await fixture(
      html`<owc-click-editable-input value="Hello"></owc-click-editable-input>`,
    );
    display(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await el.updateComplete;
    expect(el.editable).to.equal(true);
  });
});

describe('owc-click-editable-textarea', () => {
  it('edits and submits multi-line text', async () => {
    const el = await fixture(
      html`<owc-click-editable-textarea value="line one"></owc-click-editable-textarea>`,
    );
    await startEditing(el);
    expect(el.editable).to.equal(true);
    el.inputElement.value = 'line one\nline two';
    setTimeout(() => el.inputElement.dispatchEvent(new Event('blur')));
    await oneEvent(el, 'submit');
    expect(el.value).to.equal('line one\nline two');
  });
});

describe('owc-click-editable-autocomplete', () => {
  const data = [
    { label: 'Apple', value: '100' },
    { label: 'Banana', value: '101' },
    { label: 'Grape', value: 102 },
  ];

  it('displays the label of the selected value', async () => {
    const el = await fixture(
      html`<owc-click-editable-autocomplete
        value="100"
        .data=${data}
      ></owc-click-editable-autocomplete>`,
    );
    await aTimeout(10);
    expect(display(el).textContent).to.include('Apple');
  });

  it('matches numeric values loosely (string value, numeric option)', async () => {
    const el = await fixture(
      html`<owc-click-editable-autocomplete
        value="102"
        .data=${data}
      ></owc-click-editable-autocomplete>`,
    );
    await aTimeout(10);
    expect(display(el).textContent).to.include('Grape');
  });

  it('shows the fallback value when nothing is selected', async () => {
    const el = await fixture(
      html`<owc-click-editable-autocomplete
        .data=${data}
        fallbackValue="pick one"
      ></owc-click-editable-autocomplete>`,
    );
    await aTimeout(10);
    expect(display(el).textContent).to.include('pick one');
  });

  it('forwards clearable to the inner autocomplete as withClear (regression)', async () => {
    const el = await fixture(
      html`<owc-click-editable-autocomplete
        clearable
        value="100"
        .data=${data}
      ></owc-click-editable-autocomplete>`,
    );
    expect(el._autocomplete.withClear).to.equal(true);
  });

  it('submits when a single-select option is chosen', async () => {
    const el = await fixture(
      html`<owc-click-editable-autocomplete
        value="100"
        .data=${data}
      ></owc-click-editable-autocomplete>`,
    );
    await startEditing(el);
    expect(el.editable).to.equal(true);

    setTimeout(() => el._autocomplete.handleOptionAction('101'));
    await oneEvent(el, 'submit');
    expect(el.value).to.equal('101');
    expect(el.editable).to.equal(false);
  });
});
