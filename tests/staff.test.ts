import { CONFIG, dispatch, step, weekOf } from '../src/sim';
import type { Command, GameState } from '../src/sim';
import { askingSalary, hireFee, severance } from '../src/sim/systems/staff';
import { freshGame } from './helpers';

function must(s: GameState, c: Command): GameState {
  const r = dispatch(s, c);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

describe('staff', () => {
  test('a new game has a candidate pool that refreshes monthly', () => {
    let s = freshGame();
    expect(s.candidates).toHaveLength(CONFIG.staff.candidatesPerRefresh);
    const first = s.candidates.map((c) => c.id);
    while (s.week < 5) s = step(s);
    expect(s.candidates.map((c) => c.id)).not.toEqual(first);
  });

  test('salaries rise with skill and with the years', () => {
    const skills = { coding: 50, design: 20, testing: 20 };
    expect(askingSalary({ ...skills, coding: 80 }, 0)).toBeGreaterThan(askingSalary(skills, 0));
    expect(askingSalary(skills, weekOf(1985, 1))).toBeGreaterThan(askingSalary(skills, 0));
    expect(askingSalary(skills, 0)).toBeGreaterThan(8_000);
    expect(askingSalary(skills, 0)).toBeLessThan(16_000);
  });

  test('hiring costs a recruiting fee, then a weekly salary', () => {
    let s = freshGame();
    const c = s.candidates[0]!;
    const cash = s.company.cash;
    s = must(s, { type: 'hireEmployee', candidateId: c.id });
    expect(s.employees).toHaveLength(2);
    expect(s.candidates.some((x) => x.id === c.id)).toBe(false);
    expect(s.company.cash).toBe(cash - hireFee(c.salary));
    const next = step(s);
    expect(next.finance.lastWeek.expenses.salaries).toBeCloseTo((CONFIG.start.founderSalary + c.salary) / 52);
  });

  test('hiring needs cash for the fee', () => {
    const s = freshGame();
    s.company.cash = 0;
    expect(dispatch(s, { type: 'hireEmployee', candidateId: s.candidates[0]!.id }).ok).toBe(false);
  });

  test('firing pays severance, frees projects and fails contracts', () => {
    let s = freshGame();
    s = must(s, { type: 'hireEmployee', candidateId: s.candidates[0]!.id });
    const hire = s.employees[1]!;
    hire.skills.coding = 100; // qualifies for any one-person offer
    const offer = s.contractOffers[0]!;
    s = must(s, { type: 'acceptContract', offerId: offer.id, employeeIds: [hire.id] });
    const rep = s.company.reputation;
    const cash = s.company.cash;
    s = must(s, { type: 'fireEmployee', employeeId: hire.id });
    expect(s.employees).toHaveLength(1);
    expect(s.contracts).toHaveLength(0);
    expect(s.company.reputation).toBeLessThan(rep);
    expect(s.company.cash).toBe(cash - severance(hire.salary));
  });

  test('the founder cannot be fired', () => {
    const s = freshGame();
    expect(dispatch(s, { type: 'fireEmployee', employeeId: s.employees[0]!.id }).ok).toBe(false);
  });
});
