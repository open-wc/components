# Lit Helpers

Small helpers around lit templates. Public entry point:
`@open-wc/components/lit/litHtmlToString.js`.

## `litHtmlToString(templateResult)`

Renders a lit `TemplateResult` to a plain HTML string - including nested
templates, arrays, and directives that resolve to primitives. Useful when a
lit-built snippet has to leave the lit world, e.g. for emails, exports, or
`innerHTML` payloads.

```js
import { litHtmlToString } from '@open-wc/components/lit/litHtmlToString.js';

const htmlString = litHtmlToString(html`<b>${name}</b>`);
```

## Files

- [litHtmlToString.js](./litHtmlToString.js) - the helper
- [litHtmlToString.test.js](./litHtmlToString.test.js) - logic tests (`node --test src/lit-helpers/litHtmlToString.test.js`)
