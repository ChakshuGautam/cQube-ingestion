import { getDataDifference } from './update-diff.service';

describe('tests the file diff generator', () => {
  it('should generate two arrays', () => {
    const oldFilePath =
      './test/fixtures/test-csvs/update-diff/mealserved-ingested.grammar.csv';
    const newFilePath =
      './test/fixtures/test-csvs/update-diff/mealserved-update.grammar.csv';
    const data = getDataDifference(oldFilePath, newFilePath);
    console.log(data);
    expect(data).toBeDefined(); //
    expect(data).toEqual({
      toBeDeleted: ['202,2'],
      toBeInserted: ['202,1'],
    });
  });
});
