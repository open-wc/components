```js server
export const config = {
  path: '/forms/json-form',
  title: 'Json Form',
  menu: {
    parent: '/forms',
    order: 10,
    iconName: 'ui-checks',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import '@open-wc/components/define/json-form.js';
```

# Json Form

An implementation of [JsonForms](https://jsonforms.io/) built with [lit](https://lit.dev/) and [Web Awesome](https://webawesome.com/).

A Json Form allows you to create forms using only JSON.
Every form needs two schemas to function:

- schema: this is the [Json Schema](https://json-schema.org/) that defines your data, and the schema that the form will return. It is also used to validate the form value.
- uiSchema: defines the visuals and layout of the form

All examples on this page will console-log their value every time they change.

## Quick start

```js demo
export const simple = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value, ev)}
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Please enter your name' },
        age: { type: 'integer', description: 'Please enter your age' },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/age' },
      ],
    }}
  ></json-form>`;
```

## Custom layouts

The `layouts` property maps UI schema type names to `{ tagName, elementClass }` definitions.
JsonForm registers each class using `ScopedElementsMixin`; no global definition or JsonForm
subclass is needed. A mapping can also override a built-in type for the form receiving it.
An unregistered type produces an error naming the missing layout.

```js
import { LitElement, css, html } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { JsonForm } from '@open-wc/components/JsonForm.js';

class GridLayout extends ScopedElementsMixin(LitElement) {
  static scopedElements = { 'json-form': JsonForm };

  static properties = {
    schema: { attribute: false },
    uiSchema: { attribute: false },
    value: { attribute: false },
    validatorState: { attribute: false },
    renderers: { attribute: false },
    layouts: { attribute: false },
    forceErrors: { type: Boolean },
    readonly: { type: Boolean },
    mode: { type: String },
  };

  static styles = css`
    :host {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 1rem;
    }
  `;

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

/** @type {import('@open-wc/components/JsonFormTypes.js').LayoutRecord} */
const layouts = { GridLayout: { tagName: 'app-grid-layout', elementClass: GridLayout } };

// Register 'json-form': JsonForm in the host component's scopedElements.
html`<json-form
  .layouts=${layouts}
  .schema=${{ type: 'object', properties: { name: { type: 'string' } } }}
  .uiSchema=${{
    type: 'GridLayout',
    elements: [{ type: 'Control', scope: '#/properties/name' }],
  }}
></json-form>`;
```

JsonForm supplies the properties shown above to the layout. Forward them to every child form,
including `layouts` for nested custom layouts. Set `rootForm` to `false` so only the root form
handles bubbling `formDataChange` events and validates the shared value. Layout visibility rules
and inherited renderer/fallback options are processed before rendering the layout.

Use a unique custom element tag for each layout class. Registries are shared by JsonForm instances;
registering a different class under an existing tag throws an error. To change a mapping at runtime,
assign a new `layouts` object, using a new tag when changing the class. The usual scoped-elements
polyfill must be loaded before components for registry isolation; without it, the mixin uses the global
registry. The UI schema type mapping remains local to each form in either mode.

## Autofill presets

Add `options.autofill` to a text control to keep free-text entry while offering common values.
Use `value` for a single field or `fill` to update several form paths atomically. Combining
`multi: true` with autofill renders a textarea.

```js demo
export const autofill = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        iban: { type: 'string', title: 'IBAN' },
        bic: { type: 'string', title: 'BIC' },
        accountHolder: { type: 'string', title: 'Account holder' },
        internalNote: { type: 'string', title: 'Internal note' },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/iban',
          options: {
            autofill: [
              {
                label: 'Main account · Example Bank',
                fill: {
                  '#/properties/iban': 'AT12 3456 7890',
                  '#/properties/bic': 'EXAMPLEAT',
                  '#/properties/accountHolder': 'Jane Doe',
                },
              },
            ],
          },
        },
        { type: 'Control', scope: '#/properties/bic' },
        { type: 'Control', scope: '#/properties/accountHolder' },
        {
          type: 'Control',
          scope: '#/properties/internalNote',
          options: {
            multi: true,
            autofill: [
              {
                label: 'Follow-up required',
                value: 'Please follow up with the customer.',
              },
            ],
          },
        },
      ],
    }}
    .value=${{}}
  ></json-form>`;
```

