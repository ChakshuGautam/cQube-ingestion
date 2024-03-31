import { logToFile, resetLogs } from "./debug";
const fs = require('fs');
const path = require('path');

jest.mock('fs', () => ({
  __esModule: true,
  readdir: jest.fn(),
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));

const consoleLogMock = jest.spyOn(console, 'log').mockImplementation();



describe('resetLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should unlink files in the debug directory', () => {
    const debugDir = path.join(__dirname, '../../', 'debug');
    const files = ['file1.txt', 'file2.txt', 'file3.txt'];

    fs.readdir.mockImplementation((dir, callback) => {
      expect(dir).toBe(debugDir);
      callback(null, files);
    });

    fs.unlink.mockImplementation((file, callback) => {
      expect(files).toContain(path.basename(file));
      callback(null);
    });
    resetLogs();

    expect(fs.readdir).toHaveBeenCalledWith(debugDir, expect.any(Function));
    expect(fs.unlink).toHaveBeenCalledTimes(files.length);
    for (const file of files) {
      expect(fs.unlink).toHaveBeenCalledWith(path.join(debugDir, file), expect.any(Function));
    }
  });

  it('should write log to the debug directory', () => {
    const filename = 'test.log';
    const args = ['arg1', 'arg2', filename];
    const debugDir = path.join(__dirname, '../../', 'debug');
    const logContent = JSON.stringify(args, null, 2) + '\n';

    fs.writeFile.mockImplementation((filePath, content, encoding, callback) => {
      expect(filePath).toBe(path.join(debugDir, filename));
      expect(content).toBe(logContent);
      expect(encoding).toBe('utf8');
      callback(null);
    });
    process.env.DEBUG = 'true';
    logToFile(...args);
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(debugDir, filename),
      logContent,
      'utf8',
      expect.any(Function)
    );
  });

  it('should not write log when DEBUG environment variable is not true', () => {
    process.env.DEBUG = 'false';
    logToFile('arg1', 'arg2', 'test.log');
    expect(fs.writeFile).not.toHaveBeenCalled();
  });




  it('should log an error to the console when writing to the file encounters an error', () => {
    const filename = 'test.log';
    const args = ['arg1', 'arg2', filename];
    const debugDir = path.join(__dirname, '../../', 'debug');
    const logContent = JSON.stringify(args, null, 2) + '\n';
    const errorMock = new Error('Test Error');

    fs.writeFile.mockImplementation((filePath, content, encoding, callback) => {
      callback(errorMock); // Simulate an error when writing to the file
    });

    // Set DEBUG environment variable to true
    process.env.DEBUG = 'true';

    logToFile(...args);

    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(debugDir, filename),
      logContent,
      'utf8',
      expect.any(Function)
    );

    // Expect console.log to be called with the error message
    expect(consoleLogMock).toHaveBeenCalledWith(errorMock);
  });

});