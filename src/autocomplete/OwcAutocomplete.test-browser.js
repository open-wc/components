import { fixture, html, expect, oneEvent, aTimeout } from '@open-wc/testing';
import { OwcAutocomplete } from './OwcAutocomplete.js';

customElements.define('owc-autocomplete', OwcAutocomplete);

class AutocompleteShadowHost extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.autocomplete = document.createElement('owc-autocomplete');
    this.shadowRoot.append(this.autocomplete);
  }
}

class NestedAutocompleteHost extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.innerHost = document.createElement('autocomplete-shadow-host');
    this.autocomplete = this.innerHost.autocomplete;
    this.shadowRoot.append(this.innerHost);
  }
}

customElements.define('autocomplete-shadow-host', AutocompleteShadowHost);
customElements.define('nested-autocomplete-host', NestedAutocompleteHost);

const data = [
  { label: 'VAV', value: '100' },
  { label: 'Standard Life', value: '101' },
  { label: 'UNIQA', value: '102' },
  { label: 'Zürich', value: '103' },
  { label: 'Helvetia', value: '104' },
];

/**
 * Opens the dropdown and waits for the virtualized option list to render.
 * @param {OwcAutocomplete} el
 */
async function open(el) {
  el.open = true;
  await el.updateComplete;
  // wait for the virtualizer to render and the 100ms search focus timer
  await aTimeout(200);
}

/**
 * @param {OwcAutocomplete} el
 * @param {string} text
 */
async function search(el, text) {
  el.search.value = text;
  el.search.dispatchEvent(new Event('input'));
  await el.updateComplete;
}

/**
 * @param {OwcAutocomplete} el
 */
function renderedOptionLabels(el) {
  return [...el.shadowRoot.querySelectorAll('.option .option-label')].map(node =>
    node.textContent.trim(),
  );
}

