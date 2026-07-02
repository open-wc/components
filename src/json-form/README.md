# Json-form

An Implementation of [JsonForms](https://jsonforms.io/) with built with [lit](https://lit.dev/) and [Shoelace](https://shoelace.style)

## Usage:

Import the Component and pass in the schema, uiSchema, and an optional value, which will initialize the form.
Don't touch the rootForm and validatorState options

If the user enters data, the form will emit a "formDataChange" event, which holds internal information. The value property will hold the value of the form.
For an example, please see the [demo](./src/form/JsonForm.rocket.md)

## Supported Options

- schema:
  - Supported types:
    - string
    - boolean
    - number
    - integer
  - Supported formats: (use string type)
    - date
    - time
    - datetime
  - Supported multiple choice options:
    - enum
    - oneOf
    - array with items: {enum: ...}
    - array with items: {oneOf: ...}
- uiSchema:
  - Supported types:
    - Control: a form control element (with "scope" property)
    - Label: just a label (with "text" property)
    - HorizontalLayout
    - VerticalLayout
    - GroupLayout
    - CheckboxComboLayout: all layouts with an "elements" property
  - Supported options:
    - toggle: (boolean) for booleans: renders checkbox as a toggle
    - checkboxTag: (boolean) for booleans: renders the checkbox in a tag
    - tagVariant: ("brand" | "neutral" | "warning" | "danger" | "neutral") for booleans: the color for the checkbox tag
    - size: ("small" | "medium" | "large") for booleans: renders the checkbox in a different size
    - slider: (boolean) for numbers: renders a slider. default from 0 to 100, set with minimum & maximum in schema
    - multi: (boolean) for strings: renders a textarea instead of an input
    - format: ("radio" | ) for single-select enums: renders a radio group

## Adding your own renderer

To add your own renderer, use the addRenderer method. Using the mode, specify if the renderer should trigger on a type,
a format or an option. Options have priority over formats with have priority over types. The name is the property that the form finds the renderer.
e.g.

```js
const ratingRenderer(state, ...) => {
  return html`...`;
};

addRenderer("option", "rating", ratingRenderer);

uiSchema = {
  ...,
  {
    type: "Control",
    options: {
      rating: true,
    },
  },
}
```

To add your own layouts, use the add Layout method. The name is the name of the layout used in the uiSchema.
The tagName is the name for the tag used in html. The layout Parameter is the class of the Layout.
e.g:

```js
class GridLayout extends ScopedElementsMixin(LitElement) {
  render() {
    return html`...`;
  }
}

addLayout("GridLayout", "grid-layout", GridLayout);

uiSchema = {
  ...,
  {
    type: "GridLayout",
    elements: [...],
  }
}
```
