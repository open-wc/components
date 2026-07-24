# Template Editor

`<owc-template-editor>` edits email/text templates with
`{client.*}`/`{user.*}`/`{default.*}` variables, template selection, variants,
multi-step sequences, subject lines, tags, and attachments. It orchestrates
two concrete editors and can switch between them at runtime:

| Element                   | Editor                                                    | Source                                                   |
| ------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `owc-template-editor`     | Orchestrator (renders one of the two below)               | [OwcTemplateEditor.js](./OwcTemplateEditor.js)           |
| `owc-template-editor-old` | Classic textarea editor (default)                         | [OwcTemplateEditorOld.js](./OwcTemplateEditorOld.js)     |
| `owc-template-editor-new` | Visual GrapesJS/MJML editor (`owc-grape-template-editor`) | [OwcGrapeTemplateEditor.js](./OwcGrapeTemplateEditor.js) |

Used by [`owc-compose-email`](../compose-email/README.md) as its editing
surface.

## Usage

```js
import '@open-wc/components/define/owc-template-editor.js';
```

```js
html`<owc-template-editor
  showSubject
  .templates=${{
    greeting: {
      name: 'Greeting',
      template: [{ default: { subject: 'Hello {client.name}', html: 'Hi {client.name}!' } }],
      options: { value: {} },
    },
  }}
></owc-template-editor>`;
```

```js
const { subject, html } = editor.generateValueForData({ client }, client);
```

## Files

- [OwcTemplateEditor.js](./OwcTemplateEditor.js) - the orchestrator
- [generateValueForData.js](./generateValueForData.js) - pure variable replacement, variant selection, MJML compilation glue
- [OwcTemplateEditorTypes.ts](./OwcTemplateEditorTypes.ts) - public `TemplateRecord` types
- [OwcTemplateEditor.test-browser.js](./OwcTemplateEditor.test-browser.js) - browser tests (`npx web-test-runner src/template-editor/OwcTemplateEditor.test-browser.js`)
- [generateValueForData.test.js](./generateValueForData.test.js) - logic tests (`node --test src/template-editor/generateValueForData.test.js`)

See [OwcTemplateEditor.rocket.md](./OwcTemplateEditor.rocket.md) for live
demos and the API reference; published on the docs site under
`/template-editor/`.
