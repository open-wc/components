import { compressStringToBase64 } from './compressStringToBase64.js';
import { decompressStringFromBase64 } from './decompressStringFromBase64.js';

const output = await compressStringToBase64('foo'.repeat(100));
console.log(output);

const control = await decompressStringFromBase64(output);
console.log(control);
