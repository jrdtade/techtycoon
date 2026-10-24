import { END_WEEK, step, stepMany, weekOf } from '../src/sim';
import type { GameState } from '../src/sim';
import { assertFiniteNumbers, freshGame } from './helpers';

function richGame(): GameState {
  const s = freshGame();
  s.company.cash = 10_000_000;
  return s;
}

describe('tick', () => {
  test('step is pure and advances one week', () => {
    const s0 = freshGame();
    const snapshot = JSON.stringify(s0);
    const s1 = step(s0);
    expect(JSON.stringify(s0)).toBe(snapshot);
    expect(s1.week).toBe(1);
  });

  test('same seed, same history', () => {
    const a = stepMany(freshGame(7), 200);
    const b = stepMany(freshGame(7), 200);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('technologies and era events arrive on schedule', () => {
    const s = stepMany(richGame(), weekOf(1975, 1));
    expect(s.unlockedTech).toContain('microprocessor');
    expect(s.unlockedTech).not.toContain('homeComputers');
    expect(s.firedEvents).toContain('oilShock');
    expect(s.log.some((e) => e.kind === 'tech' && e.important)).toBe(true);
  });

  test('era modifiers expire', () => {
    const s = stepMany(richGame(), weekOf(1975, 6));
    expect(s.modifiers.find((m) => m.sourceId === 'oilShock')).toBeUndefined();
  });

  test('monthly reports are written and capped', () => {
    const s = stepMany(richGame(), weekOf(1974, 1));
    expect(s.finance.reports.length).toBe(24);
    expect(s.finance.annual.map((a) => a.year)).toEqual([1970, 1971]);
    const last = s.finance.reports.at(-1)!;
    expect(last).toMatchObject({ year: 1973, month: 12 });
    expect(last.net).toBeLessThan(0); // founder salary and rent, no income
  });

  test('a company that never earns anything goes bankrupt after three month-ends in the red', () => {
    const s = stepMany(freshGame(), END_WEEK);
    expect(s.status).toBe('bankrupt');
    expect(s.finance.monthsInRed).toBe(3);
    expect(s.log.filter((e) => e.kind === 'finance' && e.important).length).toBe(3);
    expect(step(s)).toBe(s); // a finished game no longer ticks
  });

  test('a solvent company reaches the end of 1985', () => {
    const s = stepMany(richGame(), END_WEEK + 10);
    expect(s.week).toBe(END_WEEK);
    expect(s.status).toBe('finished');
    expect(s.log.length).toBeLessThanOrEqual(200);
    assertFiniteNumbers(s);
  });
});
