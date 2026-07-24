import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { compressStringToBase64 } from './compressStringToBase64.js';
import { b64decode, decompressStringFromBase64 } from './decompressStringFromBase64.js';

describe('compressStringToBase64 / decompressStringFromBase64', () => {
  it('01: round-trips a string', async () => {
    const compressed = await compressStringToBase64('hello world');
    assert.equal(await decompressStringFromBase64(compressed), 'hello world');
  });

  it('02: round-trips unicode (umlauts, emoji, CJK)', async () => {
    const text = 'Größe 42 – 🎉 日本語';
    assert.equal(await decompressStringFromBase64(await compressStringToBase64(text)), text);
  });

  it('03: round-trips the empty string', async () => {
    assert.equal(await decompressStringFromBase64(await compressStringToBase64('')), '');
  });

  it('04: produces valid base64 of gzip data', async () => {
    const compressed = await compressStringToBase64('foo');
    const bytes = b64decode(compressed);
    // gzip magic bytes
    assert.equal(bytes[0], 0x1f);
    assert.equal(bytes[1], 0x8b);
  });

  it('05: compresses repetitive text well below its input size', async () => {
    const text = 'foo'.repeat(1000);
    const compressed = await compressStringToBase64(text);
    assert.ok(compressed.length < text.length / 10, `got ${compressed.length} chars`);
  });

  it('06: rejects strings that are not base64 or not gzip', async () => {
    await assert.rejects(() => decompressStringFromBase64('not base64!!!'));
    await assert.rejects(() => decompressStringFromBase64(btoa('plain, not gzip')));
  });
});

describe('b64decode', () => {
  it('01: decodes base64 into the original bytes', () => {
    assert.deepEqual(Array.from(b64decode(btoa('abc'))), [97, 98, 99]);
  });
});
