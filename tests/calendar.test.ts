import { END_WEEK, dateOf, formatDate, isMonthStart, weekOf } from '../src/sim';

describe('calendar', () => {
  test('week 0 is January 1970', () => {
    expect(dateOf(0)).toEqual({ year: 1970, month: 1, weekOfMonth: 1 });
    expect(formatDate(0)).toBe('Jan 1970, week 1');
  });

  test('every year has 12 month starts and months are 4–5 weeks', () => {
    let starts = 0;
    for (let w = 0; w < 52; w++) if (isMonthStart(w)) starts++;
    expect(starts).toBe(12);
    for (let m = 1; m <= 12; m++) {
      const len = (m === 12 ? weekOf(1971, 1) : weekOf(1970, m + 1)) - weekOf(1970, m);
      expect(len === 4 || len === 5).toBe(true);
    }
  });

  test('weekOf and dateOf agree', () => {
    for (let y = 1970; y <= 1985; y++) {
      for (let m = 1; m <= 12; m++) {
        const d = dateOf(weekOf(y, m));
        expect(d).toEqual({ year: y, month: m, weekOfMonth: 1 });
      }
    }
  });

  test('the game ends after 16 years', () => {
    expect(END_WEEK).toBe(16 * 52);
    expect(dateOf(END_WEEK).year).toBe(1986);
  });
});
