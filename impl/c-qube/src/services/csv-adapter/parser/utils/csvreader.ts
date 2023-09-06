const fs1 = require('fs');
const fs = require('fs').promises;

import * as csv from 'csv-parser';

export async function readCSV(filePath: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    let rows: string[][] = [];
    const chunkSize = 100000; 

    fs1.createReadStream(filePath)
      .pipe(csv({ separator: ',', headers: false, quote: "'" }))
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