## Controls

These are the default Json-Form controls:

```js demo
export const defaultControls = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        string: {
          type: 'string',
        },
        boolean: {
          type: 'boolean',
          description: 'Boolean description as a tooltip',
        },
        number: {
          type: 'number',
        },
        integer: {
          type: 'integer',
        },
        date: {
          type: 'string',
          format: 'date',
        },
        time: {
          type: 'string',
          format: 'time',
        },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/string',
        },
        {
          type: 'Control',
          scope: '#/properties/boolean',
        },
        {
          type: 'Control',
          scope: '#/properties/number',
        },
        {
          type: 'Control',
          scope: '#/properties/integer',
        },
        {
          type: 'Control',
          scope: '#/properties/date',
        },
        {
          type: 'Control',
          scope: '#/properties/time',
        },
      ],
    }}
    .value=${{
      string: 'This is a string',
      boolean: true,
      number: 50.5,
      integer: 50,
      date: '2020-06-25',
    }}
  ></json-form>`;
```

Supported schema types:

- string
- boolean
- number
- integer

Supported schema formats (type string):

- date
- time
- datetime

## Array

The `ArrayLayout` renders one card per entry of an array property, with buttons to add and remove entries.
It takes a `scope` pointing to the array property and a single layout in `elements` that is repeated for every entry.
Scopes inside that layout are written as if they pointed at the array itself — the entry index is inserted automatically.

Supported `options`:

- `hidePlus: {true}` hides the add button
- `hideTrash: {true}` hides the remove buttons

```js demo
export const array = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        string: { type: 'string' },
        array: {
          type: 'array',
          minItems: 3,
          items: {
            type: 'object',
            properties: { string: { type: 'string' }, number: { type: 'number' } },
          },
        },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/string' },
        {
          type: 'ArrayLayout',
          label: 'Array',
          scope: '#/properties/array',
          elements: {
            type: 'VerticalLayout',
            elements: [
              { type: 'Control', scope: '#/properties/array/properties/string' },
              { type: 'Control', scope: '#/properties/array/properties/number' },
              { type: 'Control', scope: '#/properties/string' },
            ],
          },
        },
      ],
    }}
    .value=${{
      string: 'foobar',
      array: [{ string: 'foo' }, { string: 'bar', number: 5 }],
    }}
  >
  </json-form>`;
```

## Multiple choice

There are two types that will produce multiple-choice inputs, enum and oneOf.

- enum takes a simple list of possible values, whereas
- oneOf takes a list of objects, containing the values as `const`, and the visible text as `title`

```js demo
export const enumOneOf = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        enum: {
          type: 'string',
          enum: ['One', 'Two', 'Three'],
        },
        typeOneOf: {
          type: 'integer',
          title: 'oneOf',
          oneOf: [
            { const: 1, title: 'One' },
            { const: 2, title: 'Two' },
            { const: 3, title: 'Three' },
          ],
        },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/enum',
        },
        {
          type: 'Control',
          scope: '#/properties/typeOneOf',
        },
      ],
    }}
  ></json-form>`;
```

## Multiselect

If you want to be able to select multiple options at once, make the property an array and set the items to enum or oneOf.

```js demo
export const multiselect = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        enum: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['One', 'Two', 'Three'],
          },
        },
        typeOneOf: {
          type: 'array',
          title: 'oneOf',
          items: {
            type: 'integer',
            oneOf: [
              { const: 1, title: 'One' },
              { const: 2, title: 'Two' },
              { const: 3, title: 'Three' },
            ],
          },
        },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/enum',
        },
        {
          type: 'Control',
          scope: '#/properties/typeOneOf',
        },
      ],
    }}
  ></json-form>`;
```

## Options

