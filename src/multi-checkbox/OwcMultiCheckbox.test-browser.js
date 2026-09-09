import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { OwcMultiCheckbox } from './OwcMultiCheckbox.js';

customElements.define('owc-multi-checkbox', OwcMultiCheckbox);

const flatOptions = [
  { value: 300, label: 'Passiv' },
  { value: 400, label: 'Archive', color: 'danger' },
];

const groupedOptions = [
  [
    { value: 200, label: 'Aktiv' },
    { value: 210, label: 'Premium' },
  ],
  { value: 300, label: 'Passiv' },
];

/**
 * @param {OwcMultiCheckbox} el
 */
function checkboxes(el) {
  return [...el.shadowRoot.querySelectorAll('.checkbox')];
}

/**
 * Toggles an option checkbox like a user click would.
 * @param {OwcMultiCheckbox} el
 * @param {number} index
 */
function toggle(el, index) {
  const checkbox = checkboxes(el)[index];
  checkbox.checked = !checkbox.checked;
  checkbox.dispatchEvent(new Event('input'));
}

describe('owc-multi-checkbox', () => {
  it('renders a tag with a checkbox per option', async () => {
    const el = await fixture(
      html`<owc-multi-checkbox .options=${flatOptions}></owc-multi-checkbox>`,
    );
    const labels = checkboxes(el).map(checkbox => checkbox.textContent.trim());
    expect(labels).to.deep.equal(['Passiv', 'Archive']);
    expect(el.shadowRoot.querySelectorAll('wa-tag').length).to.equal(2);
  });

  it('falls back to the value as label and forwards the color to the tag', async () => {
    const el = await fixture(
      html`<owc-multi-checkbox .options=${[{ value: 'raw' }]}></owc-multi-checkbox>`,
    );
    expect(checkboxes(el)[0].textContent.trim()).to.equal('raw');

    const colored = await fixture(
      html`<owc-multi-checkbox .options=${flatOptions}></owc-multi-checkbox>`,
    );
    const tags = [...colored.shadowRoot.querySelectorAll('wa-tag')];
    expect(tags[0].variant).to.equal('brand');
    expect(tags[1].variant).to.equal('danger');
  });

  it('checks the boxes for preselected values', async () => {
    const el = await fixture(
      html`<owc-multi-checkbox
        .options=${flatOptions}
        .value=${{ value: [400], operator: 'equal', field: 'state' }}
      ></owc-multi-checkbox>`,
    );
    expect(checkboxes(el).map(checkbox => checkbox.checked)).to.deep.equal([false, true]);
  });

  it('updates the value and fires change when a checkbox is toggled', async () => {
    const el = await fixture(
      html`<owc-multi-checkbox .options=${flatOptions}></owc-multi-checkbox>`,
    );
    setTimeout(() => toggle(el, 0));
    await oneEvent(el, 'change');
    expect(el.value.value).to.deep.equal([300]);
    expect(el.value.operator).to.equal('equal');

    setTimeout(() => toggle(el, 1));
    await oneEvent(el, 'change');
    expect(el.value.value).to.deep.equal([300, 400]);

    setTimeout(() => toggle(el, 0));
    await oneEvent(el, 'change');
    expect(el.value.value).to.deep.equal([400]);
  });

  it('keeps falsy values selectable (regression)', async () => {
    const options = [
      { value: 0, label: 'Zero' },
      { value: false, label: 'No' },
      { value: 1, label: 'One' },
    ];
    const el = await fixture(html`<owc-multi-checkbox .options=${options}></owc-multi-checkbox>`);
    setTimeout(() => toggle(el, 0));
    await oneEvent(el, 'change');
    setTimeout(() => toggle(el, 1));
    await oneEvent(el, 'change');
    expect(el.value.value).to.deep.equal([0, false]);
  });

  it('renders a group checkbox for grouped options', async () => {
    const el = await fixture(
      html`<owc-multi-checkbox .options=${groupedOptions}></owc-multi-checkbox>`,
    );
    expect(el.shadowRoot.querySelectorAll('.group-checkbox').length).to.equal(1);
    expect(checkboxes(el).length).to.equal(3);
  });

  it('shows the group checkbox as indeterminate/checked depending on the selection', async () => {
    const el = await fixture(
      html`<owc-multi-checkbox
        .options=${groupedOptions}
        .value=${{ value: [200], operator: 'equal', field: '' }}
      ></owc-multi-checkbox>`,
    );
    expect(el.shadowRoot.querySelector('.group-checkbox').indeterminate).to.equal(true);

    el.value = { value: [200, 210], operator: 'equal', field: '' };
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.group-checkbox').checked).to.equal(true);
  });

  it('selects and deselects the whole group via the group checkbox', async () => {
    const el = await fixture(
      html`<owc-multi-checkbox .options=${groupedOptions}></owc-multi-checkbox>`,
    );
    const groupCheckbox = el.shadowRoot.querySelector('.group-checkbox');
    setTimeout(() => groupCheckbox.dispatchEvent(new Event('input')));
    await oneEvent(el, 'change');
    expect(el.value.value).to.deep.equal([200, 210]);

    setTimeout(() => groupCheckbox.dispatchEvent(new Event('input')));
    await oneEvent(el, 'change');
    expect(el.value.value).to.deep.equal([]);
  });

  it('does not mutate the value object passed in by the consumer (regression)', async () => {
    const consumerValue = { value: [300], operator: 'equal', field: 'state' };
    const el = await fixture(
      html`<owc-multi-checkbox
        .options=${groupedOptions}
        .value=${consumerValue}
      ></owc-multi-checkbox>`,
    );
    setTimeout(() =>
      el.shadowRoot.querySelector('.group-checkbox').dispatchEvent(new Event('input')),
    );
    await oneEvent(el, 'change');

    expect(consumerValue.value).to.deep.equal([300]);
    expect(el.value).to.not.equal(consumerValue);
    // the submitted value follows the options order
    expect(el.value.value).to.deep.equal([200, 210, 300]);
    expect(el.value.field).to.equal('state');
  });

  it('renders nothing but the form for empty options', async () => {
    const el = await fixture(html`<owc-multi-checkbox></owc-multi-checkbox>`);
    expect(checkboxes(el).length).to.equal(0);
    expect(el.shadowRoot.querySelector('form')).to.exist;
  });
});
