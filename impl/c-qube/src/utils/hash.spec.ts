import yargs from 'yargs';
import { hash, unhash } from './hash';
import * as crypto from 'crypto';
import { hideBin } from 'yargs/helpers';
import { parseArguments } from './cli';
// eslint-disable-next-line @typescript-eslint/no-var-requires

jest.mock('yargs', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    option: jest.fn().mockReturnThis(),
    command: jest.fn().mockReturnThis(),
    demandCommand: jest.fn().mockReturnThis(),
    help: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
    strict: jest.fn().mockReturnThis(),
    parse: jest.fn(),
  })),
}));

jest.mock('yargs/helpers', () => ({
  hideBin: jest.fn(),
}));


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

describe('parseArguments', () => {
  beforeEach(() => {
    // Reset mock implementations and clear mock calls before each test.
    jest.clearAllMocks();
  });

  it('should call yargs with hideBin', () => {
    (hideBin as jest.Mock).mockReturnValueOnce([]);
    parseArguments();
    expect(hideBin).toHaveBeenCalledWith(process.argv);
    expect(yargs).toHaveBeenCalledWith([]);
  });
});