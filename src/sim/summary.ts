import { CONFIG } from './config';
import { formatDate } from './calendar';
import type { GameState } from './types';

export interface GameSummary {
  outcome: 'bankrupt' | 'finished' | 'playing';
  endDate: string;
  yearsInBusiness: number;
  finalCash: number;
  peakCash: number;
  lifetimeRevenue: number;
  salesRevenue: number;
  contractRevenue: number;
  productsLaunched: number;
  contractsCompleted: number;
  bestReviewed: { name: string; review: number } | null;
  topSeller: { name: string; revenue: number; units: number } | null;
  peakEmployees: number;
  finalEmployees: number;
  reputation: number;
  score: number;
  rank: string;
}

export function summarize(state: GameState): GameSummary {
  const sc = CONFIG.score;
  const top = [...state.products].sort((a, b) => b.revenue - a.revenue)[0];
  let score =
    Math.max(0, state.company.cash) * sc.perDollarCash +
    state.company.lifetimeRevenue * sc.perDollarLifetimeRevenue +
    state.company.reputation * sc.perReputationPoint +
    state.stats.productsLaunched * sc.perProductLaunched;
  if (state.status === 'bankrupt') score *= sc.bankruptcyMultiplier;
  score = Math.round(score);
  const rank = [...sc.ranks].reverse().find((r) => score >= r.min)?.title ?? sc.ranks[0].title;

  return {
    outcome: state.status,
    endDate: formatDate(state.week),
    yearsInBusiness: Math.round((state.week / CONFIG.calendar.weeksPerYear) * 10) / 10,
    finalCash: state.company.cash,
    peakCash: state.company.peakCash,
    lifetimeRevenue: state.company.lifetimeRevenue,
    salesRevenue: state.stats.totalSalesRevenue,
    contractRevenue: state.stats.totalContractRevenue,
    productsLaunched: state.stats.productsLaunched,
    contractsCompleted: state.stats.contractsCompleted,
    bestReviewed: state.stats.bestProductName ? { name: state.stats.bestProductName, review: state.stats.bestReview } : null,
    topSeller: top && top.revenue > 0 ? { name: top.name, revenue: top.revenue, units: top.unitsSold } : null,
    peakEmployees: state.stats.peakEmployees,
    finalEmployees: state.employees.length,
    reputation: state.company.reputation,
    score,
    rank,
  };
}
