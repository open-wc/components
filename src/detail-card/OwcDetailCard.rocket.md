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
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
import { docsData } from '@open-wc/components/docsData.js';

export const components = atlasDocComponents;
export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@open-wc/components/define/owc-detail-card.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
```

# Detail Card

A compact expandable card-like component with an optional accent rail, a leading icon slot, two summary slots, and a default slot for the expanded body.

Set `accent-color` to display the accent rail. Without it, the border and rounded corners wrap the entire card. If you previously relied on the default rail, add `accent-color="var(--wa-color-brand-fill-loud)"` to retain it.

Use `owc-detail-card` when a dense list or overview needs to show the most important facts first
and let users expand a row for supporting detail. The whole summary row toggles the body. Filled
slots are detected automatically, so the layout collapses cleanly when you omit the icon, detail
column, or body content.

## Structured summary

Use the optional `heading`, `description`, `value` and `value-description` slots for the repeated
two-column summary. The module owns their stacking, spacing and typography; callers supply
localized values and supporting content. Existing `text` and `detail` slots remain available for
custom layouts and take precedence over the default stacks in their respective columns.

```js demo
export const structuredSummary = () => html`
  <owc-detail-card accent-color="var(--wa-color-warning-fill-loud)">
    <wa-icon
      slot="icon"
      src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/wallet2.svg"
      aria-hidden="true"
    ></wa-icon>
    <span slot="heading">Savings plan</span>
    <span slot="description">Example provider</span>
    <span slot="value">€ 5,000</span>
    <span slot="value-description">Monthly: € 150</span>
    <wa-badge slot="badge" variant="neutral" pill>External plan</wa-badge>
    <p>Supporting information supplied by the application.</p>
  </owc-detail-card>
`;
```

Omit unused fields to remove their space. Keep action controls in the expandable body, so the
summary remains one keyboard-operable disclosure. Status labels, money/date formatting and
domain rules belong to the consumer.

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

When no default-slot content is provided, the card becomes a noninteractive status row with the
same accent rail, icon, text and detail layout. It has no disclosure button or trailing suffix.

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

The `suffix` slot replaces the default chevron on expandable cards. Use it when the row needs a
custom affordance or status icon in the trailing position. It sits in the clickable summary area
and is omitted when the card has no details.

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

## Badge

Use the badge slot to display a neutral status label at the upper-right edge of a card.

```js demo
export const detailCardWithBadge = () => html`
  <owc-detail-card accent-color="var(--wa-color-warning-fill-loud)">
    <wa-icon slot="icon" name="exclamation-triangle"></wa-icon>
    <wa-badge slot="badge" variant="neutral" pill>HEREEEEEEEEEEEEEEEEEEEEE</wa-badge>
    <div slot="text">
      <div><strong>I have a badge</strong></div>
      <div>this is awesome</div>
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

| Property                                  | Type      | Default | Description                                                                                            |
| ----------------------------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `accent-color`                            | `string`  | `''`    | The accent rail color, exposed as `--owc-detail-card-accent-color`.                                    |
| `open`                                    | `boolean` | `false` | Expands the detail content; reflected and kept in sync when the user toggles the card.                 |
| `with-icon` / `with-detail` / `with-body` | `boolean` | `false` | Reflected layout state; set automatically when the matching slot is filled. Do not set these manually. |

### Slots

| Slot                | Description                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| _(default)_         | Expandable detail content below the summary row.                        |
| `icon`              | The leading icon/visual.                                                |
| `text`              | Custom primary text column; overrides heading and description.          |
| `detail`            | Custom value column; overrides value and value-description.             |
| `heading`           | Primary text in the default summary stack.                              |
| `description`       | Supporting text below the heading.                                      |
| `value`             | Primary value in the right-aligned stack.                               |
| `value-description` | Supporting text below the value.                                        |
| `badge`             | Optional badge above the summary's trailing edge.                       |
| `suffix`            | Trailing indicator on expandable cards; defaults to a rotating chevron. |

### CSS parts

`summary` exposes the interactive or static summary container; `trigger` exposes the Web Awesome header
on expandable cards. `content`, `icon`, `text`, `detail`, `suffix`, `badge` and `body` expose the layout areas.
`heading`, `description`, `value` and `value-description` expose the default stack slots. Use
these parts for application-specific spacing and presentation instead of duplicating disclosure
structure or reaching into the shadow root.

### CSS custom properties

| Property                                      | Default                           | Description                                      |
| --------------------------------------------- | --------------------------------- | ------------------------------------------------ |
| `--owc-detail-card-accent-color`              | `var(--wa-color-brand-fill-loud)` | Accent rail color.                               |
| `--owc-detail-card-accent-width`              | `0.5625rem`                       | Accent rail width.                               |
| `--owc-detail-card-background`                | `var(--wa-color-surface-default)` | Summary and body background.                     |
| `--owc-detail-card-border-width`              | `1.5px`                           | Summary and body border width.                   |
| `--owc-detail-card-border-style`              | `solid`                           | Summary and body border style.                   |
| `--owc-detail-card-border-color`              | `var(--wa-color-surface-border)`  | Summary and body border color.                   |
| `--owc-detail-card-border`                    | Composed border tokens            | Shorthand override for the complete card border. |
| `--owc-detail-card-border-inline-start-width` | `0`                               | Leading border width beside the accent rail.     |
| `--owc-detail-card-border-radius`             | `0.5rem`                          | Card corner radius.                              |
| `--owc-detail-card-shadow`                    | `var(--wa-shadow-s)`              | Summary-row shadow.                              |

## Public disclosure contract

Import `@open-wc/components/define/owc-detail-card.js` or the class from
`@open-wc/components/OwcDetailCard.js`. `heading-level="3"` configures the
summary heading (valid levels 1–6; default 3). Web Awesome's `wa-details` supplies
the disclosure control when default-slot details exist. Keep all summary slots noninteractive;
place links and actions in the default panel slot.

Rows expand independently. Applications can assign `open`; `card-toggle` forwards
Web Awesome's `wa-show` and `wa-hide` notifications with `event.detail.open` and bubbles
across shadow boundaries. Notifications follow Web Awesome's update timing, rather
than firing synchronously from property assignments. Rapid assignments before rendering
can coalesce into one transition. Filter `event.target` when listening above nested cards;
nested events retain their own target.

`card.focus({ preventScroll: true })` focuses the public trigger. Closing a panel
that contains focus first restores its summary focus. Hidden panels retain drafts
and nested controls but leave keyboard and accessibility navigation. The application
owns focus recovery when removing focused content or switching between static and
expandable presentation, including when it removes the entire card.

Without default-slot content the summary is static: no button, chevron, tab stop,
expanded state or control relationship. `focus()` can still focus its static heading
for explicit navigation. Adding/removing details updates this mode while preserving
caller-owned light-DOM content.

`await card.show()` delegates to Web Awesome's `show()` method. Use it to open a closed
card before measuring or scrolling to expanded content. As with Web Awesome, calling
it on an already-open card returns immediately, including during an ongoing animation.
`updateComplete` follows Lit's normal rendering lifecycle and does not wait for animation.

Web Awesome owns keyboard activation, disclosure semantics and expansion animation.
DetailCard adds the summary layout, public focus, static mode, transition notifications
and focus recovery. The wrapper supplies Web Awesome 3.14's missing header ID for panel
labelling and uses a named group instead of a landmark for each expanded card.
Use public `open`, `show()`, `focus()`, slots, parts and `card-toggle`
rather than inspecting internal shadow roots. Expansion and the decorative chevron
respect reduced motion.
