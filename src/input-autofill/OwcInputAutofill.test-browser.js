import { fixture, html, expect, oneEvent, aTimeout } from '@open-wc/testing';
import { OwcInputAutofill } from './OwcInputAutofill.js';

customElements.define('owc-input-autofill', OwcInputAutofill);

const data = [
  { label: 'VAV', value: '100' },
  { label: 'Standard Life', value: '101' },
  { label: '', value: '102' },
];

/**
 * @param {OwcInputAutofill} el
 */
function waInput(el) {
  return el.shadowRoot.querySelector('wa-input');
}

/**
 * @param {OwcInputAutofill} el
 */
function autocomplete(el) {
  return el.shadowRoot.querySelector('owc-autocomplete');
}

/**
 * Types into the text input like a user would.
 * @param {OwcInputAutofill} el
 * @param {string} text
 */
function type(el, text) {
  const input = waInput(el);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

describe('owc-input-autofill', () => {
  it('renders a text input and an options dropdown, forwarding label and placeholder', async () => {
    const el = await fixture(
      html`<owc-input-autofill
        label="Company"
        placeholder="type or pick"
        .data=${data}
      ></owc-input-autofill>`,
    );
    expect(waInput(el)).to.exist;
    expect(autocomplete(el)).to.exist;
    expect(waInput(el).label).to.equal('Company');
    expect(waInput(el).placeholder).to.equal('type or pick');
  });

  it('keeps typed free text in the value and relays the input event', async () => {
    const el = await fixture(html`<owc-input-autofill .data=${data}></owc-input-autofill>`);
    setTimeout(() => type(el, 'free text'));
    await oneEvent(el, 'input');
    expect(el.value).to.equal('free text');
  });

  it('applies a picked option to the input and fires a composed change event', async () => {
    const el = await fixture(html`<owc-input-autofill .data=${data}></owc-input-autofill>`);
    const dropdown = autocomplete(el);
    await dropdown.updateComplete;

    setTimeout(() => dropdown.handleOptionAction('101'));
    const changeEvent = await oneEvent(el, 'change');

    expect(el.value).to.equal('101');
    expect(waInput(el).value).to.equal('101');
    expect(changeEvent.bubbles).to.equal(true);
    expect(changeEvent.composed).to.equal(true);
  });

  it('keeps options with an empty label selectable (regression)', async () => {
    const el = await fixture(html`<owc-input-autofill .data=${data}></owc-input-autofill>`);
    const dropdown = autocomplete(el);
    await dropdown.updateComplete;

    setTimeout(() => dropdown.handleOptionAction('102'));
    await oneEvent(el, 'change');
    expect(el.value).to.equal('102');
  });

  it('ignores selection payloads without a usable value', async () => {
    const el = await fixture(
      html`<owc-input-autofill .data=${data} value="before"></owc-input-autofill>`,
    );
    let changeCount = 0;
    el.addEventListener('change', () => {
      changeCount += 1;
    });

    autocomplete(el).dispatchEvent(
      new CustomEvent('autocomplete-selection', {
        detail: { label: 'no value here' },
        bubbles: true,
        composed: true,
      }),
    );
    await aTimeout(0);

    expect(el.value).to.equal('before');
    expect(changeCount).to.equal(0);
  });

  it('mirrors a matching value into the dropdown and clears it for free text', async () => {
    const el = await fixture(html`<owc-input-autofill .data=${data}></owc-input-autofill>`);

    el.value = '101';
    await el.updateComplete;
    expect(autocomplete(el).value).to.equal('101');

    el.value = 'Standard';
    await el.updateComplete;
    expect(autocomplete(el).value).to.equal('');

    setTimeout(() => type(el, '100'));
    await oneEvent(el, 'input');
    await el.updateComplete;
    expect(autocomplete(el).value).to.equal('100');
  });

  it('does not leak input events from the dropdown search field', async () => {
    const el = await fixture(html`<owc-input-autofill .data=${data}></owc-input-autofill>`);
    const dropdown = autocomplete(el);
    await dropdown.updateComplete;

    let inputCount = 0;
    el.addEventListener('input', () => {
      inputCount += 1;
    });

    // A composed input event from the dropdown's internal search field
    // retargets to the dropdown element on its way out.
    dropdown.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await aTimeout(0);

    expect(inputCount).to.equal(0);
    expect(el.value).to.equal('');
  });

  it('focuses the text input via focus()', async () => {
    const el = await fixture(html`<owc-input-autofill .data=${data}></owc-input-autofill>`);
    el.focus();
    expect(el.shadowRoot.activeElement).to.equal(waInput(el));
  });
});
