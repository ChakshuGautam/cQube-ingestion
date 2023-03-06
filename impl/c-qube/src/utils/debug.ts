// Add prototype to console to create a new function called logToFile that stores logs in ./debug directory and take takes additonal paramerter called filename.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

export const logToFile = (...args) => {
  if (process.env.DEBUG === 'true') {
    const filename = args[args.length - 1];
    const debugDir = path.join(__dirname, '../../', 'debug');
    fs.writeFile(
      debugDir + '/' + filename,
      JSON.stringify(args, null, 2) + '\n',
      'utf8',
      function (err) {
        if (err) {
          return console.log(err);
        }
      },
    );
  }
};

export const resetLogs = () => {
  const debugDir = path.join(__dirname, '../../', 'debug');
  fs.readdir(debugDir, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(debugDir, file), (err) => {
        if (err) throw err;
      });
    }
  });
};
