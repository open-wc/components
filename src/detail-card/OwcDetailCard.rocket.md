```js server
export const config = {
  path: '/data/detail-card',
  title: 'Detail Card',
  menu: {
    parent: '/data',
    order: 50,
    iconName: 'postcard',
  },
};
import { atlasDocLayout as docLayout } from '@rocket/js/layouts/atlasDoc.js';
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-detail-card.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
```

# Detail Card

A compact expandable card-like component with an accent rail, a leading icon slot, two summary slots, and a default slot for the expanded body.

Use `owc-detail-card` when a dense list or overview needs to show the most important facts first
and let users expand a row for supporting detail. The whole summary row toggles the body. Filled
slots are detected automatically, so the layout collapses cleanly when you omit the icon, detail
column, or body content.

## Basic expanded card

This is the common shape: an icon, a primary text column, a right-aligned summary value, and an
expanded body. Set `open` when the card should render expanded initially; the `open` property stays
in sync when the user opens or closes the card.

```js demo
export const simpleDetailCard = () => html`
  <owc-detail-card accent-color="var(--wa-color-success-fill-loud)" open>
    <wa-icon slot="icon" name="check-circle"></wa-icon>
    <div slot="text">
      <div><strong>I am a basic card</strong></div>
      <div>lorem ipsum</div>
    </div>
    <div slot="detail">
      <div><strong>Having a nice text over here</strong></div>
      <div>click the arrow</div>
    </div>
    <div>I am an expandable text, that contains some info</div>
  </owc-detail-card>
`;
```

## Collapsed card

Cards are collapsed by default. Use this state for secondary information, warnings, follow-up items,
or any record where the summary should be scannable before the user decides to expand it.

```js demo
export const neutralDetailCard = () => html`
  <owc-detail-card accent-color="#D67A1F">
    <wa-icon slot="icon" name="info-circle"></wa-icon>
    <div slot="text">
      <div><strong>Something important</strong></div>
      <div>Check me out</div>
    </div>
    <div slot="detail">
      <div><strong>Open</strong></div>
      <div>actions required</div>
    </div>
    <div>A detailed description why i am orange</div>
  </owc-detail-card>
`;
```

## Summary-only card

When no default-slot content is provided, the body area is removed. This makes the component useful
as a compact status row while keeping the same accent rail, icon, text, detail, and suffix layout.

```js demo
export const summaryOnlyDetailCard = () => html`
  <owc-detail-card accent-color="var(--wa-color-brand-fill-loud)">
    <wa-icon slot="icon" name="shield-check"></wa-icon>
    <div slot="text">
      <div><strong>Nothing to expand here</strong></div>
      <div>it's all chill here</div>
    </div>
    <div slot="detail">
      <div><strong>closed</strong></div>
    </div>
  </owc-detail-card>
`;
```

## Minimal layout

The icon and detail slots are optional. If you only need a label and expandable supporting text, put
the summary copy in `slot="text"` and the longer copy in the default slot.

```js demo
export const textOnlyDetailCard = () => html`
  <owc-detail-card>
    <div slot="text">
      <div><strong>lorem Ipsum</strong></div>
    </div>
    <div>This card is way more simple</div>
  </owc-detail-card>
`;
```

## Custom suffix

The `suffix` slot replaces the default chevron. Use it when the row needs a custom affordance or a
status icon in the trailing position. The slotted suffix still sits in the clickable summary area.

```js demo
export const customSuffixDetailCard = () => html`
  <owc-detail-card accent-color="var(--wa-color-warning-fill-loud)">
    <wa-icon slot="icon" name="exclamation-triangle"></wa-icon>
    <div slot="text">
      <div><strong>Customizeable all the way</strong></div>
      <div>use any symbol you like</div>
    </div>
    <div slot="detail">
      <div><strong>a new icon</strong></div>
      <div>how refreshing</div>
    </div>
    <wa-icon slot="suffix" name="exclamation-circle"></wa-icon>
    <div>lorem ipsum maximus</div>
  </owc-detail-card>
`;
```

## Card list

Multiple cards can be stacked to build a small record list. Give each card an accent color that
matches the record state, and keep the summary columns consistent so users can compare the rows
quickly.

```js demo
export const detailCardList = () => html`
  <div style="display: grid; gap: 0.75rem;">
    <owc-detail-card accent-color="var(--wa-color-danger-fill-loud)">
      <div slot="text">
        <div><strong>Huey</strong></div>
      </div>
      <div slot="detail">
        <div><strong>brother one</strong></div>
      </div>
      <div>I am Huey</div>
    </owc-detail-card>

    <owc-detail-card accent-color="var(--wa-color-brand-fill-loud)" open>
      <div slot="text">
        <div><strong>Dewey</strong></div>
      </div>
      <div slot="detail">
        <div><strong>brother two</strong></div>
      </div>
      <div>I am Dewey</div>
    </owc-detail-card>

    <owc-detail-card accent-color="var(--wa-color-success-fill-loud)">
      <div slot="text">
        <div><strong>Louie</strong></div>
      </div>
      <div slot="detail">
        <div><strong>brother three</strong></div>
      </div>
      <div>And i am Louie</div>
    </owc-detail-card>
  </div>
`;
```

## API

### Attributes & properties

| Property                                  | Type      | Default | Description                                                                                               |
| ----------------------------------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `accent-color`                            | `string`  | `''`    | The accent rail color. Internally this sets `--owc-detail-card-accent-color` on the wrapped `wa-details`. |
| `open`                                    | `boolean` | `false` | Expands the detail content; reflected and kept in sync when the user toggles the card.                    |
| `with-icon` / `with-detail` / `with-body` | `boolean` | `false` | Reflected layout state; set automatically when the matching slot is filled. Do not set these manually.    |

### Slots

| Slot        | Description                                         |
| ----------- | --------------------------------------------------- |
| _(default)_ | Expandable detail content below the summary row.    |
| `icon`      | The leading icon/visual.                            |
| `text`      | The primary text column.                            |
| `detail`    | The right-aligned summary column (e.g. price).      |
| `suffix`    | Trailing indicator; defaults to a rotating chevron. |

### CSS custom properties

| Property                         | Default                           | Description        |
| -------------------------------- | --------------------------------- | ------------------ |
| `--owc-detail-card-accent-color` | `var(--wa-color-brand-fill-loud)` | Accent rail color. |
| `--owc-detail-card-accent-width` | `0.5625rem`                       | Accent rail width. |
