import {
  processCsv,
  removeEmptyLines,
  getFilesInDirectory,
  processSleep,
} from './csvcleaner';
// import * as fs from 'fs';
const fs1 = require('fs');
const readline = require('readline');

describe('remove empty lines', () => {
  // TODO: Ask what the ReadCSV function does
  test('parse the file fine', async () => {
    const testFilePath = './test/fixtures/test-csvs/csvcleaner/withEmpty.csv';
    const dupFilePath =
      './test/fixtures/test-csvs/csvcleaner/withEmpty.dup.csv';
    const withoutEmptyFilePath =
      './test/fixtures/test-csvs/csvcleaner/withoutEmpty.csv';

    fs1.copyFileSync(testFilePath, dupFilePath);

    await removeEmptyLines(dupFilePath);
    const removedData = fs1.readFileSync(dupFilePath, 'utf-8');
    const withoutData = fs1.readFileSync(withoutEmptyFilePath, 'utf-8');
    expect(removedData).toEqual(withoutData);
    fs1.unlinkSync(dupFilePath);
  });
  test('test get files in directory', async () => {
    const files = await getFilesInDirectory('./test/fixtures/test-csvs');
    const expectedFiles = [
      'test/fixtures/test-csvs/csvcleaner/withEmpty.csv',
      'test/fixtures/test-csvs/csvcleaner/withoutEmpty.csv',
      "test/fixtures/test-csvs/csvreader/fksearch.csv",
      'test/fixtures/test-csvs/csvreader/invalid.reader.csv',
      'test/fixtures/test-csvs/csvreader/valid.reader.csv',
      'test/fixtures/test-csvs/event-grammars/test-dimension.grammar.csv',
      'test/fixtures/test-csvs/event-grammars/incorrect_length-dimension.grammar.csv',
      'test/fixtures/test-csvs/event-grammars/invalid-dimension.grammar.csv',
      'test/fixtures/test-csvs/event-grammars/school-dimension.grammar.csv',
    ];
    files.sort();
    expectedFiles.sort();
    expect(files).toEqual(expectedFiles);
  });
  test('processSleep resolves after the specified time', async () => {
    const startTime = Date.now();
    const sleepTime = 2000; 
    await processSleep(sleepTime);
    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeGreaterThanOrEqual(sleepTime);
  });
});
