# Json Form

An implementation of [JsonForms](https://jsonforms.io/) built with [Lit](https://lit.dev/) and [Web Awesome](https://webawesome.com/).

`<json-form>` renders a complete, validated form from two JSON objects:

- `schema`: a [JSON Schema](https://json-schema.org/) describing the data — it is also used to validate the form value
- `uiSchema`: describes which controls to show and how to lay them out

## Usage

```js
import '@open-wc/components/define/json-form.js';
```

```js
html`<json-form
  @formDataChange=${ev => console.log(ev.target.value)}
  .schema=${{
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
  }}
  .uiSchema=${{
    type: 'VerticalLayout',
    elements: [{ type: 'Control', scope: '#/properties/name' }],
  }}
></json-form>`;
```

Every user edit fires a `formDataChange` event and the form element's `value` property always
holds the current form value. Validation against `schema` runs automatically on every change —
see `validatorState`, `forceErrors`, `validate()` and `getFirstInvalid()`.

The `rootForm` and `validatorState` properties are managed internally — don't set them.

TypeScript consumers can type both inputs without depending on JSON Forms:

```ts
import type { JsonSchema7, UISchemaElement } from '@open-wc/components/JsonFormTypes.js';

const schema: JsonSchema7 = {
  type: 'object',
  properties: { name: { type: 'string' } },
};

const uiSchema: UISchemaElement = {
  type: 'VerticalLayout',
  elements: [{ type: 'Control', scope: '#/properties/name' }],
};
```

`JsonSchema7` builds on the schema type used by the existing `@cfworker/json-schema` validator.
`UISchemaElement` describes this component's supported controls, layouts, labels, separators,
rules, and custom options rather than the broader JSON Forms model.

## Features

- Controls: `string`, `boolean`, `number`, `integer` plus the string formats `date`, `time` and `datetime`; text controls support single- and multi-field `autofill` presets
- Single- and multi-select via `enum`/`oneOf` (autocomplete or radio group)
- Layouts: `VerticalLayout`, `HorizontalLayout`, `GroupLayout`, `TabLayout`, `DetailsLayout`, `ArrayLayout`, `CheckboxComboLayout` and more
- `Label` and `Separator` elements
- Rules on controls and layouts: `SHOW`, `HIDE`, `ENABLE`, `DISABLE`
- `readonly` forms, a `schema` display mode, custom renderers and click-editable renderers

For the full documentation with live demos see [JsonForm.rocket.md](./JsonForm.rocket.md)
(`/json-form` on the docs site).
