import { CONFIG } from '../config';
import type { GameState } from '../types';
import { clamp } from '../util';

const R = CONFIG.reputation;

export function changeReputation(state: GameState, delta: number): void {
  state.company.reputation = clamp(state.company.reputation + delta, R.min, R.max);
}

/** Reputation drifts toward a target set by the average review of products currently on sale. */
export function reputationTarget(state: GameState): number {
  const onSale = state.products.filter((p) => p.status === 'onSale');
  if (onSale.length === 0) return R.idleTarget;
  const avgReview = onSale.reduce((sum, p) => sum + p.reviewScore, 0) / onSale.length;
  return clamp((avgReview - R.targetReviewOffset) * R.targetPerReviewPoint, R.min, R.max);
}

export function driftReputation(state: GameState): void {
  const target = reputationTarget(state);
  changeReputation(state, (target - state.company.reputation) * R.driftPerWeek);
}
