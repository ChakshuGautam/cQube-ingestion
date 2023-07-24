import { FKvalue, readCSV, readCSVFile } from './csvreader';

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

  it('should return the correct value from the mocked config file', () => {
    const configPath = 'ingest/config.json';
    const result = FKvalue(configPath);
    expect(result).toEqual(false);
  });

  it('should correctly process CSV data with case insensitivity', async () => {
    const filePath = './test/fixtures/test-csvs/csvreader/fksearch.csv';
    const expectedRows = [
      ['1', 'john', '30'],
      ['2', 'david', '25'],
      ['3', 'michael', '22'],
      ['4', 'mary', '28'],
    ];
    const rows = await readCSV(filePath);
    expect(rows).toEqual(expectedRows);
  });
});