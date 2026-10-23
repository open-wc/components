```js server
export const config = {
  path: '/forms/autocomplete',
  title: 'Autocomplete',
  menu: {
    parent: '/forms',
    order: 20,
    iconName: 'search',
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-autocomplete.js';
```

# Autocomplete

Autocomplete for a feature rich dropdown.

Simple example:

Select a single option from the `.data` property with autocomplete functionality.

```js demo
export const singleSelect = () => {
  return html`
    <owc-autocomplete
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Multi Select

Select multiple options with the `multiple` attribute from the `.data` property with autocomplete functionality.

```js demo
export const multiSelect = () => {
  return html`
    <owc-autocomplete
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
        { label: 'Zürich', value: '103' },
        { label: 'Helvetia', value: '104' },
        { label: 'Schellhammer', value: '105' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Multi Select Fill Mode

For Autocompletes with multiple you can enter a special "fill mode" in which you can paste space, comma, newline, tab formatted entries and those will be selected if they match the label or value of an option. (This also works copying from excel)

Try clicking the "Search Icon" and write/paste "100 104 102". You will see VAV, Helvetia and UNIQA be selected.
You can do the same by pasting for example "VAV,Helvetia,UNIQA" or "["100","104","102"]".

```js demo
export const multiSelectFillMode = () => {
  return html`
    <owc-autocomplete
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
        { label: 'Zürich', value: '103' },
        { label: 'Helvetia', value: '104' },
        { label: 'Schellhammer', value: '105' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Select by default

The `value` attribute selects the provided options by default.

```js demo
export const selectByDefault = () => {
  return html`
    <owc-autocomplete
      value="102 103 104"
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
        { label: 'Zürich', value: '103' },
        { label: 'Helvetia', value: '104' },
        { label: 'Schellhammer', value: '105' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Limit selected options visible

The `max-options-visible` attribute limits how many selected options are shown.

```js demo
export const maxVisible = () => {
  return html`
    <owc-autocomplete
      max-options-visible="2"
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
        { label: 'Zürich', value: '103' },
        { label: 'Helvetia', value: '104' },
        { label: 'Schellhammer', value: '105' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Hide select all button

The `hide-select-all` attribute hides the button to select all possible options.

```js demo
export const hideSelect = () => {
  return html`
    <owc-autocomplete
      hide-select-all
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
        { label: 'Zürich', value: '103' },
        { label: 'Helvetia', value: '104' },
        { label: 'Schellhammer', value: '105' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Placeholder

The text of the `placeholder` attribute is shown if no option is selected.

```js demo
export const placeholder = () => {
  return html`
    <owc-autocomplete
      placeholder="Choose one..."
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Accent Bar

The `accent-bar` attribute renders a small colored bar in front of each option (and the selected
option). The color is taken from the option's `accentBarColor` field - customize this by
setting the `.getAccentBarColor` property.

```js demo
export const accentBar = () => {
  return html`
    <owc-autocomplete
      accent-bar
      .getAccentBarColor=${row => row.accentBarColor}
      .data=${[
        { label: 'VAV', value: '100', accentBarColor: '#8247f5' },
        { label: 'Standard Life', value: '101', accentBarColor: '#00acc1' },
        { label: 'UNIQA', value: '102', accentBarColor: '#f97316' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Open externally

To open the dropdown call a function that sets `.open` to `true`. In this case there is an Open button with an event handler.

```js demo
export const openExternally = () => {
  return html`
    <owc-autocomplete
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
    <wa-button
      size="s"
      @click=${() => {
        const buttonOpen = document
          .querySelector('[demo-name=openExternally]')
          ?.shadowRoot?.querySelector('owc-autocomplete');
        if (buttonOpen) {
          buttonOpen.open = true;
        }
      }}
      >Open</wa-button
    >
  `;
};
```

## Disabled

The `disabled` attribute disables the dropdown.

```js demo
export const disabled = () => {
  return html`
    <owc-autocomplete
      disabled
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Clear button

The `with-clear` attribute adds a button that clears the selected options. It is only shown
while at least one option is selected.

```js demo
export const withClear = () => {
  return html`
    <owc-autocomplete
      with-clear
      value="101"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Label

The `label` attribute adds label above the dropdown.

```js demo
export const label = () => {
  return html`
    <owc-autocomplete
      label="Options"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Help text

The `hint` attribute adds a help text below the dropdown.

```js demo
export const helpText = () => {
  return html`
    <owc-autocomplete
      hint="Choose an option to continue..."
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Fixed Trigger

If you just want Autocomplete functionality but don't need to display the values in the form itself, you can use the `fixed-trigger` attribute to instead just display a slot.

```js demo
export const fixedTrigger = () => {
  return html`
    <owc-autocomplete
      fixed-trigger
      multiple
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    >
      <wa-icon name="gear"></wa-icon>Choices
    </owc-autocomplete>
  `;
};
```

## Size

The `size` attribute sets the height of the dropdown. Possible options are `small`, `medium` and `large`. The default is `medium`.

```js demo
export const size = () => {
  return html`
    <owc-autocomplete
      size="s"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
    <br />
    <owc-autocomplete
      size="m"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
    <br />
    <owc-autocomplete
      size="l"
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
  `;
};
```

## Number

You can also use numbers as values.

```js demo
export const number = () => {
  return html`
    <owc-autocomplete
      .data=${[
        { label: 'VAV', value: 100 },
        { label: 'Standard Life', value: 101 },
        { label: 'UNIQA', value: 102 },
      ]}
      .value=${100}
    ></owc-autocomplete>
  `;
};
```

## Events

Listen to `change` to react to selections. The element's `value` property always holds the
current selection - a single value, or an array of values when `multiple` is set.

```js demo
export const changeEvent = () => {
  return html`
    <owc-autocomplete
      multiple
      @change=${ev => {
        const out = ev.currentTarget.parentElement.querySelector('#change-event-out');
        out.textContent = `value: ${JSON.stringify(ev.currentTarget.value)}`;
      }}
      .data=${[
        { label: 'VAV', value: '100' },
        { label: 'Standard Life', value: '101' },
        { label: 'UNIQA', value: '102' },
      ]}
    ></owc-autocomplete>
    <pre id="change-event-out">value: []</pre>
  `;
};
```

## Keyboard interaction

While the dropdown is open:

- `ArrowDown` / `ArrowUp` move the highlighted option (wrapping around)
- `Home` / `End` jump to the first / last option
- `Enter` selects the highlighted option - if the search filters down to a single option, `Enter` selects it directly
- `Escape` or `Tab` close the dropdown

The highlighted option is always scrolled into view, also in long lists, so `Enter` selects an option you can see. If you scrolled the list away from the highlighted option, for example with the mouse wheel, `Enter` scrolls it back into view instead of selecting it, and the next `Enter` selects it.

While the combobox is focused and closed, any typing key opens the dropdown and focuses the search input.

## Large option lists

The dropdown lists every option that matches the search. From 300 options on, it only renders the options in and around the visible part of the list, so lists with 50,000 options stay fast. `virtualizer-mode="always"` does this for any number of options, and `virtualizer-mode="never"` always renders every option. The list grows with its options up to the space available below or above the control, and then scrolls.

### Benchmark

The two demos below load 50,000 generated options when you click **Load 50,000 options**. Open the dropdown and type to search: the demo reports how long it took from your click or keystroke until the browser painted the result. **Run scripted test** opens the dropdown, types a search, clears it, and jumps to the last and the first option.

```js client
import { LitElement, css, nothing } from 'lit';
import '@open-wc/components/define/owc-layout-sidebar.js';

const benchmarkOptionCount = 50_000;

const adjectives = ['Alpine', 'Bright', 'Coastal', 'Golden', 'Northern', 'Silver', 'Urban', 'Wild'];
const nouns = ['Bakery', 'Foods', 'Garden', 'Labs', 'Logistics', 'Motors', 'Partners', 'Studio'];
const cities = ['Berlin', 'Graz', 'Linz', 'Munich', 'Prague', 'Salzburg', 'Vienna', 'Zurich'];

/** Generated options with unique labels, such as "Golden Labs Vienna 1234". */
function generateOptions(count) {
  const options = new Array(count);
  for (let index = 0; index < count; index++) {
    const adjective = adjectives[index % adjectives.length];
    const noun = nouns[Math.floor(index / adjectives.length) % nouns.length];
    const city = cities[Math.floor(index / 64) % cities.length];
    options[index] = { label: `${adjective} ${noun} ${city} ${index + 1}`, value: `${index + 1}` };
  }
  return options;
}

let benchmarkOptions;

/** Resolves after the browser has painted the next frame. */
function afterNextPaint() {
  return new Promise(resolve =>
    requestAnimationFrame(() => {
      // a task queued in an animation frame callback runs once that frame is painted
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(undefined);
    }),
  );
}

class AutocompleteBenchmark extends LitElement {
  static properties = {
    layout: { type: String },
    options: { state: true },
    results: { state: true },
    busy: { state: true },
  };

  static styles = css`
    :host {
      display: block;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    /* a fixed height, so the autocomplete below doesn't move while results come in */
    .results {
      font-size: 0.875rem;
      height: 8em;
      overflow: auto;
      margin: 0 0 1rem;
      padding-left: 1.5em;
      border: 1px solid var(--wa-color-surface-border, #ccc);
    }
    owc-autocomplete {
      max-width: 400px;
    }
    .sidebar-frame {
      height: 100vh;
    }
    .sidebar-content {
      padding: 1rem;
      min-height: 150vh;
    }
  `;

  constructor() {
    super();
    this.layout = 'page';
    this.options = undefined;
    this.results = [];
    this.busy = false;
  }

  get autocomplete() {
    return this.renderRoot.querySelector('owc-autocomplete');
  }

  /** Adds results, newest first. */
  report(...lines) {
    this.results = [...lines.reverse(), ...this.results];
  }

  async load() {
    this.busy = true;
    benchmarkOptions ??= generateOptions(benchmarkOptionCount);
    this.options = benchmarkOptions;
    await this.updateComplete;
    this.renderRoot
      .querySelector('.sidebar-frame')
      ?.scrollIntoView({ block: 'start', behavior: 'instant' });
    this.busy = false;
  }

  /** Reports the time from the click that opens the dropdown until it is painted. */
  async measureOpening(event) {
    const autocomplete = this.autocomplete;
    // the combobox has toggled the dropdown already; a click that closes it doesn't count
    if (this.busy || !autocomplete.open || !event.composedPath().includes(autocomplete.combobox)) {
      return;
    }
    await autocomplete.updateComplete;
    await afterNextPaint();
    this.report(`Opened in ${Math.round(performance.now() - event.timeStamp)}ms`);
  }

  /** Reports the time from a keystroke in the search field until the new list is painted. */
  async measureKeystroke(event) {
    const autocomplete = this.autocomplete;
    if (this.busy || !event.composedPath().includes(autocomplete.search)) {
      return;
    }
    const query = autocomplete.search.value;
    await autocomplete.updateComplete;
    await afterNextPaint();
    this.report(
      `"${query}" listed ${autocomplete.processedData.length.toLocaleString('en')} options ` +
        `${Math.round(performance.now() - event.timeStamp)}ms after the keystroke`,
    );
  }

  async runScript() {
    this.busy = true;
    const autocomplete = this.autocomplete;
    const timed = async (name, action) => {
      const start = performance.now();
      action();
      await autocomplete.updateComplete;
      await afterNextPaint();
      return `${name}: ${Math.round(performance.now() - start)}ms`;
    };
    const type = text => {
      autocomplete.search.value = text;
      autocomplete.search.dispatchEvent(new Event('input'));
    };
    const press = key => document.dispatchEvent(new KeyboardEvent('keydown', { key }));

    const lines = [await timed('Open', () => autocomplete.show())];
    for (const query of ['g', 'go', 'gol', 'gold', 'golden', 'golden l', 'golden la']) {
      lines.push(await timed(`Type "${query}"`, () => type(query)));
    }
    for (const query of ['golden l', 'golden', 'gold', 'gol', 'go', 'g', '']) {
      lines.push(await timed(`Delete to "${query}"`, () => type(query)));
    }
    lines.push(await timed('End', () => press('End')));
    lines.push(await timed('Home', () => press('Home')));
    lines.push(await timed('Close', () => autocomplete.hide()));
    this.report(lines.join(', '));
    this.busy = false;
  }

  render() {
    const autocomplete = this.options
      ? html`<owc-autocomplete
          label="Company"
          placeholder="Choose a company"
          .data=${this.options}
          @mousedown=${this.measureOpening}
          @input=${this.measureKeystroke}
        ></owc-autocomplete>`
      : nothing;
    return html`
      <div class="controls">
        <button @click=${this.load} ?disabled=${this.busy || this.options}>
          Load 50,000 options
        </button>
        <button @click=${this.runScript} ?disabled=${this.busy || !this.options}>
          Run scripted test
        </button>
      </div>
      <ul class="results">
        ${this.results.map(line => html`<li>${line}</li>`)}
      </ul>
      ${
        this.layout === 'sidebar'
          ? html`<div class="sidebar-frame">
              <owc-layout-sidebar
                .menuItemList=${[
                  { icon: 'house', label: 'Overview', href: '#overview' },
                  { icon: 'table', label: 'Reports', href: '#reports' },
                  { icon: 'gear', label: 'Settings', href: '#settings' },
                ]}
              >
                <div class="sidebar-content">${autocomplete}</div>
              </owc-layout-sidebar>
            </div>`
          : autocomplete
      }
    `;
  }
}

customElements.define('autocomplete-benchmark-demo', AutocompleteBenchmark);
```

### Benchmark with Page Scrolling

The autocomplete is part of the page, and the page scrolls.

```js demo
export const benchmarkPageScrolling = () => {
  return html`<autocomplete-benchmark-demo layout="page"></autocomplete-benchmark-demo>`;
};
```

### Benchmark inside owc-layout-sidebar

The autocomplete sits in the content area of `owc-layout-sidebar`, which scrolls instead of the page.

```js demo
export const benchmarkLayoutSidebar = () => {
  return html`<autocomplete-benchmark-demo layout="sidebar"></autocomplete-benchmark-demo>`;
};
```

## API

### Attributes & properties

| Attribute             | Property            | Type                              | Default              | Description                                                                                                         |
| --------------------- | ------------------- | --------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| -                     | `data`              | `Array<T>`                        | `[]`                 | The options. Each option needs a `label` and a `value` field (see `getOptionValue`).                                |
| `value`               | `value`             | `unknown \| unknown[]`            | -                    | The selected value(s). As an attribute: a space separated list. As a property: a single value or an array.          |
| `multiple`            | `multiple`          | `boolean`                         | `false`              | Allow selecting multiple options; selections are rendered as removable tags.                                        |
| `open`                | `open`              | `boolean`                         | `false`              | Whether the dropdown is open.                                                                                       |
| `disabled`            | `disabled`          | `boolean`                         | `false`              | Disables the control.                                                                                               |
| `required`            | `required`          | `boolean`                         | `false`              | Marks the internal form input as required.                                                                          |
| `label`               | `label`             | `string`                          | `''`                 | Label rendered above the control (alternative: `label` slot).                                                       |
| `hint`                | `hint`              | `string`                          | `''`                 | Help text rendered below the control (alternative: `hint` slot).                                                    |
| `placeholder`         | `placeholder`       | `string`                          | `''`                 | Text shown while nothing is selected.                                                                               |
| `placement`           | `placement`         | `'top' \| 'bottom'`               | `'bottom'`           | Preferred dropdown placement.                                                                                       |
| `size`                | `size`              | `'small' \| 'medium' \| 'large'`  | `'medium'`           | Size of the control.                                                                                                |
| `with-clear`          | `withClear`         | `boolean`                         | `false`              | Show a clear button while at least one option is selected.                                                          |
| `accent-bar`          | `accentBar`         | `boolean`                         | `false`              | Render a colored accent bar per option (see `getAccentBarColor`).                                                   |
| `max-options-visible` | `maxOptionsVisible` | `number`                          | `3`                  | Max number of tags shown when `multiple`; further selections collapse into a `+N` tag. `0` shows all.               |
| `hide-select-all`     | `hideSelectAll`     | `boolean`                         | `false`              | Hide the select all/deselect all button (only rendered when `multiple`).                                            |
| `fill-mode`           | `fillMode`          | `boolean`                         | `false`              | Paste mode: the search input selects all options matching the pasted values/labels.                                 |
| `fixed-trigger`       | `fixedTrigger`      | `boolean`                         | `false`              | Render the default slot as trigger instead of the form control.                                                     |
| `virtualizer-mode`    | `virtualizerMode`   | `'auto' \| 'always' \| 'never'`   | `'auto'`             | Render only the options in and around the visible part of the list: from 300 options on (`auto`), always, or never. |
| -                     | `syncWidth`         | `boolean`                         | `true`               | Sync the dropdown width with the trigger width.                                                                     |
| -                     | `currentValue`      | `unknown`                         | `''`                 | Value of the keyboard-highlighted option.                                                                           |
| -                     | `getOptionValue`    | `(row: T) => unknown`             | `row.value`          | Extracts the value of an option.                                                                                    |
| -                     | `getAccentBarColor` | `(row: T) => string \| undefined` | `row.accentBarColor` | Extracts the accent bar color of an option.                                                                         |
| -                     | `getTag`            | `(option: T) => TemplateResult`   | -                    | Customizes the tag rendered per selection when `multiple`.                                                          |
| -                     | `footer`            | `() => TemplateResult`            | -                    | Renders extra content at the bottom of the dropdown.                                                                |

### Events

| Event                    | Description                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `change`                 | Fired whenever the selection changes (select, deselect, clear, select all, fill mode paste). |
| `input`                  | Fired when the selection is cleared via the clear button or a tag remove button.             |
| `autocomplete-selection` | Fired when an option is selected. `detail` is the selected option object. Bubbles/composed.  |
| `wa-show`                | Fired after the dropdown opened via `show()`.                                                |
| `wa-hide`                | Fired after the dropdown closed via `hide()`.                                                |

### Methods

| Method             | Description                                      |
| ------------------ | ------------------------------------------------ |
| `show()`           | Opens the dropdown (no-op when already open).    |
| `hide()`           | Closes the dropdown.                             |
| `toggle()`         | Toggles the dropdown.                            |
| `focus()`          | Opens the dropdown and focuses the search input. |
| `clear()`          | Deselects all options (does not fire `change`).  |
| `toggleFillMode()` | Switches between search filtering and fill mode. |

### Slots

| Slot          | Description                                                   |
| ------------- | ------------------------------------------------------------- |
| `label`       | The label (alternative to the `label` attribute).             |
| `hint`        | The help text (alternative to the `hint` attribute).          |
| `start`       | Content placed before the selected value inside the combobox. |
| `end`         | Content placed after the selected value inside the combobox.  |
| `clear-icon`  | Replaces the default clear icon.                              |
| `expand-icon` | Replaces the default chevron icon.                            |
| (default)     | The trigger content when `fixed-trigger` is set.              |
