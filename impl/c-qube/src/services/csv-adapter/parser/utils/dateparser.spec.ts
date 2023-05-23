import { DateParser } from './dateparser';

describe('DateParser', () => {
  const dateFormat1 = 'dd/MM/yy';
  const dateFormat2 = 'dd-MM-yyyy';
  const timezone = 'America/New_York';

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

  // test('should get correct date 100_000 times', () => {
  //   const startTime = new Date().getTime();
  //   for (let i = 0; i < 1_000_000; i++) {
  //     const date = parser1.parseDate('02/01/23');
  //   }
  //   const endTime = new Date().getTime();
  //   expect(endTime - startTime).toBeLessThan(1000);
  // });
});
