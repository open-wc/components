import { fixture, html, expect, oneEvent, nextFrame, waitUntil } from '@open-wc/testing';
import { OwcAutocomplete } from './OwcAutocomplete.js';
import { OwcTable } from '@open-wc/components/OwcTable.js';

customElements.define('owc-autocomplete', OwcAutocomplete);
customElements.define('owc-table', OwcTable);

const data = [
  { label: 'VAV', value: '100' },
  { label: 'Standard Life', value: '101' },
  { label: 'UNIQA', value: '102' },
  { label: 'Zürich', value: '103' },
  { label: 'Helvetia', value: '104' },
];

/**
 * @param {number} count
 */
function options(count) {
  return Array.from({ length: count }, (_, index) => ({
    label: `Option ${index + 1}`,
    value: `value-${index + 1}`,
  }));
}

/** 50,000 options, created once for all tests. */
const manyOptions = options(50_000);

/**
 * Opens the dropdown and waits until it is positioned and its options settled.
 * @param {OwcAutocomplete} el
 */
async function open(el) {
  el.open = true;
  await el.updateComplete;
  await settle(el);
}

/**
 * Opens the dropdown from a task of its own, like a click does, and resolves
 * once the first frame that shows the option list is laid out, right before
 * it is painted, so nothing can have corrected the list in between.
 * @param {OwcAutocomplete} el
 * @returns {Promise<void>}
 */
function openUntilFirstFrame(el) {
  return new Promise(resolve => {
    setTimeout(() => {
      // reports sizes after the layout of a frame, before it is painted
      const observer = new ResizeObserver(() => {
        if (optionList(el).clientHeight > 0) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(optionList(el));
      el.open = true;
    });
  });
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

/**
 * The element that scrolls the options.
 * @param {OwcAutocomplete} el
 * @returns {HTMLElement}
 */
function optionList(el) {
  return el.shadowRoot.querySelector('#rows');
}

/**
 * Waits until the rendered options and the list's scroll position stay the
 * same for a few frames.
 * @param {OwcAutocomplete} el
 */
async function settle(el) {
  let previous = '';
  let stableFrames = 0;
  for (let frame = 0; frame < 60 && stableFrames < 3; frame++) {
    await nextFrame();
    await el.updateComplete;
    const current = `${optionList(el).scrollTop}:${renderedOptionLabels(el).join()}`;
    stableFrames = current === previous ? stableFrames + 1 : 0;
    previous = current;
  }
}

/**
 * Scrolls the option list and waits for the scroll to end.
 * @param {OwcAutocomplete} el
 * @param {number} top
 */
async function scrollList(el, top) {
  const list = optionList(el);
  const before = list.scrollTop;
  const ended = new Promise(resolve => list.addEventListener('scrollend', resolve, { once: true }));
  list.scrollTop = top;
  if (list.scrollTop !== before) {
    await ended;
  }
  await settle(el);
}

/**
 * Asserts that the rendered options cover the visible part of the option list.
 * @param {OwcAutocomplete} el
 */
function expectListCovered(el) {
  const list = optionList(el).getBoundingClientRect();
  const top = Math.max(list.top, 0);
  const bottom = Math.min(list.bottom, window.innerHeight);
  const rendered = [...el.shadowRoot.querySelectorAll('.option')].map(option =>
    option.getBoundingClientRect(),
  );
  expect(rendered, 'rendered options').to.not.be.empty;
  expect(rendered[0].top, 'top of the first rendered option').to.be.at.most(top + 0.5);
  expect(rendered.at(-1).bottom, 'bottom of the last rendered option').to.be.at.least(bottom - 0.5);
}

/**
 * Presses a key while the dropdown is open, and waits for the list to settle.
 * @param {OwcAutocomplete} el
 * @param {string} key
 */
async function press(el, key) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key }));
  await settle(el);
}

/**
 * Asserts that the option with the label is the highlighted one, and visible.
 * @param {OwcAutocomplete} el
 * @param {string} label
 */