```js demo
export const options = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        toggle: {
          type: 'boolean',
        },
        checkboxTag: {
          type: 'boolean',
        },
        tagVariant: {
          type: 'boolean',
        },
        size: {
          type: 'boolean',
        },
        slider: {
          type: 'number',
          minimum: 1,
          maximum: 50,
        },
        rating: {
          type: 'number',
          minimum: 0,
          maximum: 5,
        },
        multi: {
          type: 'string',
        },
        radio: {
          type: 'string',
          enum: ['One', 'Two', 'Three'],
        },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/toggle',
          options: {
            toggle: true,
          },
        },
        {
          type: 'Control',
          scope: '#/properties/checkboxTag',
          options: {
            checkboxTag: true,
          },
        },
        {
          type: 'Control',
          scope: '#/properties/tagVariant',
          options: {
            checkboxTag: true,
            tagVariant: 'success',
          },
        },
        {
          type: 'Control',
          scope: '#/properties/size',
          label: 'Large Checkbox',
          options: {
            size: 'large',
          },
        },
        {
          type: 'Control',
          scope: '#/properties/slider',
          options: {
            slider: true,
          },
        },
        {
          type: 'Control',
          scope: '#/properties/rating',
          options: {
            rating: true,
          },
        },
        {
          type: 'Control',
          scope: '#/properties/multi',
          options: {
            multi: true,
          },
        },
        {
          type: 'Control',
          scope: '#/properties/radio',
          options: {
            format: 'radio',
          },
        },
      ],
    }}
  ></json-form>`;
```

Supported uiSchema options:

- toggle: `{true}` for booleans: renders checkbox as a toggle
- checkboxTag: `{true}` for booleans: renders the checkbox in a tag
- tagVariant: `{"brand" | "success" | "warning" | "danger" | "neutral"}` for booleans: the color for the checkbox tag
- size: `{"small" | "medium" | "large"}` for booleans: renders the checkbox in a different size
- slider: `{true}` for numbers: renders a slider. You can set the boundaries with the `minimum` and `maximum` properties in the normal schema.
- rating: `{true}` for numbers: renders a star-rating. You can set the boundaries with the `minimum` and `maximum` properties in the normal schema.
- multi: `{true}` for strings: renders a textarea instead of an input
- format: `{"radio"}` for single-select enums: renders a radio group

## Layouts

To structure your forms, you can put your controls into different layouts. A layout is an entry in the uiSchema with `type` set to `...Layout` and a list of `elements`.

### Vertical layout

```js demo
export const vertical = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Please enter your name' },
        age: { type: 'integer', description: 'Please enter your age' },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/age' },
      ],
    }}
  ></json-form>`;
```

### Horizontal layout

```js demo
export const horizontal = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Please enter your name' },
        age: { type: 'integer', description: 'Please enter your age' },
      },
    }}
    .uiSchema=${{
      type: 'HorizontalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/age' },
      ],
    }}
  ></json-form>`;
```

### Group layout

A group layout is like a vertical layout, but it has a visual separator and an additional `label` property.

```js demo
export const group = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Please enter your name' },
        age: { type: 'integer', description: 'Please enter your age' },
      },
    }}
    .uiSchema=${{
      type: 'GroupLayout',
      label: 'Group Layout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/age' },
      ],
    }}
  ></json-form>`;
```

### Nested layouts

Elements in Layouts can also be other layouts

```js demo
export const nested = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Please enter your name' },
        age: { type: 'integer', description: 'Please enter your age' },
      },
    }}
    .uiSchema=${{
      type: 'GroupLayout',
      label: 'Nested Layout',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'VerticalLayout',
              elements: [
                { type: 'Control', scope: '#/properties/name' },
                { type: 'Control', scope: '#/properties/age' },
              ],
            },
            {
              type: 'VerticalLayout',
              elements: [
                { type: 'Control', scope: '#/properties/name' },
                { type: 'Control', scope: '#/properties/age' },
              ],
            },
          ],
        },
      ],
    }}
  ></json-form>`;
```

### CheckboxCombo layout

A horizontal layout meant for checkboxes with tags that adds a 'select-all' checkbox

```js demo
export const checkboxCombo = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        size: {
          type: 'object',
          properties: {
            small: { type: 'boolean' },
            medium: { type: 'boolean' },
            large: { type: 'boolean' },
          },
        },
      },
    }}
    .uiSchema=${{
      type: 'CheckboxComboLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/size/properties/small',
          options: {
            checkboxTag: true,
            tagVariant: 'neutral',
          },
        },
        {
          type: 'Control',
          scope: '#/properties/size/properties/medium',
          options: {
            checkboxTag: true,
            tagVariant: 'brand',
          },
        },
        {
          type: 'Control',
          scope: '#/properties/size/properties/large',
          options: {
            checkboxTag: true,
            tagVariant: 'success',
          },
        },
      ],
    }}
  ></json-form>`;
```

