const winston = require('winston');
const fs = require('fs');

function setupLogger(logFileName: string, logLevel: string = 'info') {
  const logDir = 'logs';

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
      new winston.transports.File({ filename: `${logDir}/${logFileName}` })
    ]
  });

  return logger;
}

export { setupLogger };

// const logger = setupLogger('app.log');

// logger.info('This is an info message');
// logger.warn('This is a warning message');
// logger.error('This is an error message');
