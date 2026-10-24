import { newGame } from '../src/sim';
import type { GameState, Product } from '../src/sim';

export function freshGame(seed = 12345): GameState {
  return newGame({ companyName: 'Test Co', seed });
}

/** Builds a product directly (bypassing commands) for market-model tests. */
export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prd_test',
    name: 'Test Product',
    productTypeId: 'accounting',
    segmentId: 'mainframe',
    launchWeek: 0,
    price: 6000,
    marketingWeekly: 0,
    quality: 0.6,
    reviewScore: 6.4,
    bugs: 0,
    unitsSold: 0,
    revenue: 0,
    unitCarry: 0,
    recentWeeklyUnits: [],
    status: 'onSale',
    retiredWeek: null,
    ...overrides,
  };
}

/** Throws if any number anywhere in the state is NaN or infinite. */
export function assertFiniteNumbers(value: unknown, path = 'state'): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path} is ${value}`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => assertFiniteNumbers(v, `${path}[${i}]`));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) assertFiniteNumbers(v, `${path}.${k}`);
  }
}
