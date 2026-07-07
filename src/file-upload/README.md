# File Upload

`<owc-file-upload>` is a drop area for selecting files via drag & drop,
click, or keyboard. Selected files render as removable cards with a
customizable renderer.

## Usage

```js
import '@open-wc/components/define/owc-file-upload.js';
```

```js
html`<owc-file-upload @files-selected=${ev => console.log(ev.target.files)}></owc-file-upload>`;
```

## Features

- Drag & drop, click, and keyboard (Enter/Space) selection with a visual
  dragging state
- Duplicates (same name, size, and type) are skipped; single mode replaces
  the selection (pure logic in [fileHelpers.js](./fileHelpers.js))
- The `files` array is replaced, never mutated - safe to pass shared arrays
  by reference
- `files-selected` fires on every change; `detail.files` lists the newly
  added files
- Customizable card content via `renderCardContent(file, removeFile)` and a
  configurable empty-state `label`

## Docs & demos

See [OwcFileUpload.rocket.md](./OwcFileUpload.rocket.md) for live demos and
the full API reference; published on the docs site under `/file-upload/`.

## Files

- [OwcFileUpload.js](./OwcFileUpload.js) - the component
- [fileHelpers.js](./fileHelpers.js) - pure dedup/add logic
- [OwcFileUpload.test-browser.js](./OwcFileUpload.test-browser.js) - browser tests (`npx web-test-runner src/file-upload/OwcFileUpload.test-browser.js`)
- [fileHelpers.test.js](./fileHelpers.test.js) - logic tests (`node --test src/file-upload/fileHelpers.test.js`)
