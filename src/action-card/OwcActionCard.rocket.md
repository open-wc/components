```js server
export const config = {
  path: '/layout/action-card',
  title: 'Action Card',
  menu: { parent: '/layout', order: 55, iconName: 'card-heading' },
};
import { atlasDocLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
import { docsData } from '@open-wc/components/docsData.js';
export const components = atlasDocComponents;
export const layout = pageData => atlasDocLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import '@open-wc/components/action-card/define/owc-action-card.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
```

# Action Card

A leading visual beside a heading and description, followed by optional full-width actions.
The module owns this repeated structure and spacing. Consumers supply semantic headings and
links or button controls, retaining their navigation, disabled, loading and event behavior.

Use Web Awesome's `wa-callout` for an icon with message content, including a heading. Use
ActionCard when actions need a separate row spanning the full width beneath both the icon and text.
In a callout, controls in the message stay in the text column beside the icon. Neither component
adds alert/status semantics or action behavior.

## With an action

```js demo
export const withAction = () => html`
  <owc-action-card>
    <wa-icon
      slot="icon"
      src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/plus-lg.svg"
      style="width: 1.5rem; height: 1.5rem"
      aria-hidden="true"
    ></wa-icon>
    <h3 slot="heading">Keep your accounts together</h3>
    <p>Add an existing account to your overview.</p>
    <wa-button slot="actions" variant="brand" appearance="outlined">Add account</wa-button>
  </owc-action-card>
`;
```

For navigation, put an anchor or your existing link control in `actions`. The card has no overlay
link or extra tab stop. Attach click handlers to the action itself.

This example uses a Web Awesome button. ActionCard supplies the layout; slotted controls supply
their own appearance. Native buttons and links retain the styles provided by your application.

## Information only

```js demo
export const informationOnly = () => html`
  <owc-action-card>
    <wa-icon
      slot="icon"
      src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/info-circle.svg"
      style="width: 1.5rem; height: 1.5rem"
      aria-hidden="true"
    ></wa-icon>
    <h3 slot="heading">About this estimate</h3>
    <p>This estimate uses the assumptions shown above. Actual results may vary.</p>
  </owc-action-card>
`;
```

Omit unused slots to remove their space. Adding or removing slotted content updates the layout.
This example keeps the card layout when an action is absent. For an independent informational
notice, use `wa-callout` directly.

## Interface

Import the class from `@open-wc/components/action-card/OwcActionCard.js`, or register `owc-action-card` with
`@open-wc/components/action-card/define/owc-action-card.js`. There are no action, navigation or appearance
properties to forward.

| Slot      | Content                                                              |
| --------- | -------------------------------------------------------------------- |
| `icon`    | Optional visual in a 24px container, centered beside the text.       |
| `heading` | Optional heading; choose its level for the surrounding document.     |
| Default   | Description or other text content.                                   |
| `actions` | Optional links/buttons; each direct child fills the available width. |

Decorative icons need `aria-hidden="true"` or empty image alt text. Meaningful visuals need an
accessible equivalent. The card adds no alert/status semantics or live announcements.

The `base`, `content`, `icon`, `text`, `heading`, `body` and `actions` CSS parts expose the layout.
Set `--owc-action-card-background` and `--owc-action-card-border` for the surface. Typography,
spacing and radius use inherited Web Awesome tokens with standalone fallbacks. Slotted headings
default to the card's font size and heading weight; consumer styles can override them. For multiple
paragraphs or nested action groups, consumers own their internal spacing.
