import type { MilestoneDef } from './types';

export const MILESTONES: readonly MilestoneDef[] = [
  { id: 'firstLaunch', metric: 'productsLaunched', threshold: 1, text: 'First product shipped!', important: false },
  { id: 'fiveLaunches', metric: 'productsLaunched', threshold: 5, text: 'Five products shipped.', important: false },
  { id: 'rev100k', metric: 'lifetimeRevenue', threshold: 100_000, text: 'Lifetime revenue passes $100k.', important: false },
  { id: 'rev1m', metric: 'lifetimeRevenue', threshold: 1_000_000, text: 'Lifetime revenue passes $1 million.', important: true },
  { id: 'rev10m', metric: 'lifetimeRevenue', threshold: 10_000_000, text: 'Lifetime revenue passes $10 million.', important: true },
  { id: 'rev100m', metric: 'lifetimeRevenue', threshold: 100_000_000, text: 'Lifetime revenue passes $100 million.', important: true },
  { id: 'cash1m', metric: 'cash', threshold: 1_000_000, text: 'A million dollars in the bank.', important: false },
  { id: 'staff10', metric: 'employees', threshold: 10, text: 'Ten people on the payroll. Time for a real office.', important: false },
  { id: 'staff50', metric: 'employees', threshold: 50, text: 'Fifty employees.', important: false },
  { id: 'rep50', metric: 'reputation', threshold: 50, text: 'The trade press knows your name.', important: false },
  { id: 'rep80', metric: 'reputation', threshold: 80, text: 'Your company is an industry household name.', important: true },
];