function expectActiveOption(el, label) {
  const active = el.shadowRoot.querySelectorAll('.option--current');
  expect(active.length, 'highlighted options').to.equal(1);
  expect(active[0].querySelector('.option-label').textContent.trim()).to.equal(label);
  expectOptionVisible(el, label);
}

/**
 * Asserts that an option is rendered and fully visible in the option list.
 * @param {OwcAutocomplete} el
 * @param {string} label
 */
function expectOptionVisible(el, label) {
  const option = [...el.shadowRoot.querySelectorAll('.option')].find(
    node => node.querySelector('.option-label').textContent.trim() === label,
  );
  expect(option, `option "${label}"`).to.exist;
  const rect = option.getBoundingClientRect();
  const list = optionList(el).getBoundingClientRect();
  expect(rect.top, `top of "${label}"`).to.be.at.least(Math.max(list.top, 0) - 0.5);
  expect(rect.bottom, `bottom of "${label}"`).to.be.at.most(
    Math.min(list.bottom, window.innerHeight) + 0.5,
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

  it('sizes the option list to its options', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${data}></owc-autocomplete>`);
    await open(el);
    const list = optionList(el).getBoundingClientRect();
    const rendered = [...el.shadowRoot.querySelectorAll('.option')].map(option =>
      option.getBoundingClientRect(),
    );
    expect(rendered.length).to.equal(5);
    expect(list.top, 'top of the list').to.be.closeTo(rendered[0].top, 0.5);
    expect(list.bottom, 'bottom of the list').to.be.closeTo(rendered.at(-1).bottom, 0.5);
    // the dropdown ends right below the last option, at its 1px border
    const listbox = el.shadowRoot.querySelector('[part="listbox"]').getBoundingClientRect();
    expect(listbox.bottom - list.bottom, 'space below the list').to.be.at.most(2);
  });

  it('makes the dropdown wide enough for its widest label', async () => {
    const longLabel = 'A much longer option label than all the others';
    const wrapper = await fixture(html`
      <div style="width: 200px">
        <owc-autocomplete
          .data=${[...options(1000), { label: longLabel, value: 'long' }]}
        ></owc-autocomplete>
      </div>
    `);
    const el = /** @type {OwcAutocomplete} */ (wrapper.querySelector('owc-autocomplete'));
    await open(el);
    await press(el, 'End');
    const label = [...el.shadowRoot.querySelectorAll('.option-label')].find(
      node => node.textContent.trim() === longLabel,
    );
    expect(label, 'the long label').to.exist;
    expect(label.scrollWidth, 'width of the label text').to.be.at.most(label.clientWidth);
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
});

describe('owc-autocomplete virtualizer-mode', () => {
  it('auto renders every option below 300 options, and only the visible ones from 300 on', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${options(299)}></owc-autocomplete>`);
    await open(el);
    expect(renderedOptionLabels(el).length).to.equal(299);

    el.data = options(300);
    await settle(el);
    expect(renderedOptionLabels(el).length).to.be.below(100);
    expectListCovered(el);
  });

  it('always renders only the visible options, also below 300 options', async () => {
    const el = await fixture(
      html`<owc-autocomplete virtualizer-mode="always" .data=${options(299)}></owc-autocomplete>`,
    );
    await open(el);
    expect(renderedOptionLabels(el).length).to.be.below(100);
    expectListCovered(el);
  });

  it('never renders every option', async () => {
    const el = await fixture(
      html`<owc-autocomplete virtualizer-mode="never" .data=${options(1000)}></owc-autocomplete>`,
    );
    await open(el);
    expect(renderedOptionLabels(el).length).to.equal(1000);
  });

  it('leaves no stale sizing behind when a search crosses the threshold', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${options(1000)}></owc-autocomplete>`);
    await open(el);
    await scrollList(el, optionList(el).scrollHeight / 2);

    // "Option 99" and "Option 990" to "Option 999"
    await search(el, 'Option 99');
    await settle(el);
    const rendered = [...el.shadowRoot.querySelectorAll('.option')];
    expect(rendered.length).to.equal(11);
    const optionsHeight = rendered.reduce(
      (sum, option) => sum + option.getBoundingClientRect().height,
      0,
    );
    expect(optionList(el).scrollHeight, 'height of the list content').to.be.closeTo(
      optionsHeight,
      1,
    );

    await search(el, '');
    await settle(el);
    expect(renderedOptionLabels(el).length).to.be.below(100);
    expectListCovered(el);
    await scrollList(el, optionList(el).scrollHeight);
    expectOptionVisible(el, 'Option 1000');
  });
});

describe('owc-autocomplete with 50,000 options', () => {
  it('lists every option: scrolling the list to its end shows the last one', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${manyOptions}></owc-autocomplete>`);
    await open(el);
    expectListCovered(el);

    const list = optionList(el);
    await scrollList(el, list.scrollHeight);
    expectOptionVisible(el, 'Option 50000');
    expectListCovered(el);
  });

  it('reaches the first and the last option by keyboard, shows the active one, and selects it with Enter', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${manyOptions}></owc-autocomplete>`);
    await open(el);

    await press(el, 'End');
    expect(el.currentValue).to.equal('value-50000');
    expectActiveOption(el, 'Option 50000');

    await press(el, 'ArrowDown'); // wraps around to the first option
    expect(el.currentValue).to.equal('value-1');
    expectActiveOption(el, 'Option 1');

    await press(el, 'ArrowUp'); // wraps around to the last option
    expect(el.currentValue).to.equal('value-50000');
    expectActiveOption(el, 'Option 50000');

    await press(el, 'Home');
    expectActiveOption(el, 'Option 1');

    // scrolled away by hand, the next option comes back into view
    await scrollList(el, optionList(el).scrollHeight / 2);
    await press(el, 'ArrowDown');
    expectActiveOption(el, 'Option 2');

    await press(el, 'End');
    expectActiveOption(el, 'Option 50000');
    await press(el, 'ArrowUp');
    expectActiveOption(el, 'Option 49999');
    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })));
    await oneEvent(el, 'change');
    expect(el.value).to.equal('value-49999');
  });

  it('shows an active option that was scrolled out of view on Enter instead of selecting it, and selects it on the next Enter', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${manyOptions}></owc-autocomplete>`);
    await open(el);
    let changes = 0;
    el.addEventListener('change', () => changes++);

    // still rendered, just above the visible part of the list
    await press(el, 'Home');
    await scrollList(el, 150);
    await press(el, 'Enter');
    expectActiveOption(el, 'Option 1');
    expect(changes, 'changes after Enter on a hidden option').to.equal(0);
    expect(el.open, 'open').to.equal(true);

    // far away, so not even rendered
    await press(el, 'End');
    await scrollList(el, 0);
    await press(el, 'Enter');
    expectActiveOption(el, 'Option 50000');
    expect(changes, 'changes after Enter on an option that is not rendered').to.equal(0);
    expect(el.value).to.equal(undefined);

    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })));
    await oneEvent(el, 'change');
    expect(el.value).to.equal('value-50000');
  });

  it('shows the active option in the first frame after reopening', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${manyOptions}></owc-autocomplete>`);
    await open(el);
    await press(el, 'End');
    await press(el, 'ArrowUp');
    el.open = false;
    await el.updateComplete;

    await openUntilFirstFrame(el);
    expectActiveOption(el, 'Option 49999');
    expectListCovered(el);
  });

  it('shows the start of the list in the first frame after reopening it scrolled down', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${manyOptions}></owc-autocomplete>`);
    await open(el);
    await scrollList(el, optionList(el).scrollHeight / 2);
    el.open = false;
    await el.updateComplete;

    await openUntilFirstFrame(el);
    expectOptionVisible(el, 'Option 1');
    expectListCovered(el);
  });

  it('reopens with the search still applied, showing the active option without scrolling the page', async () => {
    const wrapper = await fixture(html`
      <div>
        <owc-autocomplete .data=${manyOptions}></owc-autocomplete>
        <div style="height: 5000px"></div>
      </div>
    `);
    const el = /** @type {OwcAutocomplete} */ (wrapper.querySelector('owc-autocomplete'));
    await open(el);
    await search(el, 'Option 1');
    el.currentValue = 'value-19999';
    await settle(el);
    expectActiveOption(el, 'Option 19999');
    el.open = false;
    await el.updateComplete;

    await openUntilFirstFrame(el);
    expectActiveOption(el, 'Option 19999');
    expect(document.scrollingElement.scrollTop, 'page scroll position').to.equal(0);
  });

  it('shows an option chosen by keyboard right after opening, without scrolling the page', async () => {
    const wrapper = await fixture(html`
      <div>
        <owc-autocomplete .data=${manyOptions}></owc-autocomplete>
        <div style="height: 5000px"></div>
      </div>
    `);
    const el = /** @type {OwcAutocomplete} */ (wrapper.querySelector('owc-autocomplete'));
    await new Promise(resolve => setTimeout(resolve));
    el.open = true;
    await el.updateComplete;
    // before the dropdown has positioned and sized itself
    await press(el, 'End');
    expectActiveOption(el, 'Option 50000');
    expect(document.scrollingElement.scrollTop, 'page scroll position').to.equal(0);
  });

  it('shows the first match after a search, or the active option if it matches', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${manyOptions}></owc-autocomplete>`);
    await open(el);
    await scrollList(el, optionList(el).scrollHeight / 2);

    // 11,111 matches: "Option 1", "Option 10" to "Option 19", ..., "Option 10000" to "Option 19999"
    await search(el, 'Option 1');
    await settle(el);
    expectOptionVisible(el, 'Option 1');
    expectListCovered(el);

    el.currentValue = 'value-12345';
    await settle(el);
    expectActiveOption(el, 'Option 12345');
    await search(el, 'Option 12');
    await settle(el);
    expectActiveOption(el, 'Option 12345');
    expectListCovered(el);
  });

  it('works in a table cell of a virtualized table', async () => {
    const columns = [
      { label: 'Name', field: 'name' },
      {
        label: 'Choice',
        field: 'choice',
        type: 'editable',
        editableOptions: { type: 'autocomplete', data: options(1000) },
      },
    ];
    const rows = Array.from({ length: 500 }, (_, index) => ({
      id: String(index),
      name: `Row ${index + 1}`,
      choice: 'value-1',
    }));
    const table = await fixture(html`<owc-table .columns=${columns} .data=${rows}></owc-table>`);
    await table.updateComplete;
    const cell = table.shadowRoot.querySelector('owc-click-editable-autocomplete');
    cell.shadowRoot.querySelector('.display').dispatchEvent(new Event('dblclick'));
    const el = /** @type {OwcAutocomplete} */ (cell.shadowRoot.querySelector('owc-autocomplete'));
    await waitUntil(() => el.open, 'the cell opens its dropdown');
    await settle(el);
    expectListCovered(el);

    await scrollList(el, optionList(el).scrollHeight / 2);
    expectListCovered(el);
    const pageScroll = document.scrollingElement.scrollTop;
    await press(el, 'End');
    expectActiveOption(el, 'Option 1000');
    await press(el, 'Home');
    expectActiveOption(el, 'Option 1');
    expect(document.scrollingElement.scrollTop, 'page scroll position').to.equal(pageScroll);
  });

  it('fits the dropdown into the available height, and the option list scrolls', async () => {
    const el = await fixture(html`<owc-autocomplete .data=${manyOptions}></owc-autocomplete>`);
    await open(el);
    const listbox = el.shadowRoot.querySelector('[part="listbox"]').getBoundingClientRect();
    const available = parseFloat(
      getComputedStyle(el.popup).getPropertyValue('--auto-size-available-height'),
    );
    expect(listbox.height, 'height of the dropdown').to.be.at.most(available);
    expect(listbox.bottom, 'bottom of the dropdown').to.be.at.most(window.innerHeight);
    const list = optionList(el);
    expect(list.scrollHeight, 'scrollable height').to.be.greaterThan(list.clientHeight * 100);
  });
});
