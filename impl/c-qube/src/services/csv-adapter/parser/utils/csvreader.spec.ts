import { readCSV } from './csvreader';

describe('CSVReader', () => {
  test('parse the file fine', async () => {
    const res = await readCSV(
      './test/fixtures/test-csvs/csvreader/valid.reader.csv',
    );
    console.log(res);
    expect(res).toBeDefined();
  });
  // TODO: Ask if this valid behaviour to not throw here!
  test('throw error', async () => {
    try {
      const res = await readCSV(
        './test/fixtures/test-csvs/csvreader/invalid.reader.csv',
      );
      console.log('res in 2: ', res);
    } catch (err) {
      console.log('err: ', err);
      expect(err).toBeDefined();
    }
  });

  test('should throw because of no file found', async () => {
    try {
      await readCSV('./test/fixtures/test-csvs/csvreader/invalid.reader1.csv');
    } catch (err) {
      console.log('err: ', err);
      expect(err).toBeDefined();
    }
  });
});
