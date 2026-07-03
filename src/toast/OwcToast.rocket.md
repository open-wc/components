```js server
export const config = {
  path: '/components/toast',
  title: 'Toast',
  menu: {
    order: 30,
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

## Simple toast

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
      Toast
    </button>
  `;
};
```

## Positon

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

```js demo
export const removeDismissibleToast = () => {
  return html`
    <button @click=${() => toast({ text: 'foobar', dismissible: false })}>non dismissible</button>
  `;
};
```