### Tab Layout

A layout for grouping forms into tabs.

```js demo
export const tabs = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Please enter your name' },
        age: { type: 'integer', description: 'Please enter your age' },
      },
    }}
    .uiSchema=${{
      type: 'GroupLayout',
      label: 'Tab Layout',
      elements: [
        {
          type: 'TabLayout',
          options: {
            tabNames: ['foo', 'bar'],
          },
          elements: [
            {
              type: 'VerticalLayout',
              elements: [{ type: 'Control', scope: '#/properties/name' }],
            },
            {
              type: 'VerticalLayout',
              elements: [{ type: 'Control', scope: '#/properties/age' }],
            },
          ],
        },
      ],
    }}
  ></json-form>`;
```

### Details Layout

A layout for hiding forms.

```js demo
export const details = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        street: { type: 'string' },
        nr: { type: 'string' },
        city: { type: 'string' },
        postalCode: { type: 'string' },
      },
    }}
    .uiSchema=${{
      type: 'GroupLayout',
      label: 'Details Layout',
      elements: [
        {
          type: 'DetailsLayout',
          label: 'My Address',
          options: {
            formatter: '{street} {nr}, {postalCode} {city}',
            formatterScope: '#/properties',
          },
          subLayout: {
            type: 'VerticalLayout',
            elements: [
              { type: 'Control', scope: '#/properties/street' },
              { type: 'Control', scope: '#/properties/nr' },
              { type: 'Control', scope: '#/properties/postalCode' },
              { type: 'Control', scope: '#/properties/city' },
            ],
          },
        },
      ],
    }}
    .value=${{
      street: 'Broadway',
      nr: '2',
      postalCode: '10000',
      city: 'New York',
    }}
  ></json-form>`;
```

## Labels

The third type of uiSchema elements is labels. Labels can be used to divide the form into multiple parts, while still keeping it linear.
Controls can also be given labels. If a control has no label, it will try to generate it from the property name.

```js demo
export const labels = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value, ev)}
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Please enter your name' },
        age: { type: 'integer', description: 'Please enter your age' },
        fruit: {
          type: 'string',
          oneOf: [
            { const: 'apple', title: 'Apples' },
            { const: 'orange', title: 'Oranges' },
          ],
        },
      },
    }}
    .uiSchema=${{
      type: 'GroupLayout',
      label: 'Layout Label',
      elements: [
        { type: 'Control', scope: '#/properties/name', label: 'Name: also this is a custom label' },
        { type: 'Control', scope: '#/properties/fruit', label: 'Your favorite fruit' },
        { type: 'Label', scope: '#/properties/fruit' },
        { type: 'Label', text: 'Are you old enough?' },
        { type: 'Control', scope: '#/properties/age' },
      ],
    }}
  ></json-form>`;
```

## Separator

You can add a separator by using type separator.

```js demo
export const separator = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value, ev)}
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Please enter your name' },
        age: { type: 'integer', description: 'Please enter your age' },
      },
    }}
    .uiSchema=${{
      type: 'GroupLayout',
      label: 'Layout Label',
      elements: [
        { type: 'Control', scope: '#/properties/name', label: 'Name: also this is a custom label' },
        { type: 'Separator', options: { type: 'horizontal', label: 'I am a Separator' } },
        { type: 'Control', scope: '#/properties/age' },
      ],
    }}
  ></json-form>`;
```

## Rules

Controls and layouts can be shown, hidden, enabled and disabled dynamically with
[rules](https://jsonforms.io/docs/uischema/rules). A rule has an `effect` (`SHOW`, `HIDE`, `ENABLE` or `DISABLE`)
and a `condition` with a `scope` pointing at a property of the form value and a `schema` that is validated
against that property. The effect is applied while the condition matches.

```js demo
export const rules = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        employed: { type: 'boolean' },
        employer: { type: 'string' },
        salary: { type: 'number' },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/employed', options: { toggle: true } },
        {
          type: 'Control',
          scope: '#/properties/employer',
          rule: {
            effect: 'SHOW',
            condition: { scope: '#/properties/employed', schema: { const: true } },
          },
        },
        {
          type: 'Control',
          scope: '#/properties/salary',
          rule: {
            effect: 'ENABLE',
            condition: { scope: '#/properties/employed', schema: { const: true } },
          },
        },
      ],
    }}
  ></json-form>`;
```

## Validation

The form value is validated against the `schema` on every change. Errors are shown on a control
once the user has interacted with it — set `forceErrors` to show all errors immediately
(e.g. when the user tries to submit an untouched form).

```js demo
export const validation = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.validatorState)}
    forceErrors
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', minLength: 5 },
      },
      required: ['name'],
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/email' },
      ],
    }}
    .value=${{ email: 'a@b' }}
  ></json-form>`;
```

