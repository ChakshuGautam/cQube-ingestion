import { readCSVFile } from '../utils/csvreader';
const fs = require('fs');

export class DifferenceGeneratorService {
  async getDataDifference(
    prevFilePath: string,
    newFilePath: string,
    grammarFilePath?: string,
    updateFileLocation?: string,
  ) {
    // TODO: Move to readCSV util fn
    const oldContent: string[] = fs
      .readFileSync(prevFilePath, 'utf-8')
      .split('\n')
      .map((row: string) => row.trim())
      .filter((row: string) => row !== '');

    const newContent: string[] = fs
      .readFileSync(newFilePath, 'utf-8')
      .split('\n')
      .map((row: string) => row.trim())
      .filter((row: string) => row !== '');

    const toBeDeleted: string[] = [];
    const toBeInserted: string[] = [];

    // checking if the header is same
    if (oldContent[0] === newContent[0]) {
      // finding the diff between these two like git
      oldContent.forEach((row: string) => {
        // find this row in the new file and if not found add to toBeDeleted
        const idx = newContent.indexOf(row);
        if (idx > -1) {
          newContent.splice(idx, 1);
        } else {
          toBeDeleted.push(row);
        }
      });

      toBeInserted.push(...newContent);

      // create updated CSV to ingest

      // find out metric from grammar
      const metricIdxs = [];
      if (grammarFilePath) {
        const grammarContent: string[] = await readCSVFile(grammarFilePath);
        console.log('grammarContent: ', grammarContent);
        const lastRow = grammarContent[4].split(',');
        // console.log('lastROw: ', lastRow);
        lastRow.forEach((cell: string, idx: number) => {
          if (cell.trim() === 'metric') metricIdxs.push(idx);
        });
      }
      // console.log(metricIdxs);
      const splitRows = toBeDeleted.map((row: string) => row.split(','));
      const finalContent = [oldContent[0], ...toBeInserted]; // TODO: add header row here
      splitRows.forEach((row: string[], idx: number) => {
        const newRow = [];
        row.forEach((item: string, rowIdx: number) => {
          if (metricIdxs.includes(rowIdx)) {
            newRow.push('-' + item);
          } else {
            newRow.push(item);
          }
        });
        finalContent.push(newRow.join(','));
      });

      // write to file
      const fileName =
        newFilePath.split('/').pop()?.split('.').slice(0, -2).join('.') +
        `-delta.csv`;
      const filePath = updateFileLocation
        ? updateFileLocation + '/' + fileName
        : fileName;

      fs.writeFileSync(filePath, finalContent.join('\n'));

      return { filePath, finalContent };
    }
  }
}
