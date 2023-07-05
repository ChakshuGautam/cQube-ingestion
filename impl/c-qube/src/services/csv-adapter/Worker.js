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


async function removeEmptyLines(filePath){
  const readFileAsync = promisify(fs1.readFile);
  const writeFileAsync = promisify(fs1.writeFile);
  try {
    // Read the file contents
    const data = await readFileAsync(filePath, 'utf-8');
  
    // Split the file contents into lines and filter out empty lines
    const lines = data.split('\n');
    const nonEmptyLines = lines.filter((line) => line.trim() !== '');
  
    // Join the non-empty lines back together
    const filteredContents = nonEmptyLines.join('\n');
  
    // Write the filtered contents back to the file
    await writeFileAsync(filePath, filteredContents);
  } catch (err) {
    console.error('Error processing file:', err);
  }
}

// Extract the file data from the workerData
const file = workerData;

// Perform the removeEmptyLines operation
removeEmptyLines(file)
  .then((result) => {
    // Send the result back to the parent thread
    parentPort.postMessage(result);
  })
  .catch((error) => {
    // Send the error back to the parent thread
    parentPort.postMessage({ error: error.message });
  });