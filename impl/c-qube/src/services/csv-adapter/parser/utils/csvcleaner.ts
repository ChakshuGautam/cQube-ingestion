const fs1 = require('fs');
const readline = require('readline');
import { promisify } from 'util';
const path = require('path');

export async function processCsv(input, output) {
  return new Promise((resolve, reject) => {
    if (fs1.existsSync(output)) {
      fs1.unlinkSync(output);
    }
    const readStream = fs1.createReadStream(input);
    const writeStream = fs1.createWriteStream(output);
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
      await fs1.unlinkSync(input);
      await processSleep(200);
      readStream.close();
      writeStream.end();
      writeStream.on('finish', async () => {
        await fs1.renameSync(output, input);
        resolve(output);
      });
    });
    file.on('error', (err) => {
      reject(err);
    });
  });
}

async function processSleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export async function removeEmptyLines(filePath: string): Promise<void> {
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

export function getFilesInDirectory(directoryPath, fileList = []) {
  const files = fs1.readdirSync(directoryPath);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stat = fs1.statSync(filePath);

    if (stat.isDirectory()) {
      getFilesInDirectory(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}
