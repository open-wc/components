/**
 * Compresses a string and return it as a base64 compressed string
 *
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function compressStringToBase64(text) {
  const byteArray = new TextEncoder().encode(text);
  // @ts-ignore will be fixed once we update to the latest TS version
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const arrayBuffer = await new Response(cs.readable).arrayBuffer();
  return _arrayBufferToBase64(arrayBuffer);
}

/**
 * Taken from https://stackoverflow.com/questions/38432611/converting-arraybuffer-to-string-maximum-call-stack-size-exceeded
 * @param {ArrayBuffer} buffer
 * @returns
 */
function _arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  // Loop String.fromCharCode to circumvent number of arguments (call stack) limitation
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
