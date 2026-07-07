import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import { JsonForm } from './JsonForm.js';

if (!customElements.get('json-form')) {
  customElements.define('json-form', JsonForm);
}

/**
 * Walks a chain of shadow roots, awaiting each element's render before descending.
 * @param {Element} root
 * @param {...string} selectors
 * @returns {Promise<Element | null>}
 */
async function shadowQuery(root, ...selectors) {
  let current = root;
  for (const selector of selectors) {
    await current.updateComplete;
    current = current.shadowRoot?.querySelector(selector);
    if (!current) {
      return null;
    }
  }
  await current.updateComplete;
  return current;
}

const personSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
};

describe('json-form controls', () => {
  it('renders a text input for a string control', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/name' }}
      ></json-form>
    `);
    const input = el.shadowRoot.querySelector('wa-input');
    expect(input).to.exist;
    expect(input.type).to.equal('text');
    expect(input.label).to.equal('Name');
  });

  it('marks required controls with a star and uses the schema title as label', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${{
          type: 'object',
          properties: { name: { type: 'string', title: 'Full Name' } },
          required: ['name'],
        }}
        .uiSchema=${{ type: 'Control', scope: '#/properties/name' }}
      ></json-form>
    `);
    const input = el.shadowRoot.querySelector('wa-input');
    expect(input.label).to.equal('Full Name:*');
  });

  it('renders a textarea for the multi option', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/name', options: { multi: true } }}
      ></json-form>
    `);
    expect(el.shadowRoot.querySelector('wa-textarea')).to.exist;
  });

  it('renders a number input for number controls', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/age' }}
      ></json-form>
    `);
    const input = el.shadowRoot.querySelector('wa-input');
    expect(input.type).to.equal('number');
  });

  it('renders a checkbox for booleans and a switch with the toggle option', async () => {
    const schema = { type: 'object', properties: { accepted: { type: 'boolean' } } };
    const checkbox = await fixture(html`
      <json-form
        .schema=${schema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/accepted' }}
      ></json-form>
    `);
    expect(checkbox.shadowRoot.querySelector('wa-checkbox')).to.exist;

    const toggle = await fixture(html`
      <json-form
        .schema=${schema}
        .uiSchema=${{
          type: 'Control',
          scope: '#/properties/accepted',
          options: { toggle: true },
        }}
      ></json-form>
    `);
    expect(toggle.shadowRoot.querySelector('wa-switch')).to.exist;
  });

  it('renders a radio group for enums with format radio, prefilled from the value', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${{
          type: 'object',
          properties: { fruit: { type: 'string', enum: ['apple', 'orange'] } },
        }}
        .uiSchema=${{
          type: 'Control',
          scope: '#/properties/fruit',
          options: { format: 'radio' },
        }}
        .value=${{ fruit: 'orange' }}
      ></json-form>
    `);
    const group = el.shadowRoot.querySelector('wa-radio-group');
    expect(group).to.exist;
    expect(group.value).to.equal('orange');
    expect(group.querySelectorAll('wa-radio').length).to.equal(2);
  });

  it('renders an autocomplete for enums without a format', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${{
          type: 'object',
          properties: { fruit: { type: 'string', enum: ['apple', 'orange'] } },
        }}
        .uiSchema=${{ type: 'Control', scope: '#/properties/fruit' }}
      ></json-form>
    `);
    const autocomplete = el.shadowRoot.querySelector('owc-autocomplete');
    expect(autocomplete).to.exist;
    expect(autocomplete.data).to.deep.equal([
      { value: 'apple', label: 'apple', accentBarColor: undefined },
      { value: 'orange', label: 'orange', accentBarColor: undefined },
    ]);
  });

  it('renders a multiselect autocomplete for arrays of enums', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${{
          type: 'object',
          properties: {
            fruits: { type: 'array', items: { type: 'string', enum: ['apple', 'orange'] } },
          },
        }}
        .uiSchema=${{ type: 'Control', scope: '#/properties/fruits' }}
      ></json-form>
    `);
    const autocomplete = el.shadowRoot.querySelector('owc-autocomplete');
    expect(autocomplete).to.exist;
    expect(autocomplete.hasAttribute('multiple')).to.be.true;
  });

  it('disables controls when readonly is set on the form', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/name' }}
        readonly
      ></json-form>
    `);
    const input = el.shadowRoot.querySelector('wa-input');
    expect(input.disabled).to.be.true;
  });

  it('supports custom renderers via an option key', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/name', options: { plain: true } }}
        .renderers=${{ plain: () => html`<input id="custom" />` }}
      ></json-form>
    `);
    expect(el.shadowRoot.querySelector('#custom')).to.exist;
  });
});

describe('json-form data flow', () => {
  it('updates its value and fires formDataChange when the user types', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/name' }}
      ></json-form>
    `);
    const input = el.shadowRoot.querySelector('wa-input');
    input.value = 'James';
    setTimeout(() => input.dispatchEvent(new Event('input', { bubbles: true, composed: true })));
    const event = await oneEvent(el, 'formDataChange');
    expect(event.path).to.equal('#/properties/name');
    expect(event.value).to.equal('James');
    expect(el.value).to.deep.equal({ name: 'James' });
  });

  it('parses number inputs into numbers', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/age' }}
      ></json-form>
    `);
    const input = el.shadowRoot.querySelector('wa-input');
    input.value = '5.5';
    setTimeout(() => input.dispatchEvent(new Event('change', { bubbles: true, composed: true })));
    await oneEvent(el, 'formDataChange');
    expect(el.value).to.deep.equal({ age: 5.5 });
  });

  it('appends seconds to time values', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${{
          type: 'object',
          properties: { start: { type: 'string', format: 'time' } },
        }}
        .uiSchema=${{ type: 'Control', scope: '#/properties/start' }}
      ></json-form>
    `);
    const input = el.shadowRoot.querySelector('wa-input');
    input.value = '12:30';
    setTimeout(() => input.dispatchEvent(new Event('change', { bubbles: true, composed: true })));
    await oneEvent(el, 'formDataChange');
    expect(el.value).to.deep.equal({ start: '12:30:00' });
  });

  it('creates missing parent objects for nested scopes', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${{
          type: 'object',
          properties: {
            address: { type: 'object', properties: { city: { type: 'string' } } },
          },
        }}
        .uiSchema=${{ type: 'Control', scope: '#/properties/address/properties/city' }}
      ></json-form>
    `);
    const input = el.shadowRoot.querySelector('wa-input');
    input.value = 'Vienna';
    setTimeout(() => input.dispatchEvent(new Event('input', { bubbles: true, composed: true })));
    await oneEvent(el, 'formDataChange');
    expect(el.value).to.deep.equal({ address: { city: 'Vienna' } });
  });
});

describe('json-form validation', () => {
  const requiredSchema = {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  };

  it('exposes the validator state for missing required fields', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${requiredSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/name' }}
      ></json-form>
    `);
    expect(el.validatorState.valid).to.be.false;
  });

  it('hides errors until the user interacts, unless forceErrors is set', async () => {
    const untouched = await fixture(html`
      <json-form
        .schema=${requiredSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/name' }}
      ></json-form>
    `);
    expect(untouched.shadowRoot.querySelector('.invalid')).to.not.exist;

    const forced = await fixture(html`
      <json-form
        .schema=${requiredSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/name' }}
        forceErrors
      ></json-form>
    `);
    expect(forced.shadowRoot.querySelector('.invalid')).to.exist;
    expect(forced.shadowRoot.querySelector('.error')).to.exist;
  });

  it('becomes valid once the required field is filled', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${requiredSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/name' }}
      ></json-form>
    `);
    const input = el.shadowRoot.querySelector('wa-input');
    input.value = 'James';
    setTimeout(() => input.dispatchEvent(new Event('input', { bubbles: true, composed: true })));
    await oneEvent(el, 'formDataChange');
    expect(el.validatorState.valid).to.be.true;
  });

  it('finds the first invalid control via getFirstInvalid', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${requiredSchema}
        .uiSchema=${{
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        }}
        forceErrors
      ></json-form>
    `);
    await shadowQuery(el, 'vertical-layout', 'json-form');
    expect(el.getFirstInvalid()).to.exist;
  });
});

