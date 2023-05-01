import * as crypto from 'crypto';

const customBase64Chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';

/**
 * Encodes a buffer using a custom base64 encoding scheme.
 * Replaces the characters '+', '/' and '=' with '-', '_' and '', respectively.
 *
 * @param {Buffer} buffer - The buffer to encode.
 * @returns {string} The encoded buffer as a string.
 */
function customBase64Encode(buffer) {
  const base64 = buffer.toString('base64');
  const customBase64 = base64.replace(/[+/=]/g, (match) => {
    switch (match) {
      case '+':
        return '__';
      case '/':
        return '_';
      case '=':
        return '';
      default:
        return match;
    }
  });
  return customBase64;
}

/**
 * Generate an MD5 hash key from the given input string.
 * @param {string} input - The input string to hash.
 * @returns {Buffer} A buffer containing the MD5 hash key.
 */
function generateKey(input) {
  const hash = crypto.createHash('md5');
  hash.update(input);
  const key = hash.digest();
  return key;
}

/**
 * Encodes the input string using a XOR cipher with the given key.
 *
 * @param {string} input - The string to be encoded.
 * @param {string} key - The key to use for the cipher.
 * @returns {Buffer} - A Buffer containing the encoded bytes.
 */
function xorCipher(input, key) {
  const inputBytes = Buffer.from(input, 'utf-8');
  const outputBytes = Buffer.alloc(inputBytes.length);

  for (let i = 0; i < inputBytes.length; i++) {
    outputBytes[i] = inputBytes[i] ^ key[i % key.length];
  }

  return outputBytes;
}

/**
 * XOR-folds a buffer into a new buffer of a specified chunk size.
 *
 * @param {Buffer} buffer - The buffer to fold.
 * @param {number} chunkSize - The size of each chunk in the new buffer.
 * @returns {Buffer} A new buffer with the folded data.
 */
function foldBuffer(buffer, chunkSize) {
  const folded = Buffer.alloc(chunkSize);

  for (let i = 0; i < buffer.length; i++) {
    folded[i % chunkSize] ^= buffer[i];
  }

  return folded;
}

/**
 * Hashes the given input using XOR cipher, folding the result and encoding it
 * with a custom base64 algorithm. The resulting encoded string is stored in the
 * given hashtable with the original input as its value.
 *
 * @param {string} input - The input to be hashed.
 * @param {string} key - The key to be used in the XOR cipher.
 * @param {object} hashtable - The hashtable to store the encoded string and input.
 *
 * @returns {string} The encoded string representing the hashed input.
 */
export function hash(input, key, hashtable) {
  const chunkSize = 15;
  const cipher = xorCipher(input, key);
  const folded = foldBuffer(cipher, chunkSize);
  const encoded = customBase64Encode(folded);
  hashtable[encoded] = input;
  return encoded;
}

/**
 * Retrieve the value associated with a key in a hashtable, given its hash code.
 *
 * @param {string} encoded - The hash code of the key to retrieve.
 * @param {Object<string, *>} hashtable - The hashtable to search for the key.
 * @return {*} The value associated with the key, or undefined if not found.
 */
export function unhash(encoded, hashtable) {
  return hashtable[encoded];
}
