const fs1 = require('fs');
const fs = require('fs').promises;

import * as csv from 'csv-parser';

export async function readCSV(filePath: string, configPath?: string, quoteChar?: string, delimiter?: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    let rows: string[][] = [];
    const chunkSize = 100000; 
    if (configPath) {
      const configquote = getquoteChar(configPath);
      quoteChar = configquote || quoteChar || "'";
      const configDelimiter = getCsvDelimiter(configPath);
      delimiter = configDelimiter || delimiter || ',';
    } 
    else {
      quoteChar = quoteChar || "'";
      delimiter = delimiter || ',';
    }

    fs1.createReadStream(filePath)
      .pipe(csv({ separator: delimiter, headers: false, quote: quoteChar }))
      .on('data', (data) => {
        rows.push(Object.values(data));

        if (rows.length >= chunkSize) {
          resolve(rows);
          rows = [];
        }
      })
      .on('end', () => {
        if (rows.length > 0) {
          resolve(rows);
        } else {
          reject(new Error('File is empty'));
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

export async function readCSVFile(filePath: string): Promise<string[]> {
  const fileContent = await fs.readFile(filePath, 'utf-8');

  return fileContent
    .split('\n')
    .map((row: string) => row.trim())
    .filter((row: string) => row !== '');
}

export function getquoteChar (configPath: string): string | undefined {
  try {
    const configContent = fs1.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    return config.globals.quoteChar;
  } catch (error) {
    return undefined;
  }
}

export function getCsvDelimiter(configPath: string): string | undefined {
  try {
    const configContent = fs1.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    return config.globals.csvDelimiter;
  } catch (error) {
    return undefined;
  }
}
