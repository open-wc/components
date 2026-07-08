```js server
export const config = {
  path: '/detail-card',
  title: 'Detail Card',
  menu: {
    parent: 'data',
    order: 80,
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
      <div><strong>Rechtsschutz Versicherung</strong></div>
      <div>Generali</div>
    </div>
    <div slot="detail">
      <div><strong>EUR 15</strong></div>
      <div>im Quartal</div>
    </div>
    <div>
      Der gesamte Eintrag ist klickbar. Dieser Bereich kommt aus dem Default-Slot und wird unter der
      Summary aufgeklappt angezeigt.
    </div>
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
      <div><strong>Rueckfrage erforderlich</strong></div>
      <div>Generali</div>
    </div>
    <div slot="detail">
      <div><strong>Offen</strong></div>
      <div>Aktion noetig</div>
    </div>
    <div>Bitte pruefe die fehlende Information im Warenkorb, bevor du fortfaehrst.</div>
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
      <div><strong>Haushalt Versicherung</strong></div>
      <div>Aktiv seit 01.01.2026</div>
    </div>
    <div slot="detail">
      <div><strong>Aktiv</strong></div>
      <div>Keine Aktion</div>
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
      <div><strong>Zahlungsweise geaendert</strong></div>
      <div>Die naechste Abbuchung erfolgt monatlich.</div>
    </div>
    <div>
      Diese Variante nutzt nur die Textspalte. Die reservierten Bereiche fuer Icon und Detail werden
      automatisch ausgeblendet.
    </div>
  </owc-detail-card>
`;
```

## Custom suffix

The `suffix` slot replaces the default chevron. Use it when the row needs a custom affordance or a
status icon in the trailing position. The slotted suffix still sits in the clickable summary area.

```js demo
export const customSuffixDetailCard = () => html`
  <owc-detail-card accent-color="var(--wa-color-warning-fill-loud)">
    <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
    <div slot="text">
      <div><strong>Dokument fehlt</strong></div>
      <div>Polizze kann noch nicht abgeschlossen werden</div>
    </div>
    <div slot="detail">
      <div><strong>Ausstehend</strong></div>
      <div>Heute pruefen</div>
    </div>
    <wa-icon slot="suffix" name="circle-exclamation"></wa-icon>
    <div>
      Lade das fehlende Dokument hoch oder markiere den Eintrag als nicht relevant, bevor du den
      Abschluss fortsetzt.
    </div>
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
    <owc-detail-card accent-color="var(--wa-color-success-fill-loud)">
      <wa-icon slot="icon" name="circle-check"></wa-icon>
      <div slot="text">
        <div><strong>Kfz Versicherung</strong></div>
        <div>UNIQA</div>
      </div>
      <div slot="detail">
        <div><strong>EUR 48</strong></div>
        <div>monatlich</div>
      </div>
      <div>Vertrag laeuft bis 31.12.2026 und verlaengert sich automatisch.</div>
    </owc-detail-card>

    <owc-detail-card accent-color="var(--wa-color-warning-fill-loud)" open>
      <wa-icon slot="icon" name="clock"></wa-icon>
      <div slot="text">
        <div><strong>Lebensversicherung</strong></div>
        <div>Generali</div>
      </div>
      <div slot="detail">
        <div><strong>In Pruefung</strong></div>
        <div>2 offene Punkte</div>
      </div>
      <div>
        Die Gesundheitsfragen wurden beantwortet. Eine Rueckmeldung zur Risikopruefung ist noch
        offen.
      </div>
    </owc-detail-card>

    <owc-detail-card accent-color="var(--wa-color-danger-fill-loud)">
      <wa-icon slot="icon" name="circle-xmark"></wa-icon>
      <div slot="text">
        <div><strong>Reiseversicherung</strong></div>
        <div>Abgelaufen</div>
      </div>
      <div slot="detail">
        <div><strong>Keine Deckung</strong></div>
        <div>seit 15.06.2026</div>
      </div>
      <div>
        Der Vertrag ist beendet und kann nicht mehr fuer neue Schadensfaelle genutzt werden.
      </div>
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