describe('json-form rules', () => {
  const schema = {
    type: 'object',
    properties: {
      showDetails: { type: 'boolean' },
      details: { type: 'string' },
    },
  };

  /**
   * @param {string} effect
   * @param {object} value
   */
  async function fixtureWithRule(effect, value) {
    const el = await fixture(html`
      <json-form
        .schema=${schema}
        .uiSchema=${{
          type: 'Control',
          scope: '#/properties/details',
          rule: {
            effect,
            condition: { scope: '#/properties/showDetails', schema: { const: true } },
          },
        }}
        .value=${value}
      ></json-form>
    `);
    return el.shadowRoot.querySelector('wa-input');
  }

  it('SHOW hides the control while the condition does not match', async () => {
    expect((await fixtureWithRule('SHOW', { showDetails: false })).classList.contains('hidden')).to
      .be.true;
    expect((await fixtureWithRule('SHOW', { showDetails: true })).classList.contains('hidden')).to
      .be.false;
  });

  it('HIDE hides the control while the condition matches', async () => {
    expect((await fixtureWithRule('HIDE', { showDetails: true })).classList.contains('hidden')).to
      .be.true;
  });

  it('ENABLE and DISABLE toggle the disabled state', async () => {
    expect((await fixtureWithRule('ENABLE', { showDetails: false })).disabled).to.be.true;
    expect((await fixtureWithRule('DISABLE', { showDetails: true })).disabled).to.be.true;
  });

  it('hides whole layouts', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${schema}
        .uiSchema=${{
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/properties/details' }],
          rule: {
            effect: 'SHOW',
            condition: { scope: '#/properties/showDetails', schema: { const: true } },
          },
        }}
        .value=${{ showDetails: false }}
      ></json-form>
    `);
    expect(el.shadowRoot.querySelector('vertical-layout')).to.not.exist;
  });
});

describe('json-form layouts', () => {
  it('renders one nested form per element in a vertical layout', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/name' },
            { type: 'Control', scope: '#/properties/age' },
          ],
        }}
      ></json-form>
    `);
    const layout = el.shadowRoot.querySelector('vertical-layout');
    expect(layout).to.exist;
    await layout.updateComplete;
    expect(layout.shadowRoot.querySelectorAll('json-form').length).to.equal(2);
  });

  it('renders a group layout with its label', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{
          type: 'GroupLayout',
          label: 'Person',
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        }}
      ></json-form>
    `);
    const layout = el.shadowRoot.querySelector('group-layout');
    await layout.updateComplete;
    expect(layout.shadowRoot.querySelector('h3').textContent).to.equal('Person');
  });

  it('renders tabs with the configured names', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{
          type: 'TabLayout',
          options: { tabNames: ['foo', 'bar'] },
          elements: [
            { type: 'Control', scope: '#/properties/name' },
            { type: 'Control', scope: '#/properties/age' },
          ],
        }}
      ></json-form>
    `);
    const layout = el.shadowRoot.querySelector('tab-layout');
    await layout.updateComplete;
    const tabs = [...layout.shadowRoot.querySelectorAll('wa-tab')];
    expect(tabs.length).to.equal(2);
    expect(tabs[0].textContent).to.include('foo');
    expect(tabs[1].textContent).to.include('bar');
  });

  it('renders a Label element as a heading', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{ type: 'Label', text: 'Section Title' }}
      ></json-form>
    `);
    expect(el.shadowRoot.querySelector('h3').textContent).to.equal('Section Title');
  });

  it('renders a Separator element', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{ type: 'Separator', options: { label: 'Part 2' } }}
      ></json-form>
    `);
    const separator = el.shadowRoot.querySelector('owc-separator');
    expect(separator).to.exist;
    expect(separator.textContent).to.include('Part 2');
  });

  it('renders nothing without a uiSchema', async () => {
    const el = await fixture(html`<json-form .schema=${personSchema}></json-form>`);
    expect(el.shadowRoot.children.length).to.equal(0);
  });
});

