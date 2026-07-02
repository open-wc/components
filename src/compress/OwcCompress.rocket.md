```js server
export const config = {
  path: '/components/compress',
  title: 'Compress',
  menu: {
    order: 30,
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@finum/data-table/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import { compressStringToBase64 } from '@finum/data-table/compress.js';
import { decompressStringFromBase64 } from '@finum/data-table/compress.js';
import '@finum/data-table/define/owc-card.js';
```

# Compress and decompress

## CompressStringToBase64

The async function `compressStringToBase64` can be used to compress a text by means of
GZIP algorithm and encode the result as a Base64 string, enhancing its suitability for transfer and storage.

```js demo
export const demoCompressStringToBase64 = async () => {
  const output = await compressStringToBase64('foo'.repeat(100));
  const control = await decompressStringFromBase64(output);
  return html`
    <div><span style="font-weight: bold;">Pure data:</span> ${'foo'.repeat(100)}</div>
    <div><span style="font-weight: bold;">Compressed:</span> ${output}</div>
  `;
};
```

## DecompressStringFromBase64

This function decodes a Base64-encoded string into a byte array, decompresses the GZIP data, and converts the resulting data into a readable string.

```js demo
export const demodecompressStringFromBase64 = async () => {
  const output = await compressStringToBase64('foo'.repeat(100));
  const control = await decompressStringFromBase64(output);

  return html`
    <div"><span style="font-weight: bold;">Compressed:</span> ${output}</div>
    <div><span style="font-weight: bold;">Decompressed:</span>  ${control}</div>
  `;
};
```
