import { CONFIG } from '../config';
import type { GameState } from '../types';
import { clamp } from '../util';

const R = CONFIG.reputation;

export function changeReputation(state: GameState, delta: number): void {
  state.company.reputation = clamp(state.company.reputation + delta, R.min, R.max);
}

/** Reputation drifts toward the average review (×10) of products currently on sale. */
export function driftReputation(state: GameState): void {
  const onSale = state.products.filter((p) => p.status === 'onSale');
  const target =
    onSale.length > 0 ? (onSale.reduce((sum, p) => sum + p.reviewScore, 0) / onSale.length) * 10 : R.idleTarget;
  changeReputation(state, (target - state.company.reputation) * R.driftPerWeek);
}
