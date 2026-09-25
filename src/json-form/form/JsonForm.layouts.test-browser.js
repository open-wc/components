import { fixture, html, expect } from '@open-wc/testing';
import { LitElement } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { JsonForm, FormDataChangeEvent } from '@open-wc/components/JsonForm.js';
import { layoutRenderer } from '../renderers/layoutRenderer.js';

class CustomLayout extends ScopedElementsMixin(LitElement) {
  static scopedElements = { 'json-form': JsonForm };
  static properties = {
    schema: {},
    uiSchema: {},
    value: {},
    validatorState: {},
    renderers: {},
    layouts: {},
    forceErrors: { type: Boolean },
    readonly: { type: Boolean },
    mode: {},
  };

  render() {
    return html`${this.uiSchema.elements.map(
      element => html`
        <json-form
          .schema=${this.schema}
          .uiSchema=${element}
          .value=${this.value}
          .validatorState=${this.validatorState}
          .renderers=${this.renderers}
          .layouts=${this.layouts}
          .rootForm=${false}
          .forceErrors=${this.forceErrors}
          .readonly=${this.readonly}
          .mode=${this.mode}
        ></json-form>
      `,
    )}`;
  }
}

class FormHost extends ScopedElementsMixin(LitElement) {
  static scopedElements = { 'json-form': JsonForm };
  render() {
    return html`<json-form></json-form>`;
  }
}
customElements.define('test-layout-form-host', FormHost);

const layouts = { CustomLayout: { tagName: 'test-custom-layout', elementClass: CustomLayout } };
const customUiSchema = {
  type: 'CustomLayout',
  elements: [{ type: 'Control', scope: '#/properties/name' }],
};

async function createForm(uiSchema = customUiSchema) {
  const host = await fixture(html`<test-layout-form-host></test-layout-form-host>`);
  const form = host.shadowRoot.querySelector('json-form');
  form.schema = {
    type: 'object',
    properties: { name: { type: 'string', minLength: 1 } },
    required: ['name'],
  };
  form.value = { name: 'Ada', items: [{}] };
  form.layouts = layouts;
  form.uiSchema = uiSchema;
  await form.updateComplete;
  return form;
}

async function child(element, selector) {
  await element.updateComplete;
  const result = element.shadowRoot.querySelector(selector);
  expect(result, selector).to.exist;
  await result.updateComplete;
  return result;
}

describe('caller-supplied JsonForm layouts', () => {
  it('registers a layout in the form scope and preserves root validation and input events', async () => {
    const form = await createForm();
    const layout = await child(form, 'test-custom-layout');
    expect(layout).to.be.instanceOf(CustomLayout);
    expect(form.registry.get('test-custom-layout')).to.equal(CustomLayout);
    if (ShadowRoot.prototype.createElement) {
      expect(customElements.get('test-custom-layout')).to.equal(undefined);
      expect(customElements.get('json-form')).to.equal(undefined);
    }
    const control = await child(layout, 'json-form');
    expect(control.rootForm).to.equal(false);
    control.dispatchEvent(new FormDataChangeEvent('formDataChange', '#/properties/name', ''));
    expect(form.value.name).to.equal('');
    expect(form.validatorState.valid).to.equal(false);
    await form.updateComplete;
    await layout.updateComplete;
    expect(control.validatorState).to.equal(form.validatorState);
  });

  for (const [type, tag] of Object.entries({
    VerticalLayout: 'vertical-layout',
    HorizontalLayout: 'horizontal-layout',
    VerticalLayout2: 'vertical-layout-2',
    VerticalLayoutGrid: 'vertical-layout-grid',
    GroupLayout: 'group-layout',
    TabLayout: 'tab-layout',
    DetailsLayout: 'details-layout',
    ArrayLayout: 'array-layout',
  })) {
    it(`forwards registrations through ${type}`, async () => {
      const uiSchema =
        type === 'DetailsLayout'
          ? { type, label: 'Details', subLayout: customUiSchema }
          : type === 'ArrayLayout'
            ? { type, scope: '#/properties/items', elements: customUiSchema }
            : { type, label: 'Group', elements: [customUiSchema] };
      const form = await createForm(uiSchema);
      const builtIn = await child(form, tag);
      const nested = await child(builtIn, 'json-form');
      const custom = await child(nested, 'test-custom-layout');
      expect(custom.layouts).to.equal(layouts);
      expect(custom.value).to.equal(form.value);
    });
  }

  it('forwards registrations and form state through nested custom layouts', async () => {
    const form = await createForm({ type: 'CustomLayout', elements: [customUiSchema] });
    const renderers = { string: () => html`<span class="custom-control">custom</span>` };
    form.renderers = renderers;
    form.readonly = true;
    form.forceErrors = true;
    const outer = await child(form, 'test-custom-layout');
    const nested = await child(outer, 'json-form');
    const inner = await child(nested, 'test-custom-layout');
    const control = await child(inner, 'json-form');
    expect(control.renderers).to.equal(renderers);
    expect(control.readonly).to.equal(true);
    expect(control.forceErrors).to.equal(true);
    expect(control.shadowRoot.querySelector('.custom-control')).to.exist;
    form.mode = 'schema';
    await child(form, 'test-custom-layout');
    await child(outer, 'json-form');
    await child(nested, 'test-custom-layout');
    await child(inner, 'json-form');
    expect(control.mode).to.equal('schema');
  });

  it('honors hide rules on custom layouts', async () => {
    const form = await createForm({
      ...customUiSchema,
      rule: { effect: 'HIDE', condition: { scope: '#/properties/name', schema: { const: 'Ada' } } },
    });
    expect(form.shadowRoot.querySelector('test-custom-layout')).to.equal(null);
  });

  it('overrides a built-in layout only for forms receiving that mapping', async () => {
    const form = await createForm();
    form.layouts = { VerticalLayout: layouts.CustomLayout };
    form.uiSchema = { ...customUiSchema, type: 'VerticalLayout' };
    await child(form, 'test-custom-layout');
    const other = await createForm({ type: 'VerticalLayout', elements: [] });
    await child(other, 'vertical-layout');
  });

  it('explains how to register unknown layout types', () => {
    expect(() =>
      layoutRenderer(
        {},
        { type: 'Unknown', elements: [] },
        {},
        { valid: true, errors: [] },
        {},
        false,
        { hidden: false, disabled: false },
        false,
        'form',
      ),
    ).to.throw('Unknown JsonForm layout "Unknown". Register it with the layouts property.');
  });
});
