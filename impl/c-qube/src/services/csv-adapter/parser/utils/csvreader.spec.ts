import { readCSV, readCSVFile, getquoteChar } from './csvreader';
const fs1 = require('fs'); 



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

  test('should return the quote character from the config file', () => {
    jest.spyOn(fs1, 'readFileSync').mockReturnValue('{"globals": {"quoteChar": "`"}}');
    const configPath ='ingest/config.json';
    const quoteChar = getquoteChar(configPath);
    expect(quoteChar).toBe('`');
  });

  it('should take quote value from config , incase both are defined ', async () => {
    let rows = await readCSV('./test/fixtures/test-csvs/csvreader/quote.csv', 'ingest/config.json', '`');
    console.log(rows)
    expect(rows).toEqual([
      [ 'Name', 'Age', 'Country' ],
      [ 'John Doe', '30', 'USA' ],
      [ 'Jane Smith', '25', 'Canada' ],
      [ 'Backtick User', '40', 'Australia' ]
    ]);
  });

  it('should take quote value from config , incase one is defined ', async () => {
    let rows = await readCSV('./test/fixtures/test-csvs/csvreader/quote.csv', 'ingest/config.json', undefined);
    console.log(rows)
    expect(rows).toEqual([
      [ 'Name', 'Age', 'Country' ],
      [ 'John Doe', '30', 'USA' ],
      [ 'Jane Smith', '25', 'Canada' ],
      [ 'Backtick User', '40', 'Australia' ]
    ]);
  });

});