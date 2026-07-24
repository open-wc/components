# Compose Email

`<owc-compose-email>` is the bulk-email composer: a recipient list with
good/bad status tags, the [template editor](../template-editor/README.md)
(subject + body with `{client.*}`/`{user.*}`/`{default.*}` variables, MJML or
plain HTML), per-recipient preview, scheduled sending, and draft/send actions
wired to your `sendMail` transport.

## Usage

```js
import '@open-wc/components/define/owc-compose-email.js';
```

```js
html`<owc-compose-email
  .recipientList=${clients}
  .recipientIsGood=${client => (client.bounced ? { good: false, reason: 'bounced' } : { good: true })}
  .templates=${templates}
  .sendMail=${async ({ draft, recipientList, generateMailFromTo }) => {
    for (const to of recipientList) await api.send(generateMailFromTo(to), { draft });
    return { status: 'success', draft };
  }}
></owc-compose-email>`;
```

## Features

- Recipient status: external check + template-tag filter (pure logic in
  [recipientHelpers.js](./recipientHelpers.js)); bad recipients show as
  danger tags and are excluded from sending
- Auto-collapsing recipient summary for large lists (`formatterMode`)
- Per-recipient preview with wrap-around navigation
- Scheduled sending (past dates rejected), draft saving, 2s send lockout
- [OwcEmailTagRadioGroup.js](./OwcEmailTagRadioGroup.js) - the tag selector
  used inside the template editors

## Docs & demos

See [OwcComposeEmail.rocket.md](./OwcComposeEmail.rocket.md) for live demos
and the API reference; published on the docs site under `/compose-email/`.

## Files

- [OwcComposeEmail.js](./OwcComposeEmail.js) - the component
- [recipientHelpers.js](./recipientHelpers.js) - pure recipient-status/formatter logic
- [OwcComposeEmail.test-browser.js](./OwcComposeEmail.test-browser.js) - browser tests (`npx web-test-runner src/compose-email/OwcComposeEmail.test-browser.js`)
- [recipientHelpers.test.js](./recipientHelpers.test.js) - logic tests (`node --test src/compose-email/recipientHelpers.test.js`)
