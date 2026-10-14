```js server
export const config = {
  path: '/utilities/file-upload',
  title: 'File Upload',
  menu: {
    parent: '/utilities',
    order: 30,
    iconName: 'cloud-upload',
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import '@open-wc/components/define/owc-file-upload.js';
```

# File Upload

A drop area for selecting files via drag & drop, click, or keyboard (Enter/Space). Selected
files render as removable cards; duplicates (same name, size, and type) are skipped
automatically.

```js demo
export const fileUpload = () => html`
  <owc-file-upload .files=${[new File(['demo'], 'foo.png')]}></owc-file-upload>
`;
```

## Single file

With `multiple` set to `false` a new selection replaces the previous one.

```js demo
export const singleFile = () => html`<owc-file-upload .multiple=${false}></owc-file-upload>`;
```

## File size limit

Set `maxFileSize` (or `max-file-size`) to a per-file limit in bytes. The default is unlimited.
Files exactly at the limit are accepted. Oversized files selected through the picker or dropped
onto the component are excluded and reported in a localized inline alert. Other valid files in
the same selection are still added. A rejected replacement in single-file mode preserves the
previous selection.

```js demo
export const limitedFileUpload = () => html`
  <owc-file-upload .maxFileSize=${4_000_000}></owc-file-upload>
`;
```

`files-rejected` bubbles and crosses shadow boundaries. Its `detail.rejections` is an array of
`{ file, reason: 'file-too-large', maxFileSize }`. For mixed selections, `files-selected` fires
first with the accepted additions, followed by `files-rejected`. If all files are rejected,
only `files-rejected` fires. Errors clear on the next selection or removal.

In single-file mode only the first incoming file is considered. Direct assignments to `files`
are not validated; consumers should also validate before sending a request. Choose limits
appropriate to your endpoint, allowing for request metadata and encoding overhead.

## Custom card renderer

`renderCardContent(file, removeFile)` renders the inside of each file card. Call the passed
`removeFile` to offer removal.

```js demo
export const fileUploadRenderer = () => html`
  <owc-file-upload
    .files=${[new File(['demo'], 'foo.png')]}
    .renderCardContent=${(file, removeFile) => {
      return html`<span slot="header">${file.name}</span> ${file.size} bytes`;
    }}
  ></owc-file-upload>
`;
```

## Selected event

`files-selected` fires after every change. `ev.detail.files` lists the files that were just
added (empty on removal); read the full current list from `ev.target.files`.

```js demo
export const upload = () => html`
  <owc-file-upload
    .files=${[new File(['demo'], 'foo.png')]}
    .renderCardContent=${(file, removeFile) => {
      return html`${file.id || file.name}`;
    }}
    @files-selected=${ev => {
      const files = ev.target.files;
      for (const file of files) {
        if (!file.id) {
          file.id = crypto.randomUUID();
        }
      }
    }}
  ></owc-file-upload>
`;
```

## API

### Attributes & properties

| Property            | Type                                   | Default                   | Description                                                                   |
| ------------------- | -------------------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `files`             | `File[]`                               | `[]`                      | The selected files. Replaced (not mutated) on every change.                   |
| `multiple`          | `boolean`                              | `true`                    | Allow multiple files; `false` makes a new selection replace the previous one. |
| `maxFileSize`       | `number`                               | `Infinity`                | Maximum bytes per selected file. Attribute: `max-file-size`.                  |
| `renderCardContent` | `(file, removeFile) => TemplateResult` | file name + remove button | Renders the inside of each file card.                                         |
| `dragging`          | `boolean`                              | `false`                   | True while dragging over the drop area; reflected for styling.                |

### Events

| Event            | Description                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `files-selected` | Fired after files are added or removed. `detail.files` lists the newly added files (empty on removal).          |
| `files-rejected` | Fired for oversized selections. `detail.rejections` contains `{ file, reason: 'file-too-large', maxFileSize }`. |
