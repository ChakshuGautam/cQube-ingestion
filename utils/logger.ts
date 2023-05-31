// This function accepts an options object with:
// filePath - The path to the log file
// logLevel (optional) - The log level, can be 'info', 'warn' or 'error'
// And a message string to log.
// It then formats the log message with:
// A timestamp
// The log level prefix ([INFO], [WARN] or [ERROR])
// The actual message
// And appends it to the specified log file.

import fs from 'fs';

interface LogOptions {
  filePath: string;
  logLevel?: 'info' | 'warn' | 'error';
}

function logToFile({ filePath, logLevel = 'info' }: LogOptions, message: string) {
  const timestamp = new Date().toISOString();
  const logLevelPrefix = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]'
  }[logLevel];

  const logMessage = `${timestamp} ${logLevelPrefix} ${message}\n`;

  fs.appendFile(filePath, logMessage, (err) => {
    if (err) {
      console.error(`Error writing to log file: ${err}`);
    }
  });
}
export { logToFile };
