```js server
export const config = {
  path: '/utilities/toast',
  title: 'Toast',
  menu: {
    parent: '/utilities',
    order: 10,
    iconName: 'chat-left-text',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import { toast } from '@open-wc/components/OwcToast.js';
```

# Toast

Show a temporary notification. Call the `toast()` function and it takes care of everything:
it creates (and reuses) a fixed position container, stacks multiple toasts, counts down a
progress bar and removes the toast after `duration` seconds. Hovering a toast pauses the
countdown.

```js
import { toast } from '@open-wc/components/OwcToast.js';

toast({ title: 'Saved', text: 'Your changes have been saved.', variant: 'success' });
```

## Simple toast

here's a simple demo, showing how a toast looks. simply enter the desired text and duration and press `create toast`

```js demo
export const simpleToast = () => {
  const durationRef = createRef();
  const textRef = createRef();
  return html`
    <wa-textarea ${ref(textRef)} label="Text" value="foobar"></wa-textarea>
    <wa-input ${ref(durationRef)} label="Duration in seconds" type="number" value="4"></wa-input>
    <button
      @click=${() => {
        toast({
          text: textRef.value.value,
          title: 'I am a toast',
          duration: durationRef.value.value,
        });
      }}
    >
      create Toast
    </button>
  `;
};
```

## Position

The `position` option controls which of the six screen edges/corners the toast stacks into.
Top positions stack new toasts downwards, bottom positions upwards.

```js demo
export const positionToast = () => {
  return html`
    <button @click=${() => toast({ text: 'foobar' })}>Toast</button>
    <button @click=${() => toast({ text: 'foobar', position: 'top-start' })}>
      Toast top-start
    </button>
    <button @click=${() => toast({ text: 'foobar', position: 'top-end' })}>Toast top-end</button>
    <button @click=${() => toast({ text: 'foobar', position: 'bottom-center' })}>
      Toast bottom-center
    </button>
    <button @click=${() => toast({ text: 'foobar', position: 'bottom-start' })}>
      Toast bottom-start
    </button>
    <button @click=${() => toast({ text: 'foobar', position: 'bottom-end' })}>
      Toast bottom-end
    </button>
  `;
};
```

## Variant

there are currently 5 variants of the toast: `brand`, `neutral`, `success`, `warning` and `danger`. these stem from the webAwesome theme.

```js demo
export const variantToast = () => {
  return html`
    <button @click=${() => toast({ text: 'foobar', variant: 'brand' })}>brand Toast</button>
    <button @click=${() => toast({ text: 'foobar', variant: 'neutral' })}>neutral Toast</button>
    <button @click=${() => toast({ text: 'foobar', variant: 'success' })}>success Toast</button>
    <button @click=${() => toast({ text: 'foobar', variant: 'warning' })}>warning Toast</button>
    <button @click=${() => toast({ text: 'foobar', variant: 'danger' })}>danger Toast</button>
  `;
};
```

## Appearance

there are 5 different appearances of each variant as well, also stemming from WebAwesome: `accent`, `filled`, `outlined`, `plain` and `filled-outlined`;

```js demo
export const appearanceToast = () => {
  return html`
    <button @click=${() => toast({ text: 'foobar', appearance: 'accent' })}>accent Toast</button>
    <button @click=${() => toast({ text: 'foobar', appearance: 'filled-outlined' })}>
      filled-outlined Toast
    </button>
    <button @click=${() => toast({ text: 'foobar', appearance: 'filled' })}>filled Toast</button>
    <button @click=${() => toast({ text: 'foobar', appearance: 'outlined' })}>
      outlined Toast
    </button>
    <button @click=${() => toast({ text: 'foobar', appearance: 'plain' })}>plain Toast</button>
  `;
};
```

## Custom Icon

you can also submit your own icon as well via the the icon parameter:

```js demo
export const customIconToast = () => {
  return html`
    <button @click=${() => toast({ text: 'foobar', icon: 'chat-left-text' })}>
      custom icon Toast
    </button>
  `;
};
```

## Remove dismissible button

there's also an option to make the toast to not be able to be dismissed

```js demo
export const removeDismissibleToast = () => {
  return html`
    <button @click=${() => toast({ text: 'foobar', dismissible: false })}>non dismissible</button>
  `;
};
```

## API

### `toast(options)`

Creates a toast, appends it to the matching position container and returns the
`owc-toast-component` element (e.g. to listen for its `removed` event or to call
`remove()` yourself).

| Option        | Type                                                                                            | Default             | Description                                                            |
| ------------- | ----------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------- |
| `text`        | `string`                                                                                        | `''`                | The message; `\n` renders as line breaks.                              |
| `title`       | `string`                                                                                        | `''`                | Bold title above the text.                                             |
| `variant`     | `'brand' \| 'neutral' \| 'success' \| 'warning' \| 'danger'`                                    | `'brand'`           | Color scheme; also picks the default icon.                             |
| `appearance`  | `'accent' \| 'filled' \| 'outlined' \| 'plain' \| 'filled-outlined'`                            | `'filled-outlined'` | Visual style of the callout.                                           |
| `duration`    | `number`                                                                                        | `4`                 | Seconds until the toast removes itself. Hovering pauses the countdown. |
| `icon`        | `string`                                                                                        | variant icon        | Icon name, overrides the variant default.                              |
| `position`    | `'top-center' \| 'top-start' \| 'top-end' \| 'bottom-center' \| 'bottom-start' \| 'bottom-end'` | `'top-center'`      | Where the toast stacks on screen.                                      |
| `dismissible` | `boolean`                                                                                       | `true`              | Show an ✕ button to close the toast early.                             |

### `owc-toast-component`

| Member     | Description                                                                         |
| ---------- | ----------------------------------------------------------------------------------- |
| `remove()` | Fades the toast out, fires `removed`, and detaches it. Safe to call multiple times. |
| `progress` | Remaining time in percent (100 → 0).                                                |
| `removed`  | Event fired once the toast has been removed (after the fade-out).                   |

The element pauses its countdown on `mouseenter` and resumes on `mouseleave`. When the last
toast of a position is removed, its container is cleaned up automatically.
