import { END_WEEK, fractionalYear, isMonthStart } from './calendar';
import { Rng } from './rng';
import { advanceContracts, refreshContractOffers } from './systems/contracts';
import { advanceProjects } from './systems/development';
import { checkMilestones, runScheduledEvents } from './systems/events';
import { closeMonth, payWeeklyCosts, rollWeek } from './systems/finance';
import { simulateSales } from './systems/market';
import { refreshCandidates } from './systems/staff';
import { driftReputation } from './systems/reputation';
import type { GameState } from './types';
import { addLog, cloneState, inflation } from './util';

/**
 * Advances the game by exactly one week. Pure: returns a new state and never mutates `prev`.
 * The order of systems below is part of the deterministic contract.
 */
export function step(prev: GameState): GameState {
  if (prev.status !== 'playing') return prev;
  const state = cloneState(prev);
  const rng = new Rng(state.rng);
  const infl = inflation(fractionalYear(state.week));

  // 1. this week's work and sales
  advanceProjects(state);
  advanceContracts(state);
  simulateSales(state, rng);
  payWeeklyCosts(state, infl);
  driftReputation(state);

  // 2. advance the calendar
  rollWeek(state);
  state.week += 1;
  if (isMonthStart(state.week)) {
    closeMonth(state);
    if (state.status === 'playing') monthlyRefresh(state, rng);
  }

  // 3. scheduled history and milestones
  if (state.status === 'playing') {
    runScheduledEvents(state);
    checkMilestones(state);
  }

  state.company.peakCash = Math.max(state.company.peakCash, state.company.cash);
  state.stats.peakEmployees = Math.max(state.stats.peakEmployees, state.employees.length);

  if (state.status === 'playing' && state.week >= END_WEEK) {
    state.status = 'finished';
    addLog(state, 'info', 'The year 1985 draws to a close. Time to look back on what you built.', true);
  }
  return state;
}

/** Things that change once a month: job candidates and contract offers. */
export function monthlyRefresh(state: GameState, rng: Rng): void {
  refreshCandidates(state, rng);
  refreshContractOffers(state, rng);
}

/** Runs `weeks` ticks (stops early if the game ends). */
export function stepMany(state: GameState, weeks: number): GameState {
  let s = state;
  for (let i = 0; i < weeks && s.status === 'playing'; i++) s = step(s);
  return s;
}
