import { CONFIG } from './config';

// Week 0 is the first week of January 1970. Years are exactly 52 weeks; months are mapped
// onto week ranges so that a month is 4 or 5 weeks long.

const WPY = CONFIG.calendar.weeksPerYear;
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export interface GameDate {
  year: number;
  /** 1–12 */
  month: number;
  /** 1-based week within the month */
  weekOfMonth: number;
}

export function yearOf(week: number): number {
  return CONFIG.start.year + Math.floor(week / WPY);
}

export function monthOf(week: number): number {
  return Math.floor(((week % WPY) * 12) / WPY) + 1;
}

/** First week index of the given year/month. */
export function weekOf(year: number, month: number): number {
  const yearStart = (year - CONFIG.start.year) * WPY;
  return yearStart + Math.ceil(((month - 1) * WPY) / 12);
}

export function dateOf(week: number): GameDate {
  const year = yearOf(week);
  const month = monthOf(week);
  return { year, month, weekOfMonth: week - weekOf(year, month) + 1 };
}

/** Continuous year, e.g. 1975.5 in the middle of 1975. */
export function fractionalYear(week: number): number {
  return CONFIG.start.year + week / WPY;
}

export function isMonthStart(week: number): boolean {
  return week === 0 || monthOf(week) !== monthOf(week - 1);
}

export function formatDate(week: number): string {
  const d = dateOf(week);
  return `${MONTH_NAMES[d.month - 1]} ${d.year}, week ${d.weekOfMonth}`;
}

export function formatMonth(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** The week at which the game is over: the first week after the end year. */
export const END_WEEK = (CONFIG.calendar.endYear + 1 - CONFIG.start.year) * WPY;
