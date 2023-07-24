const fs1 = require('fs');
const fs = require('fs').promises;

import * as csv from 'csv-parser';

const configPath = 'ingest/config.json';
export async function readCSV(filePath: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const rows: string[][] = [];
    // TODO: Add checking here
    fs1
      .createReadStream(filePath)
      .pipe(csv({ separator: ',', headers: false, quote: "'" }))
      .on('data', (data) => {
        const rowValues: string[] = Object.values(data);
        const processedRowValues = FKvalue(configPath)
          ? rowValues
          : rowValues.map((value) => value.toLowerCase());
        rows.push(processedRowValues);
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

export function FKvalue(configPath: string): boolean {
  const configContent = fs1.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent);
  return config.globals.caseSensitiveFKSearch || false ;
} 