import { hash, unhash } from './hash';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-var-requires

describe('CsvAdapterService', () => {
  it('should hash and unhash correctly', async () => {
    const hashtable = {};
    for (let i = 10; i < 10000; i++) {
      // generate random string of length i
      const testString = crypto.randomBytes(i).toString('hex');
      const key = 'secret';
      const hashed = hash(testString, key, hashtable);
      const unhashed = unhash(hashed, hashtable);
      expect(unhashed).toBe(testString);
      expect(hashed.length).toBeLessThan(25);
    }
  });
});
