import { CONFIG, SCOPES } from './config';
import { getProductType, getSegment, isProductTypeAvailable, isSegmentOpen } from './content';
import { failContract } from './systems/contracts';
import { workRequiredFor } from './systems/development';
import { computeQuality, retireProduct } from './systems/market';
import { changeReputation } from './systems/reputation';
import type { Command, DispatchResult, Employee, Focus, GameState, Id } from './types';
import { addLog, cloneState, newId } from './util';

const MAX_NAME = 40;

function validName(name: string): string | null {
  const n = name.trim();
  if (n.length === 0) return 'Give it a name.';
  if (n.length > MAX_NAME) return `Names are limited to ${MAX_NAME} characters.`;
  return null;
}

function validFocus(f: Focus): boolean {
  const vals = [f.features, f.polish, f.speed];
  return vals.every((v) => Number.isFinite(v) && v >= 0 && v <= 100) && f.features + f.polish > 0;
}

function validMoney(n: number): boolean {
  return Number.isFinite(n) && n >= 0;
}

function isIdle(e: Employee): boolean {
  return e.projectId === null && e.contractId === null;
}

/** Resolves ids to idle employees, or returns an error. */
function idleEmployees(state: GameState, ids: Id[]): Employee[] | string {
  if (new Set(ids).size !== ids.length) return 'An employee was listed twice.';
  const result: Employee[] = [];
  for (const id of ids) {
    const e = state.employees.find((x) => x.id === id);
    if (!e) return 'No such employee.';
    if (!isIdle(e)) return `${e.name} is busy.`;
    result.push(e);
  }
  return result;
}

type Handler<C extends Command> = (state: GameState, cmd: C) => string | null;

