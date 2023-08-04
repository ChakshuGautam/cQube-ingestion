import { measureExecutionTime } from "./runtime";

class MockLogger {
  log = jest.fn();
}

describe('AppService', () => {
 
  it('should measure the execution time and log the result', async () => {
    const mockFunc = jest.fn().mockResolvedValue('test result');
    const mockLogger = new MockLogger();

    const result = await measureExecutionTime.call({ logger: mockLogger }, mockFunc);

    expect(mockFunc).toHaveBeenCalled();
    expect(result).toBe('test result');
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringMatching(/^Time taken: \d+\.\d+ ms$/));
  });

  it('should return the result from the provided function', async () => {
    const expectedResult = 'test result';
    const mockFunc = jest.fn().mockResolvedValue(expectedResult);
    const mockLogger = new MockLogger();

    const result = await measureExecutionTime.call({ logger: mockLogger }, mockFunc);

    expect(result).toBe(expectedResult);
  });
});
