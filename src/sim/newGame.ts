import { CONFIG } from './config';
import { seedRng } from './rng';
import { initialFinance } from './systems/finance';
import { runScheduledEvents } from './systems/events';
import type { GameState } from './types';
import { addLog, newId } from './util';

export const SCHEMA_VERSION = 1;

export interface NewGameOptions {
  companyName: string;
  founderName?: string;
  seed: number;
}

export function newGame(opts: NewGameOptions): GameState {
  const state: GameState = {
    schemaVersion: SCHEMA_VERSION,
    seed: opts.seed >>> 0,
    rng: seedRng(opts.seed),
    week: 0,
    status: 'playing',
    company: {
      name: opts.companyName.trim() || 'Garage Software',
      cash: CONFIG.start.cash,
      reputation: CONFIG.start.reputation,
      lifetimeRevenue: 0,
      peakCash: CONFIG.start.cash,
    },
    employees: [],
    candidates: [],
    contractOffers: [],
    contracts: [],
    projects: [],
    products: [],
    unlockedTech: [],
    firedEvents: [],
    milestonesReached: [],
    modifiers: [],
    finance: initialFinance(),
    log: [],
    stats: {
      productsLaunched: 0,
      contractsCompleted: 0,
      peakEmployees: 1,
      bestReview: 0,
      bestProductName: null,
      totalSalesRevenue: 0,
      totalContractRevenue: 0,
    },
    nextId: 1,
    nextLogSeq: 1,
  };

  state.employees.push({
    id: newId(state, 'emp'),
    name: opts.founderName?.trim() || 'You (Founder)',
    salary: CONFIG.start.founderSalary,
    hiredWeek: 0,
    isFounder: true,
    skills: { ...CONFIG.start.founderSkills },
    weeksWorked: 0,
    projectId: null,
    contractId: null,
  });

  runScheduledEvents(state);
  addLog(state, 'info', `${state.company.name} is founded in a garage in Palo Verde. The year is 1970.`);
  return state;
}