/** Each handler validates first and returns an error string, or mutates the (cloned) state and returns null. */
const handlers: { [K in Command['type']]?: Handler<Extract<Command, { type: K }>> } = {
  startProject(state, cmd) {
    const nameError = validName(cmd.name);
    if (nameError) return nameError;
    if (!isProductTypeAvailable(state, cmd.productTypeId)) return 'That product type is not available yet.';
    if (!isSegmentOpen(state, cmd.segmentId)) return 'That market segment does not exist yet.';
    if ((getProductType(cmd.productTypeId).segmentDemand[cmd.segmentId] ?? 0) <= 0)
      return `Nobody buys ${getProductType(cmd.productTypeId).name} in ${getSegment(cmd.segmentId).name}.`;
    if (!SCOPES.includes(cmd.scope)) return 'Unknown scope.';
    if (!validFocus(cmd.focus)) return 'Focus sliders must be 0–100, with some features or polish.';
    if (!validMoney(cmd.weeklyBudget)) return 'Budget cannot be negative.';
    if (cmd.employeeIds.length === 0) return 'Assign at least one employee.';
    const team = idleEmployees(state, cmd.employeeIds);
    if (typeof team === 'string') return team;

    const id = newId(state, 'prj');
    state.projects.push({
      id,
      name: cmd.name.trim(),
      productTypeId: cmd.productTypeId,
      segmentId: cmd.segmentId,
      scope: cmd.scope,
      focus: { ...cmd.focus },
      weeklyBudget: Math.round(cmd.weeklyBudget),
      workRequired: workRequiredFor(cmd.productTypeId, cmd.scope, cmd.focus),
      workDone: 0,
      featurePts: 0,
      polishPts: 0,
      bugs: 0,
      startedWeek: state.week,
      status: 'inDevelopment',
    });
    for (const e of team) e.projectId = id;
    addLog(state, 'project', `Development starts on ${cmd.name.trim()} (${getProductType(cmd.productTypeId).name}, ${getSegment(cmd.segmentId).name}).`);
    return null;
  },

  assignEmployee(state, cmd) {
    const e = state.employees.find((x) => x.id === cmd.employeeId);
    if (!e) return 'No such employee.';
    if (e.contractId) return `${e.name} is on a contract.`;
    if (cmd.projectId !== null && !state.projects.some((p) => p.id === cmd.projectId)) return 'No such project.';
    e.projectId = cmd.projectId;
    return null;
  },

  setProjectBudget(state, cmd) {
    const p = state.projects.find((x) => x.id === cmd.projectId);
    if (!p) return 'No such project.';
    if (!validMoney(cmd.weeklyBudget)) return 'Budget cannot be negative.';
    p.weeklyBudget = Math.round(cmd.weeklyBudget);
    return null;
  },

  cancelProject(state, cmd) {
    const p = state.projects.find((x) => x.id === cmd.projectId);
    if (!p) return 'No such project.';
    for (const e of state.employees) if (e.projectId === p.id) e.projectId = null;
    state.projects = state.projects.filter((x) => x.id !== p.id);
    addLog(state, 'project', `${p.name} is cancelled.`);
    return null;
  },

  launchProduct(state, cmd) {
    const project = state.projects.find((x) => x.id === cmd.projectId);
    if (!project) return 'No such project.';
    if (project.status !== 'readyToLaunch') return 'That project is not finished yet.';
    const nameError = validName(cmd.productName);
    if (nameError) return nameError;
    if (!Number.isFinite(cmd.price) || cmd.price <= 0) return 'Price must be positive.';
    if (!validMoney(cmd.marketingWeekly)) return 'Marketing spend cannot be negative.';

    const q = computeQuality(project, state.week);
    const name = cmd.productName.trim();
    state.products.push({
      id: newId(state, 'prd'),
      name,
      productTypeId: project.productTypeId,
      segmentId: project.segmentId,
      launchWeek: state.week,
      price: Math.round(cmd.price),
      marketingWeekly: Math.round(cmd.marketingWeekly),
      quality: q.quality,
      reviewScore: q.reviewScore,
      bugs: Math.round(project.bugs),
      unitsSold: 0,
      revenue: 0,
      unitCarry: 0,
      recentWeeklyUnits: [],
      status: 'onSale',
      retiredWeek: null,
    });
    for (const e of state.employees) if (e.projectId === project.id) e.projectId = null;
    state.projects = state.projects.filter((x) => x.id !== project.id);

    state.stats.productsLaunched += 1;
    if (q.reviewScore > state.stats.bestReview) {
      state.stats.bestReview = q.reviewScore;
      state.stats.bestProductName = name;
    }
    const before = state.company.reputation;
    changeReputation(state, (q.reviewScore - 5) * CONFIG.reputation.launchDeltaPerPoint);
    const repDelta = state.company.reputation - before;
    const verdict =
      q.reviewScore >= 8.5 ? 'Critics rave' : q.reviewScore >= 7 ? 'Reviews are warm' : q.reviewScore >= 5 ? 'Reviews are mixed' : 'Reviewers are brutal';
    addLog(
      state,
      'launch',
      `${name} launches. ${verdict}: ${q.reviewScore.toFixed(1)}/10. Reputation ${repDelta >= 0 ? '+' : ''}${repDelta.toFixed(1)}.`,
    );
    return null;
  },

  acceptContract(state, cmd) {
    const offer = state.contractOffers.find((o) => o.id === cmd.offerId);
    if (!offer) return 'That offer is no longer available.';
    if (cmd.employeeIds.length !== offer.staffRequired)
      return `This contract needs exactly ${offer.staffRequired} ${offer.staffRequired === 1 ? 'person' : 'people'}.`;
    const team = idleEmployees(state, cmd.employeeIds);
    if (typeof team === 'string') return team;
    const avg = team.reduce((s, e) => s + e.skills.coding, 0) / team.length;
    if (avg < offer.minSkill) return `The client wants an average coding skill of ${offer.minSkill}.`;

    state.contractOffers = state.contractOffers.filter((o) => o.id !== offer.id);
    state.contracts.push({ ...offer, employeeIds: [...cmd.employeeIds], weeksLeft: offer.weeks, startedWeek: state.week });
    for (const e of team) e.contractId = offer.id;
    addLog(state, 'contract', `Contract signed: ${offer.job} for ${offer.client}, ${offer.weeks} weeks.`);
    return null;
  },

  abandonContract(state, cmd) {
    const c = state.contracts.find((x) => x.id === cmd.contractId);
    if (!c) return 'No such contract.';
    failContract(state, c, 'you pulled the team off the job');
    return null;
  },

  setPrice(state, cmd) {
    const p = state.products.find((x) => x.id === cmd.productId && x.status === 'onSale');
    if (!p) return 'No such product on sale.';
    if (!Number.isFinite(cmd.price) || cmd.price <= 0) return 'Price must be positive.';
    p.price = Math.round(cmd.price);
    return null;
  },

  setMarketing(state, cmd) {
    const p = state.products.find((x) => x.id === cmd.productId && x.status === 'onSale');
    if (!p) return 'No such product on sale.';
    if (!Number.isFinite(cmd.weekly) || cmd.weekly < 0) return 'Marketing spend cannot be negative.';
    p.marketingWeekly = Math.round(cmd.weekly);
    return null;
  },

  retireProduct(state, cmd) {
    const p = state.products.find((x) => x.id === cmd.productId && x.status === 'onSale');
    if (!p) return 'No such product on sale.';
    retireProduct(state, p, `${p.name} is withdrawn from sale.`);
    return null;
  },
};

/**
 * The only way the UI changes the game. Validates and applies a command, returning a new state.
 * The input state is never mutated.
 */
export function dispatch(state: GameState, cmd: Command): DispatchResult {
  if (state.status !== 'playing') return { ok: false, error: 'The game is over.' };
  const handler = handlers[cmd.type] as Handler<Command> | undefined;
  if (!handler) return { ok: false, error: `Command ${cmd.type} is not available yet.` };
  const next = cloneState(state);
  const error = handler(next, cmd);
  if (error) return { ok: false, error };
  return { ok: true, state: next };
}
