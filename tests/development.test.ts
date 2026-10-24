import { dispatch, step } from '../src/sim';
import type { Command, Employee, GameState } from '../src/sim';
import { focusShares, teamProgress, workRequiredFor } from '../src/sim/systems/development';
import { freshGame } from './helpers';

function must(s: GameState, c: Command): GameState {
  const r = dispatch(s, c);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

function worker(id: string, coding: number, design = 40, testing = 40): Employee {
  return {
    id, name: id, salary: 10_000, hiredWeek: 0, isFounder: false,
    skills: { coding, design, testing }, weeksWorked: 0, projectId: null, contractId: null,
  };
}

/** Starts a project with the founder and runs until it is ready. */
function build(focus = { features: 60, polish: 40, speed: 0 }, setup?: (s: GameState) => void) {
  let s = freshGame();
  s.company.cash = 1e6;
  setup?.(s);
  s = must(s, {
    type: 'startProject', name: 'Ledger', productTypeId: 'accounting', segmentId: 'mainframe', scope: 'medium',
    focus, weeklyBudget: 100, employeeIds: s.employees.map((e) => e.id),
  });
  const started = s.week;
  while (s.projects[0]!.status !== 'readyToLaunch') s = step(s);
  return { s, project: s.projects[0]!, weeks: s.week - started };
}

describe('focus and speed', () => {
  test('speed is not a share of output: features + polish always split all output', () => {
    const f = focusShares({ features: 30, polish: 30, speed: 40 });
    expect(f.featureShare + f.polishShare).toBeCloseTo(1);
    expect(f.speedShare).toBeCloseTo(0.4);
  });

  test('speed shortens the project, adds bugs and lowers quality', () => {
    expect(workRequiredFor('accounting', 'medium', { features: 50, polish: 50, speed: 100 })).toBeLessThan(
      workRequiredFor('accounting', 'medium', { features: 50, polish: 50, speed: 0 }),
    );
    const slow = build({ features: 60, polish: 40, speed: 0 });
    const fast = build({ features: 60, polish: 40, speed: 60 });
    expect(fast.weeks).toBeLessThan(slow.weeks);
    expect(fast.project.featurePts + fast.project.polishPts).toBeLessThan(slow.project.featurePts + slow.project.polishPts);
    const launch = (b: typeof slow) =>
      must(b.s, { type: 'launchProduct', projectId: b.project.id, productName: 'X', price: 5000, marketingWeekly: 0 }).products[0]!;
    expect(launch(fast).quality).toBeLessThan(launch(slow).quality);
  });

  test('polish focus earns polish points, feature focus earns feature points', () => {
    const features = build({ features: 100, polish: 0, speed: 0 }).project;
    const polish = build({ features: 0, polish: 100, speed: 0 }).project;
    expect(features.polishPts).toBe(0);
    expect(polish.featurePts).toBe(0);
  });
});

describe('team and budget', () => {
  test('bigger teams and bigger budgets are faster, with diminishing returns', () => {
    const one = [worker('a', 50)];
    const two = [worker('a', 50), worker('b', 50)];
    expect(teamProgress(two, 0)).toBeGreaterThan(teamProgress(one, 0));
    expect(teamProgress(two, 0)).toBeLessThan(2 * teamProgress(one, 0));
    expect(teamProgress(one, 300)).toBeGreaterThan(teamProgress(one, 0));
    expect(teamProgress(one, 1e9)).toBeLessThanOrEqual(2 * teamProgress(one, 0));
  });

  test('skilled staff produce more points and fewer bugs', () => {
    const weak = build(undefined, (s) => (s.employees[0]!.skills = { coding: 20, design: 20, testing: 20 })).project;
    const strong = build(undefined, (s) => (s.employees[0]!.skills = { coding: 80, design: 80, testing: 80 })).project;
    expect(strong.featurePts).toBeGreaterThan(weak.featurePts);
    expect(strong.polishPts).toBeGreaterThan(weak.polishPts);
    expect(strong.bugs).toBeLessThan(weak.bugs);
  });

  test('working on a project grows skills', () => {
    const { s } = build();
    const founder = s.employees[0]!;
    expect(founder.skills.coding).toBeGreaterThan(45);
    expect(founder.weeksWorked).toBeGreaterThan(0);
  });
});

describe('project lifecycle', () => {
  test('a finished project auto-pauses, then launches into a product', () => {
    const { s, project } = build();
    expect(s.log.at(-1)).toMatchObject({ kind: 'project', important: true });
    expect(s.employees[0]!.projectId).toBe(project.id);
    const repBefore = s.company.reputation;
    const after = must(s, { type: 'launchProduct', projectId: project.id, productName: 'Ledger 1', price: 5000, marketingWeekly: 100 });
    expect(after.projects).toHaveLength(0);
    expect(after.products[0]).toMatchObject({ name: 'Ledger 1', price: 5000, status: 'onSale' });
    expect(after.employees[0]!.projectId).toBeNull();
    expect(after.stats.productsLaunched).toBe(1);
    expect(after.company.reputation).not.toBe(repBefore);
  });

  test('budget is only spent while someone works on the project', () => {
    let s = freshGame();
    s = must(s, {
      type: 'startProject', name: 'P', productTypeId: 'games', segmentId: 'academic', scope: 'small',
      focus: { features: 50, polish: 50, speed: 0 }, weeklyBudget: 500, employeeIds: [s.employees[0]!.id],
    });
    expect(step(s).finance.lastWeek.expenses.devBudget).toBe(500);
    s = must(s, { type: 'assignEmployee', employeeId: s.employees[0]!.id, projectId: null });
    const held = step(s);
    expect(held.finance.lastWeek.expenses.devBudget).toBe(0);
    expect(held.projects[0]!.workDone).toBe(0);
  });

  test('commands are validated', () => {
    const s = freshGame();
    const base: Command = {
      type: 'startProject', name: 'P', productTypeId: 'accounting', segmentId: 'mainframe', scope: 'medium',
      focus: { features: 50, polish: 50, speed: 0 }, weeklyBudget: 0, employeeIds: [s.employees[0]!.id],
    };
    expect(dispatch(s, { ...base, segmentId: 'home' }).ok).toBe(false); // segment not open in 1970
    expect(dispatch(s, { ...base, productTypeId: 'spreadsheet' }).ok).toBe(false); // not invented yet
    expect(dispatch(s, { ...base, productTypeId: 'games', segmentId: 'mainframe' }).ok).toBe(false); // no demand
    expect(dispatch(s, { ...base, name: '  ' }).ok).toBe(false);
    expect(dispatch(s, { ...base, weeklyBudget: -1 }).ok).toBe(false);
    expect(dispatch(s, { ...base, weeklyBudget: NaN }).ok).toBe(false);
    expect(dispatch(s, { ...base, employeeIds: [] }).ok).toBe(false);
    expect(dispatch(s, { ...base, focus: { features: 0, polish: 0, speed: 100 } }).ok).toBe(false);
    const started = must(s, base);
    expect(dispatch(started, base).ok).toBe(false); // founder is busy now
    expect(dispatch(started, { type: 'launchProduct', projectId: started.projects[0]!.id, productName: 'X', price: 1, marketingWeekly: 0 }).ok).toBe(false);
  });
});

describe('contracts', () => {
  test('a new game offers a contract the founder can take', () => {
    const s = freshGame();
    const offer = s.contractOffers[0]!;
    expect(offer.staffRequired).toBe(1);
    expect(offer.minSkill).toBeLessThanOrEqual(s.employees[0]!.skills.coding);
  });

  test('completing a contract pays the fee and frees the staff', () => {
    let s = freshGame();
    const offer = s.contractOffers[0]!;
    s = must(s, { type: 'acceptContract', offerId: offer.id, employeeIds: [s.employees[0]!.id] });
    expect(s.employees[0]!.contractId).toBe(offer.id);
    expect(dispatch(s, { type: 'acceptContract', offerId: offer.id, employeeIds: [s.employees[0]!.id] }).ok).toBe(false);
    const cashBefore = s.company.cash;
    let paid = 0;
    for (let w = 0; w < offer.weeks; w++) {
      s = step(s);
      paid += s.finance.lastWeek.income.contracts;
    }
    expect(paid).toBe(offer.fee);
    expect(s.contracts).toHaveLength(0);
    expect(s.employees[0]!.contractId).toBeNull();
    expect(s.stats.contractsCompleted).toBe(1);
    expect(s.company.cash).toBeGreaterThan(cashBefore);
  });

  test('abandoning a contract costs reputation and pays nothing', () => {
    let s = freshGame();
    const offer = s.contractOffers[0]!;
    s = must(s, { type: 'acceptContract', offerId: offer.id, employeeIds: [s.employees[0]!.id] });
    const rep = s.company.reputation;
    s = must(s, { type: 'abandonContract', contractId: offer.id });
    expect(s.company.reputation).toBeLessThan(rep);
    expect(s.employees[0]!.contractId).toBeNull();
    expect(s.company.lifetimeRevenue).toBe(0);
  });

  test('offers refresh monthly', () => {
    let s = freshGame();
    const first = s.contractOffers.map((o) => o.id);
    while (s.week < 5) s = step(s);
    expect(s.contractOffers.map((o) => o.id)).not.toEqual(first);
  });
});

describe('reputation', () => {
  test('good products pull reputation up, bad ones pull it down', () => {
    const { s, project } = build();
    let good = must(s, { type: 'launchProduct', projectId: project.id, productName: 'G', price: 5000, marketingWeekly: 0 });
    good.products[0]!.reviewScore = 9.5;
    good.company.reputation = 30;
    const bad = JSON.parse(JSON.stringify(good)) as GameState;
    bad.products[0]!.reviewScore = 3;
    for (let i = 0; i < 20; i++) good = step(good);
    let b = bad;
    for (let i = 0; i < 20; i++) b = step(b);
    expect(good.company.reputation).toBeGreaterThan(30);
    expect(b.company.reputation).toBeLessThan(30);
  });
});
