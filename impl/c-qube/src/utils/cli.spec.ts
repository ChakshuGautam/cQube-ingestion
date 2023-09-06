import { hideBin } from "yargs/helpers";
import { parseArguments } from "./cli";
import yargs from "yargs";

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