describe('owc-autocomplete', () => {
  it('renders label, placeholder and hint', async () => {
    const el = await fixture(
      html`<owc-autocomplete
        label="Insurer"
        placeholder="Choose one..."
        hint="Required for contracts"
        .data=${data}
      ></owc-autocomplete>`,
    );
    expect(el.shadowRoot.querySelector('label').textContent).to.include('Insurer');
    expect(el.shadowRoot.querySelector('#placeholder').textContent).to.equal('Choose one...');
    expect(el.shadowRoot.querySelector('#hint').textContent).to.include('Required for contracts');
  });

  it('opens via show() and fires wa-show', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    setTimeout(() => el.show());
    await oneEvent(el, 'wa-show');
    expect(el.open).to.equal(true);
  });

  it('show() keeps an already open dropdown open', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    await el.show();
    await el.show();
    expect(el.open).to.equal(true);
  });

  it('closes via hide() and fires wa-hide', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    await el.show();
    setTimeout(() => el.hide());
    await oneEvent(el, 'wa-hide');
    expect(el.open).to.equal(false);
  });

  it('does not open when disabled', async () => {
    const el = await fixture(html`<owc-autocomplete disabled .data=${data}></owc-autocomplete>`);
    await el.show();
    expect(el.open).to.equal(false);
  });

  it('renders the options in the dropdown', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    await open(el);
    expect(renderedOptionLabels(el)).to.deep.equal([
      'VAV',
      'Standard Life',
      'UNIQA',
      'Zürich',
      'Helvetia',
    ]);
  });

  it('filters options when typing in the search input', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    await open(el);
    await search(el, 'uni');
    expect(el.processedData).to.deep.equal([{ label: 'UNIQA', value: '102' }]);
    await search(el, '');
    expect(el.processedData.length).to.equal(data.length);
  });

  it('selects an option on click, fires change and closes (single select)', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    await open(el);
    const option = el.shadowRoot.querySelector('.option');
    setTimeout(() => option.click());
    await oneEvent(el, 'change');
    expect(el.value).to.equal('100');
    expect(el.valueLabel).to.equal('VAV');
    expect(el.open).to.equal(false);
  });

  it('fires autocomplete-selection with the selected option as detail', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    setTimeout(() => el.handleOptionAction('102'));
    const event = await oneEvent(el, 'autocomplete-selection');
    expect(event.detail).to.deep.equal({ label: 'UNIQA', value: '102' });
  });

  it('collects multiple selections into a value array', async () => {
    const el = await fixture(html`<owc-autocomplete multiple .data=${data}></owc-autocomplete>`);
    el.handleOptionAction('100');
    el.handleOptionAction('102');
    await el.updateComplete;
    expect(el.value).to.deep.equal(['100', '102']);

    // selecting an already selected option deselects it
    el.handleOptionAction('100');
    await el.updateComplete;
    expect(el.value).to.deep.equal(['102']);
  });

  it('parses the value attribute as a space separated list', async () => {
    const el = await fixture(
      html`<owc-autocomplete multiple value="102 103" .data=${data}></owc-autocomplete>`,
    );
    expect(el.value).to.deep.equal(['102', '103']);
  });

  it('renders tags for selected options when multiple', async () => {
    const el = await fixture(
      html`<owc-autocomplete multiple value="100 102" .data=${data}></owc-autocomplete>`,
    );
    await el.updateComplete;
    const tags = [...el.shadowRoot.querySelectorAll('wa-tag')];
    expect(tags.map(tag => tag.textContent.trim())).to.deep.equal(['VAV', 'UNIQA']);
  });

  it('keeps rendering tags for selections that are filtered out of the dropdown', async () => {
    const el = await fixture(
      html`<owc-autocomplete multiple value="100 102" .data=${data}></owc-autocomplete>`,
    );
    await open(el);
    await search(el, 'uni');
    const tags = [...el.shadowRoot.querySelectorAll('wa-tag')];
    expect(tags.map(tag => tag.textContent.trim())).to.deep.equal(['VAV', 'UNIQA']);
  });

  it('collapses overflowing tags into a +N tag (max-options-visible)', async () => {
    const el = await fixture(
      html`<owc-autocomplete
        multiple
        max-options-visible="2"
        value="100 101 102 103"
        .data=${data}
      ></owc-autocomplete>`,
    );
    await el.updateComplete;
    const tags = [...el.shadowRoot.querySelectorAll('wa-tag')];
    expect(tags.map(tag => tag.textContent.trim())).to.deep.equal(['VAV', 'Standard Life', '+2']);
  });

  it('removes a selection when its tag fires wa-remove', async () => {
    const el = await fixture(
      html`<owc-autocomplete multiple value="100 102" .data=${data}></owc-autocomplete>`,
    );
    await el.updateComplete;
    const tag = el.shadowRoot.querySelector('wa-tag');
    setTimeout(() => tag.dispatchEvent(new Event('wa-remove')));
    await oneEvent(el, 'change');
    expect(el.value).to.deep.equal(['102']);
  });

  it('ignores wa-remove for values that are not selected', async () => {
    const el = await fixture(
      html`<owc-autocomplete multiple value="100" .data=${data}></owc-autocomplete>`,
    );
    el.handleTagRemove({ stopPropagation() {}, target: { tagId: 'not-selected' } });
    await el.updateComplete;
    expect(el.value).to.deep.equal(['100']);
  });

  it('selects and deselects all options via the select-all button', async () => {
    const el = await fixture(html`<owc-autocomplete multiple .data=${data}></owc-autocomplete>`);
    await open(el);
    const button = el.shadowRoot.querySelector('#select-all-button');
    setTimeout(() => button.click());
    await oneEvent(el, 'change');
    expect(el.value).to.deep.equal(['100', '101', '102', '103', '104']);

    setTimeout(() => button.click());
    await oneEvent(el, 'change');
    expect(el.value).to.deep.equal([]);
  });

  it('clears the selection via the clear button (with-clear)', async () => {
    const el = await fixture(
      html`<owc-autocomplete with-clear value="102" .data=${data}></owc-autocomplete>`,
    );
    await el.updateComplete;
    const clearButton = el.shadowRoot.querySelector('[part~="clear-button"]');
    expect(clearButton).to.exist;
    setTimeout(() => clearButton.click());
    await oneEvent(el, 'change');
    expect(el.value).to.equal(undefined);
  });

  it('navigates options with ArrowDown/ArrowUp and selects with Enter', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    await open(el);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(el.currentValue).to.equal('100');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(el.currentValue).to.equal('101');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(el.currentValue).to.equal('100');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    expect(el.currentValue).to.equal('104');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(el.currentValue).to.equal('100');

    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })));
    await oneEvent(el, 'change');
    expect(el.value).to.equal('100');
  });

  it('Enter selects the only remaining filtered option', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    await open(el);
    await search(el, 'helv');
    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })));
    await oneEvent(el, 'change');
    expect(el.value).to.equal('104');
  });

  it('keyboard navigation on an empty result list does not throw', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    await open(el);
    await search(el, 'no-such-option');
    expect(el.processedData).to.deep.equal([]);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(el.value).to.equal(undefined);
  });

  it('closes on Escape', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    await open(el);
    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    await oneEvent(el, 'wa-hide');
    expect(el.open).to.equal(false);
  });

  it('selects pasted values and labels in fill mode', async () => {
    const el = await fixture(html`<owc-autocomplete multiple .data=${data}></owc-autocomplete>`);
    await open(el);
    el.fillMode = true;
    await el.updateComplete;
    await search(el, '100 Helvetia 102');
    expect(el.value).to.deep.equal(['100', '104', '102']);
  });

  it('keeps the hidden validation input empty when nothing is selected', async () => {
    const el = await fixture(html`<owc-autocomplete required .data=${data}></owc-autocomplete>`);
    expect(el.valueInput.value).to.equal('');
    expect(el.valueInput.required).to.equal(true);

    el.value = '102';
    await el.updateComplete;
    expect(el.valueInput.value).to.equal('102');
  });

  it('limits the rendered options to maxDropdownOptionsVisible', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    el.maxDropdownOptionsVisible = 2;
    await open(el);
    expect(renderedOptionLabels(el)).to.deep.equal(['VAV', 'Standard Life']);
  });

  it('keeps keyboard navigation visible across a virtualized range', async () => {
    const largeData = Array.from({ length: 300 }, (_, index) => ({
      label: `Option ${index}`,
      value: `${index}`,
    }));
    const el = await fixture(html`<owc-autocomplete .data=${largeData}></owc-autocomplete>`);
    await open(el);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    await el.updateComplete;

    expect(el.currentValue).to.equal('199');
    expect(el.rows.scrollTop).to.be.greaterThan(0);
    expect(renderedOptionLabels(el)).to.include('Option 199');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    await el.updateComplete;

    expect(el.currentValue).to.equal('0');
    expect(renderedOptionLabels(el)).to.include('Option 0');
  });

  it('keeps keyboard navigation and selection inside the limited option range', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    el.maxDropdownOptionsVisible = 2;
    await open(el);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    expect(el.currentValue).to.equal('101');

    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })));
    await oneEvent(el, 'change');
    expect(el.value).to.equal('101');
  });

  it('remains usable through popup lifecycle changes inside a nested shadow root', async () => {
    const host = await fixture(html`<nested-autocomplete-host></nested-autocomplete-host>`);
    const el = host.autocomplete;
    const largeData = Array.from({ length: 250 }, (_, index) => ({
      label: `Option ${index}`,
      value: `${index}`,
    }));
    el.data = largeData;
    await el.updateComplete;

    await open(el);
    expect(renderedOptionLabels(el)).to.not.be.empty;

    await el.hide();
    await el.show();
    await aTimeout(200);
    window.dispatchEvent(new Event('resize'));
    await search(el, 'Option 24');
    expect(renderedOptionLabels(el)).to.deep.equal(['Option 24']);
    await search(el, '');
    expect(renderedOptionLabels(el)).to.not.be.empty;

    const parent = host.parentNode;
    host.remove();
    parent.append(host);
    await el.updateComplete;
    await el.hide();
    await el.show();
    await aTimeout(200);

    expect(el.open).to.equal(true);
    expect(renderedOptionLabels(el)).to.not.be.empty;
  });

  it('measures variable-height options and reaches both limited range bounds', async () => {
    const largeData = Array.from({ length: 240 }, (_, index) => ({
      label: `Option ${index}: ${'variable content '.repeat((index % 5) + 1)}`,
      value: `${index}`,
    }));
    const el = await fixture(html`<owc-autocomplete .data=${largeData}></owc-autocomplete>`);
    await open(el);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    await aTimeout(50);
    expect(el.currentValue).to.equal('199');
    expect(renderedOptionLabels(el)).to.include(largeData[199].label);
    const optionBounds = [...el.shadowRoot.querySelectorAll('.option')]
      .map(option => option.getBoundingClientRect())
      .sort((first, second) => first.top - second.top);
    for (let index = 1; index < optionBounds.length; index += 1) {
      expect(optionBounds[index - 1].bottom).to.be.at.most(optionBounds[index].top + 1);
    }

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    await aTimeout(50);
    expect(el.currentValue).to.equal('0');
    expect(renderedOptionLabels(el)).to.include(largeData[0].label);
  });
});
