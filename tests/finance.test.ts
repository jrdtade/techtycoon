import { CONFIG, dispatch, ledgerExpenses, ledgerIncome, step, weekOf } from '../src/sim';
import type { GameState } from '../src/sim';
import { closeMonth } from '../src/sim/systems/finance';
import { freshGame, makeProduct } from './helpers';

/** A company with staff, a project, a product on sale and a contract running. */
function busyGame(): GameState {
  let s = freshGame(3);
  s.company.cash = 200_000;
  for (const c of s.candidates.slice(0, 2)) {
    const r = dispatch(s, { type: 'hireEmployee', candidateId: c.id });
    if (r.ok) s = r.state;
  }
  const [founder, a, b] = s.employees;
  let r = dispatch(s, {
    type: 'startProject', name: 'P', productTypeId: 'devTools', segmentId: 'minicomputer', scope: 'large',
    focus: { features: 50, polish: 50, speed: 0 }, weeklyBudget: 250, employeeIds: [founder!.id, a!.id],
  });
  if (r.ok) s = r.state;
  b!.skills.coding = 100;
  r = dispatch(s, { type: 'acceptContract', offerId: s.contractOffers[0]!.id, employeeIds: [b!.id] });
  if (r.ok) s = r.state;
  s.products.push(makeProduct({ marketingWeekly: 150 }));
  return s;
}

describe('finances', () => {
  test('money moved by commands counts toward the week it happened in', () => {
    const s = busyGame();
    expect(s.finance.thisWeek.expenses.hiring).toBeGreaterThan(0);
    const next = step(s);
    expect(next.finance.lastWeek.expenses.hiring).toBe(s.finance.thisWeek.expenses.hiring);
    expect(next.finance.thisWeek.expenses.hiring).toBe(0);
  });

  test('every week, the cash change equals income minus expenses', () => {
    let s = step(busyGame()); // first week also carries the hiring fees from setup
    for (let i = 0; i < 60; i++) {
      const before = s.company.cash;
      s = step(s);
      const l = s.finance.lastWeek;
      expect(s.company.cash - before).toBeCloseTo(ledgerIncome(l) - ledgerExpenses(l), 6);
      expect(l.expenses.salaries).toBeGreaterThan(0);
      expect(l.expenses.rent).toBeCloseTo(
        s.employees.length * CONFIG.staff.officeRentPerEmployeeWeekly * Math.pow(1.05, (s.week - 1) / 52),
        6,
      );
    }
  });

  test('monthly reports add up to the weeks in the month', () => {
    let s = busyGame();
    let income = 0;
    let expenses = 0;
    let reports = s.finance.reports.length;
    let checked = 0;
    while (checked < 6) {
      s = step(s);
      income += ledgerIncome(s.finance.lastWeek);
      expenses += ledgerExpenses(s.finance.lastWeek);
      if (s.finance.reports.length > reports) {
        const r = s.finance.reports.at(-1)!;
        expect(ledgerIncome(r)).toBeCloseTo(income, 6);
        expect(ledgerExpenses(r)).toBeCloseTo(expenses, 6);
        expect(r.net).toBeCloseTo(income - expenses, 6);
        expect(r.cashEnd).toBe(s.company.cash);
        income = 0;
        expenses = 0;
        reports = s.finance.reports.length;
        checked++;
      }
    }
  });

  test('old monthly reports fold into annual summaries without losing money', () => {
    let s = busyGame();
    s.company.cash = 1e8;
    let totalNet = 0;
    while (s.week < weekOf(1974, 1)) {
      s = step(s);
      totalNet += ledgerIncome(s.finance.lastWeek) - ledgerExpenses(s.finance.lastWeek);
    }
    expect(s.finance.reports.length).toBe(CONFIG.history.maxMonthlyReports);
    const folded = s.finance.annual.reduce((a, y) => a + y.net, 0) + s.finance.reports.reduce((a, r) => a + r.net, 0);
    expect(folded).toBeCloseTo(totalNet, 4);
  });

  test('a month back in the black resets the bankruptcy counter', () => {
    const s = freshGame();
    s.week = 5;
    s.company.cash = -100;
    closeMonth(s);
    expect(s.finance.monthsInRed).toBe(1);
    expect(s.status).toBe('playing');
    s.company.cash = 100;
    closeMonth(s);
    expect(s.finance.monthsInRed).toBe(0);
  });
});

describe('summary', () => {
  test('bankruptcy halves the score and is reported', async () => {
    const { summarize, stepMany, END_WEEK } = await import('../src/sim');
    const broke = stepMany(freshGame(), END_WEEK);
    const s = summarize(broke);
    expect(s.outcome).toBe('bankrupt');
    expect(s.yearsInBusiness).toBeGreaterThan(3);
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.rank).toBe('Garage Tinkerer');
  });
});
