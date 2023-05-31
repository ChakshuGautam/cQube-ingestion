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
