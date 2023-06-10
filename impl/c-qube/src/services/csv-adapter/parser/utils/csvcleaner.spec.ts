import {
  processCsv,
  removeEmptyLines,
  getFilesInDirectory,
} from './csvcleaner';
import * as fs from 'fs';

describe('remove empty lines', () => {
  // TODO: Ask what the ReadCSV function does
  test('parse the file fine', async () => {
    const testFilePath = './test/fixtures/test-csvs/csvcleaner/withEmpty.csv';
    const dupFilePath =
      './test/fixtures/test-csvs/csvcleaner/withEmpty.dup.csv';
    const withoutEmptyFilePath =
      './test/fixtures/test-csvs/csvcleaner/withoutEmpty.csv';

    fs.copyFileSync(testFilePath, dupFilePath);

    await removeEmptyLines(dupFilePath);
    const removedData = fs.readFileSync(dupFilePath, 'utf-8');
    const withoutData = fs.readFileSync(withoutEmptyFilePath, 'utf-8');
    expect(removedData).toEqual(withoutData);
    fs.unlinkSync(dupFilePath);
  });
  test('test get files in directory', async () => {
    const files = await getFilesInDirectory('./test/fixtures/test-csvs');
    expect(files).toEqual([
      'test/fixtures/test-csvs/csvcleaner/withEmpty.csv',
      'test/fixtures/test-csvs/csvcleaner/withoutEmpty.csv',
      'test/fixtures/test-csvs/csvreader/invalid.reader.csv',
      'test/fixtures/test-csvs/csvreader/valid.reader.csv',
      'test/fixtures/test-csvs/event-grammars/test-dimension.grammar.csv',
    ]);
  });
});
