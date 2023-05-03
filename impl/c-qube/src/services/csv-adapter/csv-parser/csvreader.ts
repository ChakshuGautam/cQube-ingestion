const fs1 = require('fs');
import * as csv from 'csv-parser';

export async function readCSV(filePath: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const rows: string[][] = [];

    fs1
      .createReadStream(filePath)
      .pipe(csv({ separator: ',', headers: false, quote: "'" }))
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
