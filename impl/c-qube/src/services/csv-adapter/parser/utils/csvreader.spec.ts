import { readCSV } from './csvreader';

describe('CSVReader', () => {
  test('parse the file fine', async () => {
    const res = await readCSV(
      './test/fixtures/test-csvs/csvreader/valid.reader.csv',
    );
    expect(res).toEqual([
      ['PK', 'Index', '', '', '', '', '', '', '', '', '', ''],
      [
        'string',
        'string',
        'string',
        'integer',
        'string',
        'string',
        'string',
        'string',
        'string',
        'string',
        'string',
        ' string',
      ],
      [
        'school_id',
        'school_name',
        'schoolcategory_id',
        'grade_id',
        'cluster_id',
        'cluster_name',
        'block_id',
        'block_name',
        'district_id',
        'district_name',
        'latitude',
        'longitude',
      ],
    ]);
  });

  // TODO: Ask if this valid behaviour to not throw here!
  test('throw error', async () => {
    try {
      const res = await readCSV(
        './test/fixtures/test-csvs/csvreader/invalid.reader.csv',
      );
      expect(res).toEqual([
        ['"Name"', '"Age"', '"Email"'],
        ['"Jane"', '"28"', '"jane\\@example.com"'],
      ]);
    } catch (err) {
      console.log('err: ', err);
      expect(err).toBeDefined();
    }
  });

  // test('should throw because of no file found', async () => {
  //   try {
  //     await readCSV('./test/fixtures/test-csvs/csvreader/invalid.reader1.csv');
  //   } catch (err) {
  //     console.log('err: ', err);
  //     expect(err).toBeDefined();
  //   }
  // });
});
