// Scripted player strategies for headless runs and balance scripts. Sim-only imports.
import { PRODUCT_TYPES } from '../src/data';
import {
  CONFIG,
  categoryWeeklyDemand,
  dispatch,
  getProductType,
  getSegment,
  isProductTypeAvailable,
  step,
  targetableSegments,
} from '../src/sim';
import type { Command, GameState, ProjectScope } from '../src/sim';

export interface RunLog {
  commands: { week: number; cmd: Command }[];
  rejected: number;
}

export type Strategy = (s: GameState, log: RunLog) => GameState;

function apply(s: GameState, cmd: Command, log: RunLog): GameState {
  const r = dispatch(s, cmd);
  if (!r.ok) {
    log.rejected++;
    return s;
  }
  log.commands.push({ week: s.week, cmd });
  return r.state;
}

const idle = (s: GameState) => s.employees.filter((e) => e.projectId === null && e.contractId === null);
const weeklyPayroll = (s: GameState) => s.employees.reduce((a, e) => a + e.salary, 0) / CONFIG.calendar.weeksPerYear;

function takeContracts(s: GameState, log: RunLog, keep = 0): GameState {
  for (const offer of [...s.contractOffers].sort((a, b) => b.fee / b.weeks - a.fee / a.weeks)) {
    const free = idle(s).filter((e) => !e.isFounder || keep === 0);
    if (free.length - keep < offer.staffRequired) continue;
    const team = [...free].sort((a, b) => b.skills.coding - a.skills.coding).slice(0, offer.staffRequired);
    s = apply(s, { type: 'acceptContract', offerId: offer.id, employeeIds: team.map((e) => e.id) }, log);
  }
  return s;
}

/** Best (type, segment) by expected category revenue per week. */
function pickMarket(s: GameState) {
  let best: { typeId: (typeof PRODUCT_TYPES)[number]['id']; segmentId: ReturnType<typeof targetableSegments>[number]['id']; value: number } | null = null;
  for (const t of PRODUCT_TYPES) {
    if (!isProductTypeAvailable(s, t.id)) continue;
    for (const seg of targetableSegments(s, t.id)) {
      // avoid competing with our own products already on sale
      const own = s.products.filter((p) => p.status === 'onSale' && p.productTypeId === t.id && p.segmentId === seg.id).length;
      const inDev = s.projects.filter((p) => p.productTypeId === t.id && p.segmentId === seg.id).length;
      const value = (categoryWeeklyDemand(s, t.id, seg.id) * (t.suggestedPrice[seg.id] ?? seg.referencePrice)) / (1 + own + inDev);
      if (!best || value > best.value) best = { typeId: t.id, segmentId: seg.id, value };
    }
  }
  return best;
}

export interface ProductStrategyOptions {
  focus: { features: number; polish: number; speed: number };
  scope?: ProjectScope;
}

/** A sensible product-focused player: products always, contracts for idle staff, hires when cash allows. */
export const makeProductStrategy = (opts: ProductStrategyOptions): Strategy => (s, log) => {
  // 1. launch anything finished
  for (const p of s.projects.filter((x) => x.status === 'readyToLaunch')) {
    const type = getProductType(p.productTypeId);
    const seg = getSegment(p.segmentId);
    s = apply(s, {
      type: 'launchProduct', projectId: p.id, productName: `${p.name} v1`,
      price: type.suggestedPrice[p.segmentId] ?? seg.referencePrice, marketingWeekly: Math.round(seg.marketingReference / 2),
    }, log);
  }

  // 2. emergency: fire the most expensive hire if we are about to go under
  if (s.company.cash < 0 && s.employees.length > 1) {
    const victim = [...s.employees].filter((e) => !e.isFounder).sort((a, b) => b.salary - a.salary)[0]!;
    s = apply(s, { type: 'fireEmployee', employeeId: victim.id }, log);
  }

  // 3. hire when there is a comfortable cushion
  const year = 1970 + Math.floor(s.week / 52);
  const cap = 3 + Math.max(0, year - 1972) * 4;
  if (s.employees.length < cap && s.company.cash > 26 * (weeklyPayroll(s) + 300) + 10_000 && s.candidates.length > 0) {
    const best = [...s.candidates].sort((a, b) => b.skills.coding + b.skills.design - (a.skills.coding + a.skills.design))[0]!;
    s = apply(s, { type: 'hireEmployee', candidateId: best.id }, log);
  }

  // 4. start a project with idle staff
  const free = idle(s);
  const canAfford = s.company.cash > 8 * (weeklyPayroll(s) + 200);
  if (free.length > 0 && canAfford && (s.projects.length === 0 || free.length >= 3)) {
    const market = pickMarket(s);
    if (market) {
      const team = free.slice(0, 8);
      const scope = opts.scope ?? (team.length >= 6 ? 'epic' : team.length >= 3 ? 'large' : 'medium');
      s = apply(s, {
        type: 'startProject', name: `${getProductType(market.typeId).name} ${s.stats.productsLaunched + s.projects.length + 1}`,
        productTypeId: market.typeId, segmentId: market.segmentId, scope,
        focus: opts.focus, weeklyBudget: 100 * team.length, employeeIds: team.map((e) => e.id),
      }, log);
    }
  }

  // 5. leftover idle staff do contract work
  return takeContracts(s, log);
};

export const productStrategy = makeProductStrategy({ focus: { features: 60, polish: 40, speed: 10 } });

/** Never builds products: contract work only. */
export const contractsOnlyStrategy: Strategy = (s, log) => takeContracts(s, log);

/** Runs a strategy until the game ends; `onWeek` sees every state for invariant checks. */
export function runGame(start: GameState, strategy: Strategy, onWeek?: (s: GameState) => void) {
  const log: RunLog = { commands: [], rejected: 0 };
  let s = start;
  while (s.status === 'playing') {
    s = strategy(s, log);
    s = step(s);
    onWeek?.(s);
  }
  return { state: s, log };
}

/** Re-applies a recorded command log to a fresh game: same seed + same commands must give the same history. */
export function replay(start: GameState, commands: RunLog['commands']): GameState {
  let s = start;
  let i = 0;
  while (s.status === 'playing') {
    while (i < commands.length && commands[i]!.week === s.week) {
      const r = dispatch(s, commands[i]!.cmd);
      if (!r.ok) throw new Error(`replay diverged at week ${s.week}: ${r.error}`);
      s = r.state;
      i++;
    }
    s = step(s);
  }
  return s;
}