describe('json-form array layout', () => {
  const arraySchema = {
    type: 'object',
    properties: {
      pets: {
        type: 'array',
        items: { type: 'object', properties: { petName: { type: 'string' } } },
      },
    },
  };
  const arrayUiSchema = {
    type: 'ArrayLayout',
    label: 'Pets',
    scope: '#/properties/pets',
    elements: {
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: '#/properties/pets/properties/petName' }],
    },
  };

  it('renders one card per array entry', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${arraySchema}
        .uiSchema=${arrayUiSchema}
        .value=${{ pets: [{ petName: 'Rex' }, { petName: 'Milo' }] }}
      ></json-form>
    `);
    const layout = el.shadowRoot.querySelector('array-layout');
    await layout.updateComplete;
    expect(layout.shadowRoot.querySelectorAll('owc-card').length).to.equal(2);
  });

  it('adds an entry via the add button', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${arraySchema}
        .uiSchema=${arrayUiSchema}
        .value=${{ pets: [{ petName: 'Rex' }] }}
      ></json-form>
    `);
    const layout = el.shadowRoot.querySelector('array-layout');
    await layout.updateComplete;
    layout.shadowRoot.querySelector('wa-button').click();
    await layout.updateComplete;
    expect(el.value.pets.length).to.equal(2);
    expect(layout.shadowRoot.querySelectorAll('owc-card').length).to.equal(2);
  });

  it('removes an entry via the trash button and fires formDataChange', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${arraySchema}
        .uiSchema=${arrayUiSchema}
        .value=${{ pets: [{ petName: 'Rex' }, { petName: 'Milo' }] }}
      ></json-form>
    `);
    const layout = el.shadowRoot.querySelector('array-layout');
    await layout.updateComplete;
    const trash = layout.shadowRoot.querySelector('owc-icon-button');
    setTimeout(() => trash.click());
    await oneEvent(el, 'formDataChange');
    expect(el.value.pets).to.deep.equal([{ petName: 'Milo' }]);
  });

  it('hides the add button for readonly forms', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${arraySchema}
        .uiSchema=${arrayUiSchema}
        .value=${{ pets: [{ petName: 'Rex' }] }}
        readonly
      ></json-form>
    `);
    const layout = el.shadowRoot.querySelector('array-layout');
    await layout.updateComplete;
    expect(layout.shadowRoot.querySelector('wa-button')).to.not.exist;
    expect(layout.shadowRoot.querySelector('owc-icon-button')).to.not.exist;
  });
});

