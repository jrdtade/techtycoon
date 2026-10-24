// Headless 16-year runs with scripted strategies. These are the "nothing breaks" tests.
import { CONFIG, END_WEEK, loadSave, newGame, saveToJson, stepMany, weekOf } from '../src/sim';
import type { GameState } from '../src/sim';
import { assertFiniteNumbers } from './helpers';
import { contractsOnlyStrategy, makeProductStrategy, productStrategy, replay, runGame } from './strategy';

function checkInvariants(s: GameState): void {
  assertFiniteNumbers(s);
  expect(s.employees.length).toBeGreaterThanOrEqual(1);
  expect(s.employees.filter((e) => e.isFounder)).toHaveLength(1);
  const projectIds = new Set(s.projects.map((p) => p.id));
  const contractIds = new Set(s.contracts.map((c) => c.id));
  for (const e of s.employees) {
    expect(e.salary).toBeGreaterThan(0);
    for (const v of Object.values(e.skills)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(e.projectId !== null && e.contractId !== null).toBe(false);
    if (e.projectId) expect(projectIds.has(e.projectId)).toBe(true);
    if (e.contractId) expect(contractIds.has(e.contractId)).toBe(true);
  }
  for (const c of s.contracts) {
    expect(c.weeksLeft).toBeGreaterThan(0);
    expect(s.employees.filter((e) => e.contractId === c.id)).toHaveLength(c.staffRequired);
  }
  for (const p of s.projects) {
    expect(p.workDone).toBeGreaterThanOrEqual(0);
    expect(p.workDone).toBeLessThanOrEqual(p.workRequired + 1e-9);
    expect(p.bugs).toBeGreaterThanOrEqual(0);
  }
  for (const p of s.products) {
    expect(p.unitsSold).toBeGreaterThanOrEqual(0);
    expect(p.unitCarry).toBeGreaterThanOrEqual(0);
    expect(p.unitCarry).toBeLessThan(1);
    expect(p.recentWeeklyUnits.length).toBeLessThanOrEqual(CONFIG.history.recentWeeklyUnits);
  }
  expect(s.company.reputation).toBeGreaterThanOrEqual(0);
  expect(s.company.reputation).toBeLessThanOrEqual(100);
  expect(s.log.length).toBeLessThanOrEqual(CONFIG.history.maxLogEntries);
  expect(s.finance.reports.length).toBeLessThanOrEqual(CONFIG.history.maxMonthlyReports);
}

describe('headless 16-year run (product strategy)', () => {
  const seed = 1970;
  const checkpoints: GameState[] = [];
  let redMonthsIn1970 = 0;
  const { state: final, log } = runGame(newGame({ companyName: 'Headless Inc.', seed }), productStrategy, (s) => {
    checkInvariants(s);
    if (s.week <= 52 && s.finance.monthsInRed > 0) redMonthsIn1970++;
    if (s.week % 104 === 0) checkpoints.push(s);
  });

  test('plays all the way to the end of 1985', () => {
    expect(final.status).toBe('finished');
    expect(final.week).toBe(END_WEEK);
    expect(final.stats.productsLaunched).toBeGreaterThan(10);
    expect(final.company.cash).toBeGreaterThan(CONFIG.start.cash);
    expect(log.commands.length).toBeGreaterThan(100);
  });

  test('survives 1970 without a single month-end in the red', () => {
    expect(redMonthsIn1970).toBe(0);
    expect(checkpoints.length).toBeGreaterThan(0);
  });

  test('saves round-trip at every checkpoint and continue identically', () => {
    for (const s of checkpoints) {
      const loaded = loadSave(saveToJson(s, '2026-01-01T00:00:00.000Z'));
      expect(loaded.ok).toBe(true);
      if (loaded.ok) expect(loaded.state).toEqual(s);
    }
    const mid = checkpoints[3]!;
    const loaded = loadSave(saveToJson(mid, 'x'));
    if (!loaded.ok) throw new Error(loaded.error);
    expect(JSON.stringify(stepMany(loaded.state, 52))).toBe(JSON.stringify(stepMany(mid, 52)));
  });

  test('replaying the command log on the same seed reproduces the history exactly', () => {
    const replayed = replay(newGame({ companyName: 'Headless Inc.', seed }), log.commands);
    expect(JSON.stringify(replayed)).toBe(JSON.stringify(final));
  });

  test('state size stays bounded', () => {
    expect(JSON.stringify(final).length).toBeLessThan(400_000);
  });
});

describe('decisions matter', () => {
  const run = (strategy: typeof productStrategy, seed = 7) => runGame(newGame({ companyName: 'X', seed }), strategy).state;

  test('building products beats contract work alone by a wide margin', () => {
    const products = run(productStrategy);
    const contracts = run(contractsOnlyStrategy);
    expect(contracts.status).toBe('finished');
    expect(contracts.stats.productsLaunched).toBe(0);
    expect(products.company.lifetimeRevenue).toBeGreaterThan(10 * contracts.company.lifetimeRevenue);
  });

  test('polish-first and rush-to-market strategies produce visibly different companies', () => {
    const polish = run(makeProductStrategy({ focus: { features: 50, polish: 50, speed: 0 } }));
    const rush = run(makeProductStrategy({ focus: { features: 70, polish: 0, speed: 100 } }));
    expect(polish.stats.bestReview).toBeGreaterThan(rush.stats.bestReview + 1);
    expect(polish.company.reputation).toBeGreaterThan(rush.company.reputation);
    expect(polish.company.lifetimeRevenue).toBeGreaterThan(2 * rush.company.lifetimeRevenue);
  });

  test('different seeds give different but sane histories', () => {
    const a = run(productStrategy, 1);
    const b = run(productStrategy, 2);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    expect(a.status).toBe('finished');
    expect(b.status).toBe('finished');
    expect(weekOf(1986, 1)).toBe(END_WEEK);
  });
});