The form element also exposes:

- `validatorState: {ValidationResult}` the current validation result (`{valid, errors}`). Managed by the form — read only.
- `validate()` re-runs the validation and updates `validatorState`.
- `getFirstInvalid(): {Element | undefined}` returns the first form element with an invalid control, e.g. to scroll it into view on submit.

Note: empty strings, `null` and empty objects are stripped from the value before validation, so an
empty required text field reports a "required" error instead of a type error.

## Readonly

Set the `readonly` attribute to disable all controls of a form. `ArrayLayout` add/remove buttons are hidden as well.

```js demo
export const readonly = () =>
  html`<json-form
    readonly
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/age' },
      ],
    }}
    .value=${{ name: 'James Bond', age: 42 }}
  ></json-form>`;
```

## Getting the form data

Every time the user changes the form, a `formDataChange` event is fired on the `json-form` element.
The current change is accessible via the `value` and `path` properties, but you probably want the full form value,
which is in the `value` property of the form element (which is the event target).

```js demo
export const events = () =>
  html`<json-form
    @formDataChange=${ev =>
      console.log(
        `Changed property: ${ev.path}, New value: ${ev.value}, New form value:`,
        ev.target.value,
      )}
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: '#/properties/name' }],
    }}
  ></json-form>`;
```

## Switching renderers

You can switch to clickEditable renderers midway through a uiSchema.

```js demo
export const switchRenderers = () =>
  html`<json-form
    @formDataChange=${ev =>
      console.log(
        `Changed property: ${ev.path}, New value: ${ev.value}, New form value:`,
        ev.target.value,
      )}
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/name' }] },
        {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/name' },
            { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/name' }] },
          ],
          options: { renderers: 'clickEditable' },
        },
      ],
    }}
  ></json-form>`;
```

## Other options

Next to `schema` and `uiSchema`, Json-Form also supports these properties:

- `value: {any}`, allows you to set the value of the entire form.
- `forceErrors: {boolean}`, makes the form emit errors for incorrect fields, even if the user has not touched them yet.
- `readonly: {boolean}`, disables all controls, see [Readonly](#readonly).
- `mode: {'form' | 'schema'}`, `schema` renders the field types instead of inputs, see [Displaying schemas](#displaying-schemas).
- `renderers: {Record<string, Renderer>}`, allows you to overwrite renderers for certain types, see the next chapter.

The `rootForm` and `validatorState` properties are managed internally by the form — don't set them.

## Overwriting and adding Renderers

Changing the renderers is still experimental and not very well supported.
The default render types are:

- `checkboxTag`
- `date`
- `time`
- `datetime`
- `string`
- `boolean`
- `number`
- `integer`
- `enum`
- `multiEnum`

If you set one of these, it will overwrite the existing renderer. Otherwise, a new one will be added. You can then
use your new renderer by setting the name of your render type to `true` in the `options` of the `uiSchema`.

```js demo
import { inputListener, resolveDataSchema, processLabel } from '@open-wc/components/JsonForm.js';

export const customize = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        name: { type: 'string' },
        acceptTerms: { type: 'boolean', description: 'Accept Terms?' },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/acceptTerms', options: { dontClickAway: true } },
      ],
    }}
    .renderers=${{
      // don't use these renderers, they are just examples
      dontClickAway: (state, ruleOptions, value) =>
        html`<input
            @input=${inputListener(state.uiSchema, 'checked')}
            ?checked=${resolveDataSchema(value, state.uiSchema.scope)}
            type="radio"
          /><label>${processLabel(state)}</label>`,
      string: (state, ruleOptions, value) =>
        html`<div contenteditable="true" @input=${inputListener(state.uiSchema, 'innerText')}>
          ${resolveDataSchema(value, state.uiSchema.scope)}
        </div>`,
    }}
    .value=${{ name: 'James Bond', acceptTerms: false }}
  ></json-form>`;
```

## Displaying schemas

Set `mode` to `'schema'` to render the shape of the data — the field types — instead of interactive
inputs. Useful for read-only previews or documenting a schema.

```js demo
export const schemaMode = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .mode=${'schema'}
    .schema=${{
      type: 'object',
      properties: {
        string: {
          type: 'string',
        },
        boolean: {
          type: 'boolean',
          description: 'Boolean description as a tooltip',
        },
        number: {
          type: 'number',
        },
        integer: {
          type: 'integer',
        },
        date: {
          type: 'string',
          format: 'date',
        },
        time: {
          type: 'string',
          format: 'time',
        },
      },
    }}
    .uiSchema=${{
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/string',
        },
        {
          type: 'Control',
          scope: '#/properties/boolean',
        },
        {
          type: 'Control',
          scope: '#/properties/number',
        },
        {
          type: 'Control',
          scope: '#/properties/integer',
        },
        {
          type: 'Control',
          scope: '#/properties/date',
        },
        {
          type: 'Control',
          scope: '#/properties/time',
        },
      ],
    }}
    .value=${{
      string: 'This is a string',
      boolean: true,
      number: 50.5,
      integer: 50,
      date: '2020-06-25',
    }}
  ></json-form>`;
```

