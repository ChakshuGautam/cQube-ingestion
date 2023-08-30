const fs1 = require('fs');
const fs = require('fs').promises;

import * as csv from 'csv-parser';

export async function readCSV(filePath: string, configPath?: string, delimiter?: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const rows: string[][] = configPath ? [] : [[]]; 

    if (configPath) {
      const configDelimiter = getCsvDelimiter(configPath);
      delimiter = configDelimiter || delimiter || ',';
    } else {
      delimiter = delimiter || ',';
    }

    fs1
      .createReadStream(filePath)
      .pipe(csv({ separator: delimiter, headers: false, quote: "'" }))
      .on('data', (data) => {
        rows.push(Object.values(data));
      })
      .on('end', () => {
        resolve(rows);
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

export function getCsvDelimiter(configPath: string): string | undefined {
  try {
    const configContent = fs1.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    return config.globals.csvDelimiter;
  } catch (error) {
    return undefined;
  }
}