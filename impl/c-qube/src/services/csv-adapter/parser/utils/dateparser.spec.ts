import { DateParser } from './dateparser';

describe('DateParser', () => {
  const dateFormat1 = 'dd/MM/yy';
  const dateFormat2 = 'dd-MM-yyyy';
  const timezone = 'America/New_York';
  const dateFormat3 = 'dd-mm-yyyy';
  const parser = new DateParser(dateFormat3);
  const parser1 = new DateParser(dateFormat1, timezone);
  const parser2 = new DateParser(dateFormat2);

  // test('should parse date correctly with format 1 and timezone', () => {
  //   const date = parser1.parseDate('02/01/23');
  //   expect(date).toEqual(new Date('2023-01-02T05:00:00.000Z'));
  // });

  // test('should parse date correctly with format 2 and no timezone', () => {
  //   const date = parser2.parseDate('02-01-2023');
  //   expect(date).toEqual(new Date('2023-01-02T00:00:00.000Z'));
  // });

  test('should parse date without timezone correctly with format 2 and no timezone', () => {
    const date = parser2.parseDateWithoutTimezone('02-01-2023');
    expect(date).toEqual('2023-01-02');
  });

  test('should get correct week', () => {
    const date = new Date('2023-01-02T05:00:00.000Z');
    expect(DateParser.getWeek(date)).toBe(1);
  });

  test('should get correct month', () => {
    const date = new Date('2023-01-02T05:00:00.000Z');
    expect(DateParser.getMonth(date)).toBe(1);
  });

  test('should get correct year', () => {
    const date = new Date('2023-01-02T05:00:00.000Z');
    expect(DateParser.getYear(date)).toBe(2023);
  });

  test('should parse date in the format dd-mm-yyyy', () => {
    const inputDate = '15-07-2023';
    const expectedDate = new Date(Date.UTC(2023, 6, 15)); 
    const result = parser.parseDate(inputDate);
    expect(result).toEqual(expectedDate);
  });

  test('should parse date in the format dd/MM/yy', () => {
    const parser = new DateParser(dateFormat1);
    const inputDate = '25/03/21';
    const parts = inputDate.split('/');
    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1; 
    const year = Number(parts[2]);
    const fullYear = year < 30 ? 2000 + year : 1900 + year;
    const expectedDate = new Date(Date.UTC(fullYear, month, day));
    const result = parser.parseDate(inputDate);
    expect(result).toEqual(expectedDate);
  });

  test('should correctly parse the full year based on the input year', () => {
    const year = new DateParser(dateFormat1); // Replace with the correct instantiation of YourClass
    const parseDateMethod = year.parseDate.bind(year);

    // Test cases for different input years
    expect(parseDateMethod('01/01/25').getFullYear()).toBe(2025);
    expect(parseDateMethod('02/01/30').getFullYear()).toBe(1930);
    expect(parseDateMethod('01/01/70').getFullYear()).toBe(1970);
    expect(parseDateMethod('01/01/99').getFullYear()).toBe(1999);
    expect(parseDateMethod('01/01/00').getFullYear()).toBe(2000);
    expect(parseDateMethod('01/01/15').getFullYear()).toBe(2015);
  });

  // test('should get correct date 100_000 times', () => {
  //   const startTime = new Date().getTime();
  //   for (let i = 0; i < 1_000_000; i++) {
  //     const date = parser1.parseDate('02/01/23');
  //   }
  //   const endTime = new Date().getTime();
  //   expect(endTime - startTime).toBeLessThan(1000);
  // });

  test('DateParser.getDate should return the Date object with time set to midnight (00:00:00 UTC)', () => {
    const testDate = new Date('2023-07-17T12:34:56Z');
    const result = DateParser.getDate(testDate);
    const expectedDate = new Date('2023-07-17T00:00:00Z');
    expect(result).toEqual(expectedDate);
  });
});

