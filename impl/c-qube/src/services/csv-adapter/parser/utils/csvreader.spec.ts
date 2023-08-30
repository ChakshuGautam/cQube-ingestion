import { readCSV, readCSVFile } from './csvreader';

const fs1 = require('fs');
import { getCsvDelimiter } from './csvreader';

describe('CSVReader', () => {
  test('parse the file fine', async () => {
    const res = await readCSV(
      './test/fixtures/test-csvs/csvreader/valid.reader.csv',
    );
    expect(res).toBeDefined();
  });

  // TODO: Ask if this valid behaviour to not throw here!
  test('throw error', async () => {
    try {
      const res = await readCSV(
        './test/fixtures/test-csvs/csvreader/invalid.reader.csv',
      );
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('should read a file', () => {
    return;
  });
  it('should remove empty lines', () => {
    return;
  });
  it('should throw because of no file found', async () => {
    try {
      await readCSVFile(
        './test/fixtures/test-csvs/csvreader/invalid.reader1.csv',
      );
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  test('benchmarking', () => {
    // add a benchmark test here similar to date parser
  });

  test('parse with different CSV delimiter', async () => {
    const res = await readCSV(
      './test/fixtures/test-csvs/csvreader/invalid.reader.csv'
    );

    expect(res).toBeDefined();
  });

  test('get CSV delimiter from config', () => {
    const configPath = 'ingest/config.json';
    const configContent = JSON.stringify({ globals: { csvDelimiter: '/' } });
    jest.spyOn(fs1, 'readFileSync').mockReturnValue(configContent);
    const delimiter = getCsvDelimiter(configPath);
    expect(delimiter).toEqual('/');
  });

  test('should read and parse the CSV file correctly', async () => {
    const testFilePath = './test/fixtures/test-csvs/csvreader/test-delimiter.csv';
    const result = await readCSVFile(testFilePath);    
    const expectedOutput =[ '1,2,3', '4,5,6' ];
    expect(result).toEqual(expectedOutput);
  });

  it('should take delimiter value from config , incase both are defined ', async () => {
    let rows = await readCSV('./test/fixtures/test-csvs/csvreader/test-delimiter.csv', 'ingest/config.json', ',');
    expect(rows).toEqual([[ '1,2,3' ], [ '4,5,6' ]]);
  });

  it('should take delimiter value from config , incase one is undefined ', async () => {
    let rows = await readCSV('./test/fixtures/test-csvs/csvreader/test-delimiter.csv', 'ingest/config.json', undefined);
    expect(rows).toEqual([[ '1,2,3' ], [ '4,5,6' ]]);
  });

});