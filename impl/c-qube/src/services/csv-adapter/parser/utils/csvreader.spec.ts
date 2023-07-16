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

  it('should remove empty lines', async () => {
    const filePath = './test/fixtures/test-csvs/csvreader/valid.reader.csv';
    const expected = [
      'PK,Index,,,,,,,,,,',
      'string,string,string,integer,string,string,string,string,string,string,string, string',
      'school_id,school_name,schoolcategory_id,grade_id,cluster_id,cluster_name,block_id,block_name,district_id,district_name,latitude,longitude',
    ];
    const result = await readCSVFile(filePath);
    expect(result).toEqual(expected);
  });

  test('returns default quote character when config file is empty', () => {
    jest.spyOn(fs1, 'readFileSync').mockReturnValue('{}');
    const quoteChar = getquoteChar('./csvreader');
    expect(quoteChar).toBe("'");
    fs1.readFileSync.mockRestore();
  });

  test('should return the quote character from the config file', () => {
    jest.spyOn(fs1, 'readFileSync').mockReturnValue('{"globals": {"QuoteChar": "`"}}');
    const configPath ='ingest/config.json';
    const quoteChar = getquoteChar(configPath);
    expect(quoteChar).toBe('`');
  });

  test('should return the default quote character if not specified in the config file', () => {
    jest.spyOn(fs1, 'readFileSync').mockReturnValue('{"globals": {}}');
    const configPath = 'ingest/config.json';
    const quoteChar = getquoteChar(configPath);
    expect(quoteChar).toBe("'");
  });

  it('should parse CSV with ` as quote character', async () => {
    const filePath = './test/fixtures/test-csvs/csvreader/quote.csv';
    const result = await readCSV(filePath);
    expect(result).toEqual([
      ['Name', 'Age', 'Country'],
      ['John Doe', '30', 'USA'],
      ['Jane Smith', '25', 'Canada'],
      ['`Backtick User`', '40', 'Australia'],
    ]);
  });

});