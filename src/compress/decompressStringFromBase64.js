/**
 * Decompresses a base64 string and returns the uncompressed string
 *
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function decompressStringFromBase64(text) {
  const byteArray = b64decode(text);
  // @ts-ignore will be fixed once we update to the latest TS version
  const cs = new DecompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const arrayBuffer = await new Response(cs.readable).arrayBuffer();
  return new TextDecoder().decode(arrayBuffer);
}

/**
 * @param {string} text
 * @returns {Uint8Array}
 */
export function b64decode(text) {
  const binaryString = atob(text);
  const len = binaryString.length;
  const bytes = new Uint8Array(new ArrayBuffer(len));
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
