```js server
export const config = {
  path: '/components/file-upload',
  title: 'File Upload',
  menu: {
    order: 40,
  },
};
import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@finum/data-table/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import '@finum/data-table/define/owc-file-upload.js';
```

# File Upload

```js demo
export const fileUpload = () => html`
  <owc-file-upload .files=${[new File([], 'foo.png')]}></owc-file-upload>
`;
```

## Single File

```js demo
export const singleFile = () => html` <owc-file-upload .multiple=${false}></owc-file-upload> `;
```

## Renderer

```js demo
export const fileUploadRenderer = () => html`
  <owc-file-upload
    .files=${[new File([], 'foo.png')]}
    .renderCardContent=${(file, removeFile) => {
      return html`<span slot="header">${file.name}</span> ${file.size}`;
    }}
  ></owc-file-upload>
`;
```

## Selected Event

```js demo
export const upload = () => html`
  <owc-file-upload
    .files=${[new File([], 'foo.png')]}
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
