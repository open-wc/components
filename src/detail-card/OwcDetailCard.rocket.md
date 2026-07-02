```js server
export const config = {
  path: '/components/detail-card',
  title: 'Detail Card',
  menu: {
    order: 21,
  },
};
import { atlasDocLayout as docLayout } from '@rocket/js/layouts/atlasDoc.js';
import { docsData } from '@finum/data-table/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import '@finum/data-table/define/owc-detail-card.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
```

# Detail Card

A compact expandable card-like component with an accent rail, a leading icon slot, two summary slots, and a default slot for the expanded body.

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

## Neutral example

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
