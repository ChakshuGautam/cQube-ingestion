import { parse, format as formatDate } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export class DateParser {
  private format: string;
  private timezone?: string;

  constructor(format: string, timezone?: string) {
    this.format = format;
    this.timezone = timezone;
  }

  parseDate(date: string): Date {
    const parsedDate = parse(date, this.format, new Date());
    if (this.timezone) {
      const dateWithTimezone = zonedTimeToUtc(parsedDate, this.timezone);
      return dateWithTimezone;
    } else {
      const dateWithoutTimezone = new Date(
        new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate(),
        ),
      );
      dateWithoutTimezone.setDate(dateWithoutTimezone.getDate() + 1);
      return dateWithoutTimezone;
    }
  }

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
