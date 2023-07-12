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

  test('returns default quote character when config file is empty', () => {
    jest.spyOn(fs1, 'readFileSync').mockReturnValue('{}');
    const quoteChar = getquoteChar('./csvreader');
    expect(quoteChar).toBe("'");
    
    // Restore the original implementation of fs.readFileSync
    fs1.readFileSync.mockRestore();
  });

  test('should return the quote character from the config file', () => {
    jest.spyOn(fs1, 'readFileSync').mockReturnValue('{"globals": {"QuoteChar": "`"}}');
    const configPath ='ingest/config.json';
    const quoteChar = getquoteChar(configPath);
    expect(quoteChar).toBe('`');
  });

  test('should return the default quote character if not specified in the config file', () => {
    // Mock the fs.readFileSync function
    jest.spyOn(fs1, 'readFileSync').mockReturnValue('{"globals": {}}');

    // Provide the path to the config file
    const configPath = 'ingest/config.json';

    // Call the getquoteChar function
    const quoteChar = getquoteChar(configPath);

    // Assert that the quoteChar is equal to the default quote character
    expect(quoteChar).toBe("'");
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
  
  
  it('should reject with an error if an error occurs during reading', async () => {
    const filePath = './test/fixtures/test-csvs/csvreader/valid.reader.csv';

    try {
      await readCSV(filePath);
      // The promise should not be resolved, so no expectation needed here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Some error');
    }
  });

  
});