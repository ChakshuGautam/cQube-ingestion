// processCsvWorker.js

const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const readline = require('readline');


async function processCsv(input, output) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(output)) {
      fs.unlinkSync(output);
    }
    const readStream = fs.createReadStream(input);
    const writeStream = fs.createWriteStream(output);
    const file = readline.createInterface({
      input: readStream,
      output: process.stdout,
      terminal: false,
    });
    file.on('line', (line) => {
      let newline = '';
      for (const letter in line) {
        if (line[letter] == '"') {
          continue;
        } else {
          newline = newline + line[letter];
        }
      }
      writeStream.write(newline + '\r\n');
    });
    file.on('close', async () => {
      await fs.unlinkSync(input);
      await processSleep(200);
      readStream.close();
      writeStream.end();
      writeStream.on('finish', async () => {
        await fs.renameSync(output, input);
        resolve(output);
      });
    });
    file.on('error', (err) => {
      reject(err);
    });
  });
}

// Extract the file paths from the workerData
const { input, output } = workerData;

// Perform the CSV processing
processCsv(input, output)
  .then((result) => {
    // Send the result back to the parent thread
    parentPort.postMessage(result);
  })
  .catch((error) => {
    // Send the error back to the parent thread
    parentPort.postMessage({ error: error.message });
  });
