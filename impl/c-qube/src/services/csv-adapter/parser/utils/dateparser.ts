import { parse, format as formatDate } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';

export class DateParser {
  private format: string;
  private timezone?: string;

  constructor(format: string, timezone?: string) {
    this.format = format;
    this.timezone = timezone;
  }

  toUtc(date: Date) {
    const offsetMillis = 5.5 * 60 * 60 * 1000; // 5 hours in milliseconds
    return new Date(date.getTime() + offsetMillis);
  }

  parseDate(date: string): Date {
    // This assumes date is in the format 'dd-mm-yyyy'
    if (this.format === 'dd-mm-yyyy' || this.format === 'dd-MM-yyyy') {
      const parts = date.split('-');
      const parsedDate = new Date(
        Number(parts[2]),
        Number(parts[1]) - 1, // JavaScript months are 0-indexed
        Number(parts[0]),
      );
      return this.toUtc(parsedDate);
    } else if (this.format === 'dd/MM/yy') {
      const parts = date.split('/');
      const year = Number(parts[2]);
      const fullYear = year < 30 ? 2000 + year : 1900 + year;
      const parsedDate = new Date(
        fullYear,
        Number(parts[1]) - 1, // JavaScript months are 0-indexed
        Number(parts[0]),
      );
      return this.toUtc(parsedDate);
    }
  }

  // parseDate(date: string): Date {
  //   const parsedDate = parse(date, this.format, new Date());
  //   if (this.timezone) {
  //     const dateWithTimezone = zonedTimeToUtc(parsedDate, this.timezone);
  //     return dateWithTimezone;
  //   } else {
  //     return new Date(
  //       Date.UTC(
  //         parsedDate.getFullYear(),
  //         parsedDate.getMonth(),
  //         parsedDate.getDate(),
  //       ),
  //     );
  //     // const dateWithoutTimezone = new Date(
  //     //   new Date(
  //     //     parsedDate.getFullYear(),
  //     //     parsedDate.getMonth(),
  //     //     parsedDate.getDate(),
  //     //     'GMT',
  //     //   ),
  //     // );
  //     // dateWithoutTimezone.setDate(dateWithoutTimezone.getDate() + 1);
  //     // return dateWithoutTimezone;
  //   }
  // }

  // static getDate(date: Date | string): Date | string {
  //   if (date instanceof Date) {
  //     return new Date(
  //       Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  //     );
  //   } else {
  //     return date;
  //   }
  // }
  parseDateWithoutTimezone(date: string): string {
    const parsedDate = parse(date, this.format, new Date());
    const dateWithoutTimezone = formatDate(parsedDate, 'yyyy-MM-dd');
    return dateWithoutTimezone;
  }

  static getDate(date: Date): Date {
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
  }

  static getWeek(date: Date): number {
    return Math.ceil(
      (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
        (1000 * 60 * 60 * 24 * 7),
    );
  }

  static getMonth(date: Date): number {
    return date.getMonth() + 1;
  }

  static getYear(date: Date): number {
    return date.getFullYear();
  }
}
