# Compress

Pure helpers to gzip a string into a base64 payload and back - handy for
stuffing state into URLs or storage. No component, just functions; they work
in the browser and in Node (18+) via `CompressionStream`.

## Usage

```js
import {
  compressStringToBase64,
  decompressStringFromBase64,
} from '@open-wc/components/compress.js';

const packed = await compressStringToBase64(JSON.stringify(state));
const state = JSON.parse(await decompressStringFromBase64(packed));
```

`decompressStringFromBase64` rejects on input that is not valid
base64-encoded gzip data - without leaking unhandled promise rejections.

## Docs & demos

See [OwcCompress.rocket.md](./OwcCompress.rocket.md); published on the docs
site under `/compress/`.

## Files

- [compressStringToBase64.js](./compressStringToBase64.js) / [decompressStringFromBase64.js](./decompressStringFromBase64.js) - the helpers
- [compress.test.js](./compress.test.js) - logic tests (`node --test src/compress/compress.test.js`)
