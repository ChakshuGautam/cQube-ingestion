import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as path from 'path';

export async function readCSV(filePath: string, quoteChar: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const rows: string[][] = [];

    fs.createReadStream(path.resolve(filePath))
      .pipe(csv({ separator: ',', headers: false, quote: quoteChar }))
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
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');

  return fileContent
    .split('\n')
    .map((row: string) => row.trim())
    .filter((row: string) => row !== '');
}