describe('json-form checkbox combo layout', () => {
  const comboSchema = {
    type: 'object',
    properties: {
      small: { type: 'boolean' },
      large: { type: 'boolean' },
    },
  };
  const comboUiSchema = {
    type: 'CheckboxComboLayout',
    elements: [
      { type: 'Control', scope: '#/properties/small' },
      { type: 'Control', scope: '#/properties/large' },
    ],
  };

  it('checks all checkboxes via the select-all checkbox', async () => {
    const el = await fixture(html`
      <json-form .schema=${comboSchema} .uiSchema=${comboUiSchema} .value=${{}}></json-form>
    `);
    const layout = el.shadowRoot.querySelector('checkbox-combo-layout');
    await layout.updateComplete;
    const selectAll = layout.shadowRoot.querySelector('wa-checkbox');
    selectAll.checked = true;
    setTimeout(() =>
      selectAll.dispatchEvent(new Event('input', { bubbles: true, composed: true })),
    );
    await oneEvent(el, 'formDataChange');
    expect(el.value).to.deep.equal({ small: true, large: true });
  });

  it('shows an indeterminate select-all when only some are checked', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${comboSchema}
        .uiSchema=${comboUiSchema}
        .value=${{ small: true, large: false }}
      ></json-form>
    `);
    const layout = el.shadowRoot.querySelector('checkbox-combo-layout');
    await layout.updateComplete;
    const selectAll = layout.shadowRoot.querySelector('wa-checkbox');
    expect(selectAll.indeterminate).to.be.true;
  });
});

describe('json-form schema mode', () => {
  it('renders field types instead of inputs', async () => {
    const el = await fixture(html`
      <json-form
        .schema=${personSchema}
        .uiSchema=${{ type: 'Control', scope: '#/properties/name' }}
        .mode=${'schema'}
      ></json-form>
    `);
    expect(el.shadowRoot.querySelector('wa-input')).to.not.exist;
    expect(el.shadowRoot.textContent).to.include('string');
  });
});