## Array Tabs Kitchen Sink

A larger combined example: an `ArrayLayout` nested inside a `TabLayout`, showing how layouts,
controls, and array entries compose together in a single form.

```js demo
export const arrayTabsKitchenSink = () =>
  html`<json-form
    @formDataChange=${ev => console.log(ev.target.value)}
    .schema=${{
      type: 'object',
      properties: {
        string: { type: 'string' },
        number: { type: 'number' },
        array: {
          type: 'array',
          minItems: 3,
          items: {
            type: 'object',
            properties: { string: { type: 'string' }, number: { type: 'number' } },
          },
        },
      },
    }}
    .uiSchema=${{
      type: 'TabLayout',
      options: { tabNames: ['foo', 'array'] },
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/string' },
            { type: 'Control', scope: '#/properties/number' },
          ],
        },
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'ArrayLayout',
              label: 'Array',
              scope: '#/properties/array',
              elements: {
                type: 'VerticalLayout',
                elements: [
                  { type: 'Control', scope: '#/properties/array/properties/string' },
                  { type: 'Control', scope: '#/properties/array/properties/number' },
                  { type: 'Control', scope: '#/properties/string' },
                ],
              },
            },
          ],
        },
      ],
    }}
    .value=${{
      string: 'foobar',
      array: [
        { string: 'foo', number: 4 },
        { string: 'bar', number: 5 },
      ],
    }}
  >
  </json-form>`;
```

## API

### Attributes & properties

| Property         | Type                 | Default                       | Description                                                                              |
| ---------------- | -------------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| `schema`         | `JsonSchema7`        | `{}`                          | JSON Schema that defines and validates the form data.                                    |
| `uiSchema`       | `UISchemaElement`    | `{}`                          | JsonForms UI schema that selects controls, layouts, labels, and options.                 |
| `value`          | `object`             | `{}`                          | Current form data. Updated in place as controls emit `formDataChange`.                   |
| `validatorState` | `ValidationResult`   | `{ valid: true, errors: [] }` | Latest validation result for `value` against `schema`.                                   |
| `rootForm`       | `boolean`            | `true`                        | Marks the form that owns value updates and validation. Nested forms set this internally. |
| `forceErrors`    | `boolean`            | `false`                       | Forces validation errors to render even before a field has been touched.                 |
| `renderers`      | `RendererRecord`     | `{}`                          | Custom renderers merged with the default renderer set.                                   |
| `readonly`       | `boolean`            | `false`                       | Renders controls read-only by passing `readonly` into control options.                   |
| `mode`           | `'form' \| 'schema'` | `'form'`                      | Selects the form rendering mode.                                                         |

### Events

| Event            | Description                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `formDataChange` | Fired by controls and layouts when form data changes; read the current form data from `target.value`. |

### Methods

| Method              | Description                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `validate()`        | Revalidates `value` against `schema` and updates `validatorState`.    |
| `getFirstInvalid()` | Returns the first invalid nested `json-form` element, or `undefined`. |
