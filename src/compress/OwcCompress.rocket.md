```js server
export const config = {
  path: '/utilities/compress',
  title: 'Compress',
  menu: {
    parent: '/utilities',
    order: 50,
    linkText: 'Compress',
    iconName: 'file-zip',
  },
};

import { atlasDocLayout as docLayout, atlasDocComponents } from '@rocket/js/layouts/atlasDoc.js';
export const components = atlasDocComponents;
import { docsData } from '@open-wc/components/docsData.js';

export const layout = pageData => docLayout(pageData, docsData);
```

```js client
import { html } from 'lit';

import { compressStringToBase64 } from '@open-wc/components/compress.js';
import { decompressStringFromBase64 } from '@open-wc/components/compress.js';
import '@open-wc/components/define/owc-card.js';
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
    <div><span style="font-weight: bold;">Compressed:</span> ${output}</div>
    <div><span style="font-weight: bold;">Decompressed:</span> ${control}</div>
  `;
};
```

## API

Importable from `@open-wc/components/compress.js`. Both functions run in the browser and in
Node (18+) - they use the platform's `CompressionStream`/`DecompressionStream`.

| Function                           | Signature                     | Description                                                                |
| ---------------------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| `compressStringToBase64(text)`     | `(string) => Promise<string>` | Gzips the text and returns it base64-encoded.                              |
| `decompressStringFromBase64(text)` | `(string) => Promise<string>` | Reverses it; rejects when the input is not valid base64-encoded gzip data. |
